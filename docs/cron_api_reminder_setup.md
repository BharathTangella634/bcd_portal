# GCP Cloud Scheduler Reminder API

## Endpoint and authentication

Cloud Scheduler calls:

`POST /api/internal/jobs/fortnightly-reminders`

The endpoint accepts optional `dry_run` and `hospital_id` query parameters. It does not accept recipients, subjects, or arbitrary message content.

Production requests require a Google-signed OIDC token. Configure `CRON_OIDC_AUDIENCE` as the exact public endpoint URL and `CRON_SERVICE_ACCOUNT_EMAIL` as the dedicated scheduler service account. Leave `CRON_SHARED_SECRET` empty in production. The backend verifies the token audience, verified email claim, and exact service-account identity.

For local testing only, `CRON_SHARED_SECRET` may be sent in `X-Cron-Secret`. Store it outside Git.

## Production schedule

Create the Scheduler job in project `bcd-prototypes` with these properties:

- Schedule: `0 9 * * 1`
- Time zone: `Asia/Kolkata`
- HTTP method: `POST`
- URL: the exact HTTPS Cron endpoint
- OIDC service account: the dedicated scheduler identity
- OIDC audience: the exact same endpoint URL
- Retry attempts: 3
- Retry delays: increasing from about 5 minutes to no more than 30 minutes

The weekly trigger plus the backend's per-recipient 14-day last-success check produces delivery every alternate Monday at 9:00 AM IST. It also prevents a late or retried job from creating duplicate successful deliveries.

## Runtime behavior

- Live delivery is rejected while `REMINDER_EMAIL_ENABLED=false`.
- Live delivery is rejected after an authorized operator disables reports.
- Live delivery is rejected while an authorized operator has paused reports.
- Authenticated dry runs remain available in both states.
- The initial hospital-email scope is restricted by `REMINDER_PILOT_HOSPITALS`.
- The aggregate report always covers all non-excluded hospitals.
- Each active hospital user and each aggregate recipient has an independent due check and audit record.
- A failed recipient makes the endpoint return HTTP 502 so Scheduler retries it.
- A previously successful recipient is skipped during the retry.
- Audit rows older than the configured 365-day retention are cleaned up during runs.

Do not enable the systemd reminder timer while Cloud Scheduler is active.

## Rollout sequence

1. Apply both reminder migrations to the development database.
2. Confirm exact pilot hospital identifiers and active user recipients using read-only queries.
3. Configure the sender, Cron OIDC values, and pilot override with live delivery disabled.
4. Invoke one authenticated dry run and reconcile all metrics.
5. Perform the five-minute internal pilot to `manisha.verma@tanuh.ai`.
6. Restore the production interval and remove the recipient override.
7. Verify SPF, DKIM, DMARC, sender alignment, and the final templates.
8. Enable live delivery and the Monday Scheduler job for the two pilot institutions.
9. Monitor the first two successful biweekly cycles before clearing the pilot-hospital restriction.
