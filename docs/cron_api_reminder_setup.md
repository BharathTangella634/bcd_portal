# GCP Cloud Scheduler Reminder API

## Design

GCP Cloud Scheduler calls the internal backend endpoint once per day. The endpoint invokes the existing reminder service, which independently checks the last successful delivery and sends only when the configured interval (14 days in production) has elapsed.

Endpoint:

`POST /api/internal/jobs/fortnightly-reminders`

This endpoint does not accept arbitrary recipients, subjects, or email bodies. It uses the existing hospital/report configuration, database template, delivery audit, and duplicate-prevention flow.

## Authentication

Production requests must use an OIDC token issued for a dedicated Cloud Scheduler service account. Configure:

- `CRON_OIDC_AUDIENCE`: the exact public HTTPS endpoint URL.
- `CRON_SERVICE_ACCOUNT_EMAIL`: the dedicated scheduler service-account email.
- `CRON_SHARED_SECRET`: leave empty in production.

The endpoint verifies the Google-signed token, audience, verified email, and exact service-account identity.

For controlled local testing only, `CRON_SHARED_SECRET` can be set and supplied through the `X-Cron-Secret` header. It must not be committed or used as the production authentication method.

## Safety controls

- Delivery returns an error while `REMINDER_EMAIL_ENABLED=false`.
- Authenticated dry runs remain available while delivery is disabled.
- The normal 14-day eligibility guard remains active.
- The existing audit table records dry runs, successes, and failures.
- No patient-level data is returned by the endpoint.
- The endpoint reports only aggregate execution counts.

## Cloud Scheduler configuration

Create a dedicated service account in project `bcd-prototypes` and grant only the permissions required to mint an OIDC token for the scheduler request. Configure a daily HTTP job at approximately 9:00 AM Asia/Kolkata with method `POST`, the internal endpoint URL, and an OIDC token whose audience exactly matches `CRON_OIDC_AUDIENCE`.

Cloud Scheduler may retry transient failures. Application idempotency and the reminder delivery log prevent an already successful same-period report from being sent again.

Do not enable the existing systemd timer when Cloud Scheduler is active. Only one scheduling mechanism should own the trigger.

## Pilot

1. Keep reminder delivery disabled.
2. Configure the test recipient override.
3. Invoke the endpoint with `dry_run=true` for one hospital.
4. Reconcile the calculated figures manually.
5. Configure SMTP securely and perform one controlled delivery.
6. Confirm the audit record and duplicate prevention.
7. Restore the 14-day production interval and approved recipient policy.
8. Enable the Cloud Scheduler job and monitor its first two cycles.
