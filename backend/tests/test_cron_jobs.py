from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from backend.src.api import jobs


def test_cron_endpoint_rejects_unauthenticated_request(monkeypatch):
    monkeypatch.setattr(jobs.settings, "CRON_SHARED_SECRET", "")
    monkeypatch.setattr(jobs.settings, "CRON_OIDC_AUDIENCE", "https://example.test/api/internal/jobs/fortnightly-reminders")
    monkeypatch.setattr(jobs.settings, "CRON_SERVICE_ACCOUNT_EMAIL", "scheduler@example.test")

    with pytest.raises(HTTPException) as exc_info:
        jobs.verify_cron_identity(authorization=None, x_cron_secret=None)
    assert exc_info.value.status_code == 401


def test_cron_endpoint_runs_safe_dry_run_with_local_secret(monkeypatch):
    monkeypatch.setattr(jobs.settings, "CRON_SHARED_SECRET", "test-only-secret")
    monkeypatch.setattr(jobs, "run_reminders", lambda *args, **kwargs: [
        SimpleNamespace(status="dry_run"),
        SimpleNamespace(status="dry_run"),
    ])
    monkeypatch.setattr(jobs, "is_delivery_paused", lambda db: False)
    monkeypatch.setattr(jobs, "is_delivery_disabled", lambda db: False)

    identity = jobs.verify_cron_identity(
        authorization=None,
        x_cron_secret="test-only-secret",
    )
    response = jobs.trigger_fortnightly_reminders(
        dry_run=True,
        hospital_id="clinic_00001",
        db=object(),
        questionnaire_db=object(),
        _identity=identity,
    )

    assert response == {
        "success": True,
        "processed": 2,
        "sent": 0,
        "failed": 0,
        "dryRun": 2,
    }


def test_cron_endpoint_will_not_send_when_delivery_disabled(monkeypatch):
    monkeypatch.setattr(jobs.settings, "CRON_SHARED_SECRET", "test-only-secret")
    monkeypatch.setattr(jobs.settings, "REMINDER_EMAIL_ENABLED", False)

    with pytest.raises(HTTPException) as exc_info:
        jobs.trigger_fortnightly_reminders(
            dry_run=False,
            hospital_id=None,
            db=object(),
            questionnaire_db=object(),
            _identity={"authentication": "shared-secret"},
        )
    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "Reminder email delivery is disabled"


def test_cron_endpoint_will_not_send_when_paused(monkeypatch):
    monkeypatch.setattr(jobs.settings, "REMINDER_EMAIL_ENABLED", True)
    monkeypatch.setattr(jobs, "is_delivery_disabled", lambda db: False)
    monkeypatch.setattr(jobs, "is_delivery_paused", lambda db: True)

    with pytest.raises(HTTPException) as exc_info:
        jobs.trigger_fortnightly_reminders(
            dry_run=False,
            hospital_id=None,
            db=object(),
            questionnaire_db=object(),
            _identity={"authentication": "shared-secret"},
        )
    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "Reminder email delivery is paused"


def test_cron_endpoint_returns_retryable_error_when_a_delivery_fails(monkeypatch):
    monkeypatch.setattr(jobs.settings, "REMINDER_EMAIL_ENABLED", True)
    monkeypatch.setattr(jobs, "is_delivery_disabled", lambda db: False)
    monkeypatch.setattr(jobs, "is_delivery_paused", lambda db: False)
    monkeypatch.setattr(jobs, "run_reminders", lambda *args, **kwargs: [
        SimpleNamespace(status="sent"),
        SimpleNamespace(status="failed"),
    ])

    with pytest.raises(HTTPException) as exc_info:
        jobs.trigger_fortnightly_reminders(
            dry_run=False,
            hospital_id=None,
            db=object(),
            questionnaire_db=object(),
            _identity={"authentication": "shared-secret"},
        )
    assert exc_info.value.status_code == 502
    assert exc_info.value.detail["sent"] == 1
    assert exc_info.value.detail["failed"] == 1
