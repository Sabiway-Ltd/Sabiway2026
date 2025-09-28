# accounts/email_utils.py

import resend
from django.conf import settings

resend.api_key = settings.RESEND_API_KEY

def send_resend_email(to, subject, body):
    try:
        params = {
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": f"<p>{body}</p>",
        }
        resend.Emails.send(params)
    except Exception as e:
        print("Resend email error:", e)
