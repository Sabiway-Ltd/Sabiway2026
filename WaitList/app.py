import os
import sqlite3
from contextlib import closing
from flask import Flask, request, jsonify
from email.message import EmailMessage
import smtplib

# -----------------------------
# Configuration
# -----------------------------
DATABASE = "sabiway.db"
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "sabiway1@gmail.com"
SMTP_PASS = "fflg gaow uwpw snfr"  # ⚠️ For real use, keep this in env var instead
FROM_NAME = "SabiWay"
FROM_EMAIL = SMTP_USER

app = Flask(__name__)

# -----------------------------
# Database setup
# -----------------------------
def init_db():
    with closing(sqlite3.connect(DATABASE)) as db:
        c = db.cursor()
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS waitlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.commit()

init_db()

# -----------------------------
# API Routes
# -----------------------------
@app.route("/api/waitlist", methods=["POST"])
def join():
    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()

    if not name or not email:
        return jsonify({"status": "error", "message": "Name and email are required."}), 400

    first_name = name.split()[0]

    try:
        with sqlite3.connect(DATABASE) as conn:
            c = conn.cursor()
            c.execute("INSERT INTO waitlist (name, email) VALUES (?, ?)", (name, email))
            conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"status": "error", "message": "This email is already on the waitlist."}), 409

    try:
        msg = EmailMessage()
        msg["Subject"] = "Thanks for joining the SabiWay waitlist!"
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = email
        msg.set_content(
            f"Hi {first_name},\n\nThanks for joining the SabiWay waitlist. We'll email you when we launch.\n\n— The SabiWay Team"
        )

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASS)
            smtp.send_message(msg)
    except Exception:
        app.logger.exception("Failed to send email")
        return jsonify({"status": "warning", "message": "Joined but confirmation email failed."}), 202

    return jsonify({"status": "success", "message": "Signed up! Check your inbox for confirmation."}), 201


@app.route("/api/waitlist", methods=["GET"])
def list_waitlist():
    with sqlite3.connect(DATABASE) as conn:
        c = conn.cursor()
        c.execute("SELECT id, name, email, created_at FROM waitlist ORDER BY created_at DESC")
        rows = c.fetchall()
    result = [
        {"id": r[0], "name": r[1], "email": r[2], "created_at": r[3]} for r in rows
    ]
    return jsonify(result)


@app.route("/api/waitlist/<int:entry_id>", methods=["DELETE"])
def delete_entry(entry_id):
    with sqlite3.connect(DATABASE) as conn:
        c = conn.cursor()
        c.execute("DELETE FROM waitlist WHERE id = ?", (entry_id,))
        conn.commit()
        if c.rowcount == 0:
            return jsonify({"status": "error", "message": "Entry not found."}), 404
    return jsonify({"status": "success", "message": f"Entry {entry_id} deleted."}), 200


@app.route("/api/waitlist/<int:entry_id>", methods=["PUT"])
def update_entry(entry_id):
    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()

    if not name and not email:
        return jsonify({"status": "error", "message": "Name or email must be provided."}), 400

    try:
        with sqlite3.connect(DATABASE) as conn:
            c = conn.cursor()
            if name and email:
                c.execute("UPDATE waitlist SET name = ?, email = ? WHERE id = ?", (name, email, entry_id))
            elif name:
                c.execute("UPDATE waitlist SET name = ? WHERE id = ?", (name, entry_id))
            elif email:
                c.execute("UPDATE waitlist SET email = ? WHERE id = ?", (email, entry_id))
            conn.commit()
            if c.rowcount == 0:
                return jsonify({"status": "error", "message": "Entry not found."}), 404
    except sqlite3.IntegrityError:
        return jsonify({"status": "error", "message": "This email is already in use."}), 409

    return jsonify({"status": "success", "message": f"Entry {entry_id} updated."}), 200


# -----------------------------
# Run
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
