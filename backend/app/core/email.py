import logging
import smtplib
from email.message import EmailMessage
from urllib.parse import quote

from app.core.config import settings

logger = logging.getLogger("neurax.email")


def password_reset_delivery_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USERNAME and settings.SMTP_PASSWORD and settings.SMTP_FROM)


def send_password_reset(email: str, token: str) -> bool:
    """Send a real reset link only when SMTP is fully configured; never expose its token elsewhere."""
    if not password_reset_delivery_configured():
        logger.warning("Password reset requested but SMTP is not configured.")
        return False

    reset_url = f"{settings.RESET_URL_BASE}?token={quote(token, safe='')}"
    message = EmailMessage()
    message["Subject"] = "Reset your APORIA TRACE password"
    message["From"] = settings.SMTP_FROM
    message["To"] = email
    message.set_content(
        "A password reset was requested for your APORIA TRACE account.\n\n"
        f"Open this link to choose a new password (valid for 30 minutes):\n{reset_url}\n\n"
        "If you did not request this, you can ignore this message."
    )
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
        return True
    except (OSError, smtplib.SMTPException):
        logger.exception("Password reset email delivery failed.")
        return False
