# WaitList/app.py
import os
import threading
import io
import pandas as pd
import requests
from datetime import datetime
from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# -----------------------------
# Configuration
# -----------------------------
# ⚠️ In production, set DATABASE_URL and RESEND_API_KEY in your hosting environment (Render, Vercel, etc.)
# DEFAULT_DB_URL = (
#     "postgresql+psycopg2://sabiway_user:DhtvXbF3dYD5oatHiszqmQt0gHFyFhz4"
#     "@dpg-d39varbuibrs73f74oe0-a.oregon-postgres.render.com/sabiway"
# )

DEFAULT_DB_URL = "sqlite:///waitlist.db"


app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", DEFAULT_DB_URL)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# -----------------------------
# Database Model
# -----------------------------
class Waitlist(db.Model):
    __tablename__ = "waitlist"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


with app.app_context():
    db.create_all()

# -----------------------------
# Resend Email Config
# -----------------------------
RESEND_API_KEY = "re_cV9BwHsi_GDtS6kPGHrTnJGpwD5Vf6HNQ" # set in environment
FROM_EMAIL = "info@sabiway.com"  # must be a verified domain in Resend
ADMIN_EMAIL = "info@sabiway.com"


# -----------------------------
# Email Helpers (Resend)
# -----------------------------
def send_confirmation_email(name: str, email: str):
    """Send welcome email to new waitlist member via Resend"""
    first_name = name.split()[0]
    subject = "Welcome to SabiWay – You’re on the Waitlist"
    body = f"""Hello {first_name},

You’ve been added to the SabiWay waitlist, thank you for signing up.

About SabiWay
SabiWay makes it easier for Nigerians at home and abroad to find trusted professionals. From electricians, plumbers, tailors, caterers, and printers to barbers, hairstylists, and event planners, SabiWay connects you to people you can rely on.

Our platform solves this by verifying professionals and securing payments through escrow, so services are delivered with trust and confidence.

Join the Momentum
SabiWay is more than an app, it’s a community. As we prepare to launch, we welcome partnerships, volunteers, and investment proposals. To get involved, reach us at info@sabiway.com.

You’ll be among the first to hear from us when SabiWay officially launches.

Thank you for joining us. Together, we’re building a smarter, safer way for Nigerians everywhere to connect and get things done.

Warm regards,  
The SabiWay Team  
info@sabiway.com
"""

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={
                "from": f"SabiWay <{FROM_EMAIL}>",
                "to": [email],
                "subject": subject,
                "text": body,
            },
            timeout=10,
        )
        response.raise_for_status()
        app.logger.info(f"Confirmation email sent to {email}")
    except Exception as e:
        app.logger.error(f"Email sending failed for {email}: {e}")


def send_admin_notification_email(name: str, email: str, created_at: str):
    """Notify admin that a new user joined the waitlist"""
    try:
        pretty_time = datetime.fromisoformat(created_at).strftime("%b %d, %Y — %I:%M %p")
    except Exception:
        pretty_time = created_at

    subject = "New Waitlist Signup – SabiWay"
    body = f"""Hello Team,

A new user has just joined the SabiWay waitlist.
 • Name: {name}
 • Email: {email}
 • Date/Time: {pretty_time}

They will be notified as soon as SabiWay officially launches.

Every signup brings us closer to launch, let’s keep building the smarter, safer way for Nigerians everywhere to connect and get things done.

Warm regards,  
SabiWay Notifications
"""

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={
                "from": f"SabiWay <{FROM_EMAIL}>",
                "to": [ADMIN_EMAIL],
                "subject": subject,
                "text": body,
            },
            timeout=10,
        )
        response.raise_for_status()
        app.logger.info(f"Admin notified about {email}")
    except Exception as e:
        app.logger.error(f"Admin notification failed for {email}: {e}")


def send_emails_async(name: str, email: str, created_at: str):
    """Send user confirmation + admin notification in background threads."""
    threading.Thread(target=send_confirmation_email, args=(name, email), daemon=True).start()
    threading.Thread(target=send_admin_notification_email, args=(name, email, created_at), daemon=True).start()

# -----------------------------
# API Routes
# -----------------------------
@app.route("/api/waitlist", methods=["POST"])
def join_waitlist():
    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()

    if not name or not email:
        return jsonify({"status": "error", "message": "Name and email are required."}), 400

    try:
        new_entry = Waitlist(name=name, email=email)
        db.session.add(new_entry)
        db.session.commit()

        created_at = new_entry.created_at.isoformat()
        send_emails_async(name, email, created_at)

        return jsonify({
            "status": "success",
            "message": "Signed up! If email delivery works, you’ll get a confirmation."
        }), 201
    except Exception as e:
        db.session.rollback()
        if "unique constraint" in str(e).lower():
            return jsonify({"status": "error", "message": "This email is already on the waitlist."}), 409
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/api/waitlist", methods=["GET"])
def list_waitlist():
    entries = Waitlist.query.order_by(Waitlist.created_at.desc()).all()
    result = [
        {
            "id": e.id,
            "name": e.name,
            "email": e.email,
            "created_at": e.created_at.isoformat()
        }
        for e in entries
    ]
    return jsonify({"status": "success", "data": result}), 200


@app.route("/api/waitlist/<int:entry_id>", methods=["DELETE"])
def delete_entry(entry_id):
    entry = Waitlist.query.get(entry_id)
    if not entry:
        return jsonify({"status": "error", "message": "Entry not found."}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({"status": "success", "message": f"Entry {entry_id} deleted."}), 200


@app.route("/api/waitlist/<int:entry_id>", methods=["PUT"])
def update_entry(entry_id):
    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()

    entry = Waitlist.query.get(entry_id)
    if not entry:
        return jsonify({"status": "error", "message": "Entry not found."}), 404

    if name:
        entry.name = name
    if email:
        entry.email = email

    try:
        db.session.commit()
        return jsonify({"status": "success", "message": f"Entry {entry_id} updated."}), 200
    except Exception as e:
        db.session.rollback()
        if "unique constraint" in str(e).lower():
            return jsonify({"status": "error", "message": "This email is already in use."}), 409
        return jsonify({"status": "error", "message": "Database error"}), 500


@app.route("/api/waitlist/export", methods=["GET"])
def export_waitlist():
    entries = Waitlist.query.all()
    df = pd.DataFrame([{
        "id": e.id,
        "name": e.name,
        "email": e.email,
        "created_at": e.created_at.strftime("%Y-%m-%d %H:%M:%S") if e.created_at else ""
    } for e in entries])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Waitlist")

    output.seek(0)
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="waitlist.xlsx"
    )


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

# -----------------------------
# Run
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=4000)
