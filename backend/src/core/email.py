import re
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from .config import settings

logger = logging.getLogger(__name__)

LOGIN_URL = "https://bc-portal-dev.tanuh.ai/login"


def send_email(to_email: str, subject: str, html: str):
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured — skipping email to %s", to_email)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], to_email, msg.as_string())
        logger.info("Email sent to %s (subject: %s)", to_email, subject)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)


def _render(template_str: str, variables: dict) -> str:
    def replacer(match):
        key = match.group(1)
        return str(variables.get(key, match.group(0)))
    return re.sub(r"\{\{(\w+)\}\}", replacer, template_str)


def send_template_email(db: Session, template_key: str, to_email: str, variables: dict):
    from ..models.models import EmailTemplate

    template = db.query(EmailTemplate).filter(EmailTemplate.template_key == template_key).first()
    if not template:
        logger.warning("Email template '%s' not found in DB — skipping email to %s", template_key, to_email)
        return

    variables.setdefault("login_url", LOGIN_URL)

    subject = _render(template.subject, variables)
    html = _render(template.body_html, variables)
    send_email(to_email, subject, html)
