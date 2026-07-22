import logging
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from google.auth import exceptions as google_auth_exceptions
from google.auth.transport import requests as google_auth_requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

from ..core.config import settings
from ..db.session import get_db, get_questionnaire_db
from ..services.reminder_reports import is_delivery_disabled, is_delivery_paused, run_reminders

router = APIRouter()
logger = logging.getLogger(__name__)


def verify_cron_identity(
    authorization: Optional[str] = Header(None),
    x_cron_secret: Optional[str] = Header(None),
):
    """Authenticate GCP Cloud Scheduler OIDC, with an explicit local-test fallback."""
    if settings.CRON_SHARED_SECRET and x_cron_secret:
        if secrets.compare_digest(x_cron_secret, settings.CRON_SHARED_SECRET):
            return {"authentication": "shared-secret"}

    if not settings.CRON_OIDC_AUDIENCE or not settings.CRON_SERVICE_ACCOUNT_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cron OIDC authentication is not configured",
        )

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing scheduler identity token",
        )

    token = authorization.removeprefix("Bearer ").strip()
    try:
        claims = id_token.verify_oauth2_token(
            token,
            google_auth_requests.Request(),
            audience=settings.CRON_OIDC_AUDIENCE,
        )
    except (ValueError, google_auth_exceptions.GoogleAuthError) as exc:
        logger.warning("Rejected cron identity token: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid scheduler identity token",
        ) from exc

    token_email = claims.get("email", "").lower()
    expected_email = settings.CRON_SERVICE_ACCOUNT_EMAIL.lower()
    if token_email != expected_email or claims.get("email_verified") is not True:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Scheduler service account is not authorized",
        )

    return claims


@router.post("/fortnightly-reminders")
def trigger_fortnightly_reminders(
    dry_run: bool = Query(False),
    hospital_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    questionnaire_db: Session = Depends(get_questionnaire_db),
    _identity: dict = Depends(verify_cron_identity),
):
    """Cloud Scheduler entry point. The service retains the 14-day due check."""
    if not settings.REMINDER_EMAIL_ENABLED and not dry_run:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reminder email delivery is disabled",
        )
    if not dry_run and is_delivery_disabled(db):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reminder email delivery was disabled by an authorized operator",
        )
    if not dry_run and is_delivery_paused(db):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reminder email delivery is paused",
        )

    results = run_reminders(
        db,
        questionnaire_db,
        hospital_id=hospital_id,
        dry_run=dry_run,
    )
    statuses = {"sent": 0, "failed": 0, "dry_run": 0}
    for result in results:
        if result.status in statuses:
            statuses[result.status] += 1

    response = {
        "success": statuses["failed"] == 0,
        "processed": len(results),
        "sent": statuses["sent"],
        "failed": statuses["failed"],
        "dryRun": statuses["dry_run"],
    }
    if statuses["failed"]:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=response,
        )
    return response
