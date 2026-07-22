# PinkShield AI Biweekly Reminder Operations

## Approved report definition

A complete patient data point requires all five of the following components:

1. A stored consent document.
2. A completed questionnaire (`snehita_lifetime_risk` is populated).
3. All four standard mammogram views: left/right CC and left/right MLO.
4. BIRADS for both breasts.
5. ACR breast density for both breasts.

Each hospital report contains complete data points across all time, complete data points in the current calendar quarter, assessments submitted for current-quarter records, and the current-quarter remainder against the minimum target of 200. The remainder never becomes negative, and reports continue after 200 is reached.

The data-quality section covers current-quarter records and reports missing consent, incomplete questionnaires, stored blank questionnaire fields, missing standard views, missing bilateral BIRADS, missing bilateral ACR density, missing mammogram reports, and assessments where routine-view completion was not confirmed. These checks inspect database fields and upload presence only; they do not analyse mammogram pixels or make clinical judgements.

Historical-quarter target shortfalls are intentionally excluded because their definition was not approved.

## Recipients and sender

Hospital reports are sent separately to every active user account associated with that hospital. Individual delivery prevents one hospital user from seeing other recipients' addresses and provides per-recipient auditing and retry safety.

The all-hospitals report is sent separately to:

- `ashwin.rajkumar@tanuh.ai`
- `vaishnavi.joshi@tanuh.ai`

It includes every non-excluded institution, including institutions with zero complete submissions, in a single aggregate table.

The approved sender is `PinkShield AI <breastcancerscreening@tanuh.ai>`. Reminder templates ignore database-configured CC lists so recipients are controlled only by the active-user and aggregate-recipient rules. The footer identifies the message as an automated one-way notice and patient identifiers are never included.

## Configuration

Production configuration and credentials must be stored in Google Secret Manager, using the repository's `bcd-` secret prefix, or supplied as protected runtime environment variables:

- `SMTP_HOST` and `SMTP_PORT`
- `SMTP_USER` and `SMTP_PASSWORD`
- `REMINDER_FROM_EMAIL` (defaults to the approved PinkShield AI sender)
- `REMINDER_EMAIL_ENABLED` (keep `false` until pilot approval)
- `REMINDER_RECIPIENT_EMAIL` (pilot-only override; empty in production)
- `REMINDER_QUARTERLY_TARGET` (default `200`)
- `REMINDER_INTERVAL_DAYS` (default `14`)
- `REMINDER_INTERVAL_MINUTES` (default `0`; pilot-only when non-zero)
- `REMINDER_PILOT_HOSPITALS` (defaults to `Shanmuga,Sudarshana Scans`; values may be exact names, short names, or IDs)
- `REMINDER_EXCLUDED_HOSPITALS` (defaults to `Test,Tanuh Foundation`)
- `REMINDER_AGGREGATE_RECIPIENTS`
- `REMINDER_OPERATOR_EMAILS`
- `REMINDER_PORTAL_URL`, `REMINDER_TIMEZONE`, and `REMINDER_LOG_RETENTION_DAYS`
- `CRON_OIDC_AUDIENCE` and `CRON_SERVICE_ACCOUNT_EMAIL`

Do not use or commit a normal Google account password. Use a Google Workspace-approved App Password or SMTP relay credential. Before rollout, the Workspace administrator must verify sender authorization and SPF, DKIM, and DMARC alignment. Those controls materially reduce spam placement but no application can guarantee a specific inbox placement.

For local work without Google credentials, set `DISABLE_SECRET_MANAGER=true`; explicit local environment values and safe defaults will then be used without attempting Secret Manager calls.

## Database setup

Apply both migrations to the main application database, in order:

1. `database/migrations/20260721_add_reminder_email_reporting.sql`
2. `database/migrations/20260722_expand_reminder_reporting.sql`

The second migration enables one audited row per recipient and report, aggregate-report deliveries, complete-data-point fields, retry attempt counts, idempotency, and persistent pause/resume state. It also installs the finalized hospital and all-hospitals email templates.

Before applying migrations, take a database backup and confirm that the first migration has not already been modified or partially applied. Apply them to the development Cloud SQL instance first.

## Authorized management

Only active PinkShield accounts whose exact email appears in `REMINDER_OPERATOR_EMAILS` may access the management API. The approved defaults are:

- `bharath.tangella@tanuh.ai`
- `ashwin.rajkumar@tanuh.ai`
- `vaishnavi.joshi@tanuh.ai`
- `palivela.sanjana@tanuh.ai`

Authenticated management endpoints are available under `/api/v1/reminders`:

- `GET /status` shows the feature flag, runtime pause state, interval, target, and aggregate recipients.
- `GET /preview` calculates hospital reports without logging or sending an email.
- `POST /resend` performs an intentional manual delivery and creates a distinct audit attempt.
- `POST /pause` immediately blocks scheduled and manual live delivery while retaining previews and scheduler dry runs.
- `POST /resume` removes the runtime pause; the deployment-level `REMINDER_EMAIL_ENABLED` flag must still be enabled.
- `POST /disable` persistently disables scheduled and manual live delivery.
- `POST /enable` removes the operator-level disable; both the deployment flag and pause state must also allow delivery.

The scheduler endpoint remains separate and accepts only its configured GCP service-account identity (or the explicitly configured local test secret).

## Pilot and validation

The initial institutional pilot is limited by default to Shanmuga and Sudarshana Scans. The all-hospitals summary still covers every real institution. Before the pilot, query Cloud SQL read-only to confirm the exact hospital names/short names/IDs, active-account counts, consent population, session-to-hospital mapping, assessment fields, and attachment types. A name mismatch intentionally results in no hospital email rather than accidentally expanding the pilot.

For the five-minute local pilot:

1. Set `REMINDER_RECIPIENT_EMAIL=manisha.verma@tanuh.ai`.
2. Set `REMINDER_INTERVAL_MINUTES=5` and keep `REMINDER_INTERVAL_DAYS=14`.
3. Keep live delivery disabled for the first preview/dry run.
4. Compare each metric against read-only database queries for both pilot hospitals.
5. Enable one controlled SMTP delivery and inspect sender, recipient, subject, content, SPF/DKIM/DMARC results, links, and privacy.
6. Confirm that a repeat before five minutes is skipped and a run at or after five minutes is eligible.
7. Restore `REMINDER_RECIPIENT_EMAIL` to empty and `REMINDER_INTERVAL_MINUTES=0` before production rollout.

## Scheduling, failures, and retention

Production Cloud Scheduler invokes `POST /api/internal/jobs/fortnightly-reminders` each Monday at 9:00 AM in `Asia/Kolkata`. The application checks each recipient's last successful delivery and sends only after 14 days, which creates the alternate-Monday schedule and ensures a newly added institutional account can receive its first report.

If any recipient delivery fails, the Cron API returns HTTP 502. Cloud Scheduler should be configured for three attempts with increasing delays of approximately 5, 15, and 30 minutes. Successful recipients are protected by per-recipient idempotency and are not resent during a retry; only unsuccessful recipients remain eligible. Cloud Monitoring should alert the rollout owner when the job exhausts its retries, because SMTP-wide failures may also prevent an email-based failure notice.

Delivery audit rows are retained for 365 days by default. Old rows are removed automatically when the job runs. The audit contains aggregate metrics, recipient, status, attempt count, timestamps, and errors, but no patient identifiers or clinical records.

Use either Cloud Scheduler or the provided systemd timer, never both.
