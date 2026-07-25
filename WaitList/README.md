# SabiWay Waitlist System

This project provides a complete waitlist system for **SabiWay**, including:

* 🌐 **Frontend Landing Page** (User-facing waitlist signup)
* 🛠 **Backend API** (Flask + PostgreSQL + Email notifications)
* 📊 **Admin Dashboard** (Manage waitlist entries and export data)

---

## 📅 Project Information

* **Founder & Product Owner:** Johnson Taiwo
* **Date Completed:** September 24, 2025
* **Developed By:** ChiAde Tech
* **Authors:**

  * Chiamaka Nwankwu
  * Adesina Olagunju

See [../Documentation/Waitlist_Documentation.md](../Documentation/Waitlist_Documentation.md) for the full technical documentation of this system, including its API surface and known issues.

---

## 🚀 Features

### Frontend

* Responsive landing page built with TailwindCSS
* Waitlist signup form connected to backend API
* Popup notifications for success/error states
* Mobile-friendly navigation and layout
* Links to SabiWay social platforms

### Backend

* REST API built with Flask
* Database: PostgreSQL (via SQLAlchemy ORM)
* Email notifications powered by **Resend API**

  * Sends confirmation email to user
  * Sends admin notification email for each new signup
* Background threading for non-blocking email delivery
* Export waitlist entries as Excel (.xlsx) file
* CRUD operations: Add, List, Update, Delete waitlist entries

### Admin Dashboard

* Responsive admin UI built with HTML + TailwindCSS
* Fetches data from backend API
* CRUD actions (Add, Edit, Delete entries)
* Toast notifications for all actions
* Excel download button to export the full waitlist

---

## 🛠️ Tools & Technologies

### Backend

* Python 3
* Flask (Web framework)
* Flask-CORS (CORS support for API)
* Flask-SQLAlchemy (ORM for PostgreSQL)
* PostgreSQL (Database)
* SQLAlchemy (ORM)
* psycopg2 (Postgres driver)
* Pandas (Export waitlist to Excel)
* OpenPyXL (Excel file writing engine)
* Requests (Send emails via Resend API)
* Threading (Asynchronous email sending)

### Frontend

* HTML5 / CSS3 / JavaScript
* TailwindCSS (Utility-first CSS framework)
* Google Fonts (Plus Jakarta Sans)
* Axios (HTTP client for API integration)

### Admin Dashboard

* HTML + JavaScript
* TailwindCSS
* Fetch API (API requests to backend)

---

## 📂 Project Structure

```
app.py        # Flask API server
index.html    # User-facing waitlist landing page
admin.html    # Admin dashboard for managing waitlist
```

---

## ⚡ API Endpoints

**Base URL:**
`https://sabiwaywaitlist.onrender.com/api/waitlist`

**Endpoints:**

* `POST /` → Join waitlist (name, email)
* `GET /` → List all waitlist entries
* `PUT /<id>` → Update a waitlist entry
* `DELETE /<id>` → Delete a waitlist entry
* `GET /export` → Export waitlist as Excel

---

## 📧 Email Flow

* **User Signup** → Confirmation email sent to user
* **Admin Notification** → Email sent to admin (`info@sabiway.com`)

---

## 📦 Deployment

* **Backend:** Render (Flask + PostgreSQL)
* **Frontend:** Static hosting (`www.sabiway.com`)
* **Admin Dashboard:** Static hosting (`www.sabiway.com/admin-waitlist-555`)

---

## ✅ Usage

1. Clone repo & set up environment
2. Install backend dependencies:

   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment variables:

   * `DATABASE_URL` (PostgreSQL connection)
   * `RESEND_API_KEY` (Email service key)
4. Run Flask backend:

   ```bash
   python app.py
   ```
5. Open **frontend** (`index.html`) in a browser and connect to backend API
6. Use **admin dashboard** (`admin.html`) for management

---

## 📜 License

This project is developed by **ChiAde Tech** for **SabiWay Technologies Ltd.**
All rights reserved © 2025.
