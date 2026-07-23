from datetime import date, datetime, timedelta

from sqlalchemy import bindparam, text

from backend.src.models.models import (
    Attachment,
    DoctorAssessment,
    Hospital,
    PatientSession,
    ReminderEmailLog,
    User,
)
from backend.src.services import reminder_reports
from backend.src.services.reminder_reports import (
    ReminderRecipient,
    aggregate_recipients,
    build_report,
    hospital_recipients,
    is_due,
    quarter_bounds,
    send_report,
)
from backend.tests.conftest import TestQSession, TestSession


def add_questionnaire_session(
    q_db,
    session_id,
    hospital_name,
    submitted_at,
    *,
    questionnaire_complete=True,
    consent_url=None,
    blank_answer=False,
):
    q_db.execute(text("""
        INSERT INTO session_table
            (session_id, session_start_time, session_end_time,
             snehita_lifetime_risk, risk_category, consent_url)
        VALUES (:session_id, :submitted_at, :submitted_at,
                :risk, 'Evident Risk', :consent_url)
    """), {
        "session_id": session_id,
        "submitted_at": submitted_at.isoformat(),
        "risk": "0.5" if questionnaire_complete else None,
        "consent_url": consent_url,
    })
    q_db.execute(text("""
        INSERT INTO session_data_table
            (session_data_id, session_id, question, answer, created_at)
        VALUES (:row_id, :session_id, 'Q45', :hospital_name, :submitted_at)
    """), {
        "row_id": f"{session_id}-hospital",
        "session_id": session_id,
        "hospital_name": hospital_name,
        "submitted_at": submitted_at.isoformat(),
    })
    if blank_answer:
        q_db.execute(text("""
            INSERT INTO session_data_table
                (session_data_id, session_id, question, answer, created_at)
            VALUES (:row_id, :session_id, 'Q1', '', :submitted_at)
        """), {
            "row_id": f"{session_id}-blank",
            "session_id": session_id,
            "submitted_at": submitted_at.isoformat(),
        })
    q_db.commit()


def delete_questionnaire_sessions(q_db, session_ids):
    statement = text("DELETE FROM session_data_table WHERE session_id IN :ids").bindparams(
        bindparam("ids", expanding=True)
    )
    q_db.execute(statement, {"ids": session_ids})
    statement = text("DELETE FROM session_table WHERE session_id IN :ids").bindparams(
        bindparam("ids", expanding=True)
    )
    q_db.execute(statement, {"ids": session_ids})
    q_db.commit()


def cleanup_sessions(db, q_db, session_ids):
    delete_questionnaire_sessions(q_db, session_ids)
    assessment_ids = [row[0] for row in db.query(DoctorAssessment.id).filter(
        DoctorAssessment.patient_session_id.in_(session_ids)
    ).all()]
    if assessment_ids:
        db.query(Attachment).filter(
            Attachment.assessment_id.in_(assessment_ids)
        ).delete(synchronize_session=False)
    db.query(DoctorAssessment).filter(
        DoctorAssessment.patient_session_id.in_(session_ids)
    ).delete(synchronize_session=False)
    db.query(PatientSession).filter(PatientSession.id.in_(session_ids)).delete(
        synchronize_session=False
    )
    db.commit()


def add_assessment(db, doctor, hospital, session_id, complete=True):
    assessment = DoctorAssessment(
        patient_session_id=session_id,
        hospital_id=hospital.id,
        doctor_id=doctor.id,
        mammo_birads="2",
        mammo_density="B",
        us_biopsy_birads="2" if complete else None,
        us_biopsy_density="B" if complete else None,
        clinical_findings={"right": {"birads": "2", "density": "B"}},
        routine_views_uploaded=complete,
    )
    db.add(assessment)
    db.flush()
    view_types = (
        "mammo_cc_left",
        "mammo_cc_right",
        "mammo_mlo_left",
        "mammo_mlo_right",
    ) if complete else (
        "mammo_cc_left",
        "mammo_cc_right",
        "mammo_mlo_left",
    )
    attachment_types = list(view_types) + (["mammo_reading"] if complete else [])
    db.add_all([
        Attachment(
            assessment_id=assessment.id,
            file_type=file_type,
            file_name=f"{file_type}.dcm",
            storage_url=f"gs://test/{file_type}.dcm",
        )
        for file_type in attachment_types
    ])
    return assessment


def test_quarter_bounds():
    assert quarter_bounds(date(2026, 7, 21)) == (date(2026, 7, 1), date(2026, 10, 1))
    assert quarter_bounds(date(2026, 12, 31)) == (date(2026, 10, 1), date(2027, 1, 1))


def test_build_report_requires_all_five_data_point_components():
    db = TestSession()
    q_db = TestQSession()
    hospital = db.query(Hospital).filter(Hospital.id == "clinic_00001").one()
    doctor = db.query(User).filter(User.email == "doctor@test.com").one()
    session_ids = ["reminder-complete", "reminder-incomplete", "reminder-old"]
    try:
        db.add_all([
            PatientSession(id=session_id, hospital_id=hospital.id)
            for session_id in session_ids
        ])
        db.flush()
        add_questionnaire_session(
            q_db, session_ids[0], hospital.name, datetime(2026, 7, 2),
            consent_url="gs://test/consent-complete.pdf",
        )
        add_questionnaire_session(
            q_db, session_ids[1], hospital.name, datetime(2026, 8, 2),
            blank_answer=True,
        )
        add_questionnaire_session(
            q_db, session_ids[2], hospital.name, datetime(2026, 6, 30),
            consent_url="gs://test/consent-old.pdf",
        )
        add_assessment(db, doctor, hospital, session_ids[0], complete=True)
        add_assessment(db, doctor, hospital, session_ids[1], complete=False)
        add_assessment(db, doctor, hospital, session_ids[2], complete=True)
        db.commit()

        report = build_report(db, q_db, hospital, date(2026, 8, 10), target=200)
        assert report.lifetime_data_points == 2
        assert report.data_points == 1
        assert report.assessments_submitted == 2
        assert report.pending_submissions == 199
        assert report.current_quarter_records == 2
        assert report.missing_consent == 1
        assert report.missing_questionnaire_sessions == 0
        assert report.blank_questionnaire_sessions == 1
        assert report.missing_mammogram_views == 1
        assert report.missing_birads == 1
        assert report.missing_density == 1
        assert report.missing_mammogram_reports == 1
        assert report.mammogram_quality_flags == 1
    finally:
        cleanup_sessions(db, q_db, session_ids)
        q_db.close()
        db.close()


def test_pending_never_goes_below_zero():
    db = TestSession()
    q_db = TestQSession()
    hospital = db.query(Hospital).filter(Hospital.id == "clinic_00001").one()
    doctor = db.query(User).filter(User.email == "doctor@test.com").one()
    session_ids = [f"over-target-{index}" for index in range(3)]
    try:
        db.add_all([PatientSession(id=session_id, hospital_id=hospital.id) for session_id in session_ids])
        db.flush()
        for session_id in session_ids:
            add_questionnaire_session(
                q_db, session_id, hospital.name, datetime(2026, 7, 2),
                consent_url=f"gs://test/{session_id}.pdf",
            )
            add_assessment(db, doctor, hospital, session_id, complete=True)
        db.commit()
        report = build_report(db, q_db, hospital, date(2026, 8, 10), target=2)
        assert report.data_points == 3
        assert report.pending_submissions == 0
    finally:
        cleanup_sessions(db, q_db, session_ids)
        q_db.close()
        db.close()


def test_hospital_reports_go_to_every_active_account(monkeypatch):
    db = TestSession()
    monkeypatch.setattr(reminder_reports.settings, "REMINDER_RECIPIENT_EMAIL", "")
    try:
        recipients = hospital_recipients(db, "clinic_00001")
        assert {recipient.email for recipient in recipients} == {
            "admin@test.com", "doctor@test.com", "staff@test.com"
        }
    finally:
        db.close()


def test_pilot_override_replaces_hospital_and_aggregate_recipients(monkeypatch):
    db = TestSession()
    monkeypatch.setattr(
        reminder_reports.settings, "REMINDER_RECIPIENT_EMAIL", "manisha.verma@tanuh.ai"
    )
    try:
        assert [item.email for item in hospital_recipients(db, "clinic_00001")] == [
            "manisha.verma@tanuh.ai"
        ]
        assert [item.email for item in aggregate_recipients()] == ["manisha.verma@tanuh.ai"]
    finally:
        db.close()


def test_due_check_is_per_recipient_and_uses_last_successful_delivery():
    db = TestSession()
    report_date = date(2026, 8, 20)
    try:
        db.query(ReminderEmailLog).filter(
            ReminderEmailLog.hospital_id == "clinic_00001"
        ).delete(synchronize_session=False)
        db.add(ReminderEmailLog(
            report_type="hospital",
            hospital_id="clinic_00001",
            recipient_email="doctor@test.com",
            idempotency_key="due-check-doctor",
            report_date=date(2026, 8, 10),
            quarter_start=date(2026, 7, 1),
            quarter_end=date(2026, 10, 1),
            lifetime_data_points=10,
            data_points=10,
            assessments_submitted=8,
            pending_submissions=190,
            quarterly_target=200,
            status="sent",
            sent_at=datetime.combine(report_date - timedelta(days=13), datetime.min.time()),
        ))
        db.commit()
        assert is_due(
            db, "clinic_00001", report_date, 14,
            recipient_email="doctor@test.com",
        ) is False
        assert is_due(
            db, "clinic_00001", report_date, 14,
            recipient_email="admin@test.com",
        ) is True
    finally:
        db.query(ReminderEmailLog).filter(
            ReminderEmailLog.idempotency_key == "due-check-doctor"
        ).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_due_check_supports_five_minute_pilot_interval():
    db = TestSession()
    as_of = datetime(2026, 8, 20, 9, 0)
    try:
        db.add(ReminderEmailLog(
            report_type="hospital",
            hospital_id="clinic_00001",
            recipient_email="manisha.verma@tanuh.ai",
            idempotency_key="five-minute-check",
            report_date=date(2026, 8, 20),
            quarter_start=date(2026, 7, 1),
            quarter_end=date(2026, 10, 1),
            lifetime_data_points=10,
            data_points=10,
            assessments_submitted=8,
            pending_submissions=190,
            quarterly_target=200,
            status="sent",
            sent_at=as_of - timedelta(minutes=4),
        ))
        db.commit()
        assert is_due(
            db, "clinic_00001", as_of, 14, interval_minutes=5,
            recipient_email="manisha.verma@tanuh.ai",
        ) is False
        log = db.query(ReminderEmailLog).filter(
            ReminderEmailLog.idempotency_key == "five-minute-check"
        ).one()
        log.sent_at = as_of - timedelta(minutes=5)
        db.commit()
        assert is_due(
            db, "clinic_00001", as_of, 14, interval_minutes=5,
            recipient_email="manisha.verma@tanuh.ai",
        ) is True
    finally:
        db.query(ReminderEmailLog).filter(
            ReminderEmailLog.idempotency_key == "five-minute-check"
        ).delete(synchronize_session=False)
        db.commit()
        db.close()


def test_send_report_records_success_and_prevents_duplicate(monkeypatch):
    db = TestSession()
    q_db = TestQSession()
    hospital = db.query(Hospital).filter(Hospital.id == "clinic_00001").one()
    report_date = date(2026, 9, 1)
    recipient = ReminderRecipient("doctor@test.com", "Doctor")
    calls = []

    def fake_send(*args, **kwargs):
        calls.append((args, kwargs))
        return True

    monkeypatch.setattr(reminder_reports, "send_template_email", fake_send)
    try:
        db.query(ReminderEmailLog).filter(
            ReminderEmailLog.report_date == report_date,
            ReminderEmailLog.recipient_email == recipient.email,
        ).delete(synchronize_session=False)
        db.commit()
        report = build_report(db, q_db, hospital, report_date, target=200)
        first = send_report(db, report, recipient)
        second = send_report(db, report, recipient)
        assert first.status == "sent"
        assert first.sent_at is not None
        assert second.id == first.id
        assert len(calls) == 1
        assert calls[0][0][3]["pending_submissions"] == 200
        assert calls[0][1]["include_configured_cc"] is False
        assert calls[0][1]["from_email"] == "PinkShield AI <breastcancerscreening@tanuh.ai>"
    finally:
        db.query(ReminderEmailLog).filter(
            ReminderEmailLog.report_date == report_date,
            ReminderEmailLog.recipient_email == recipient.email,
        ).delete(synchronize_session=False)
        db.commit()
        db.close()
        q_db.close()


def test_new_five_minute_period_can_send_another_pilot_email(monkeypatch):
    db = TestSession()
    q_db = TestQSession()
    hospital = db.query(Hospital).filter(Hospital.id == "clinic_00001").one()
    recipient = ReminderRecipient("manisha.verma@tanuh.ai", "Pilot Reviewer")
    report_date = date(2026, 9, 2)
    calls = []

    monkeypatch.setattr(
        reminder_reports,
        "send_template_email",
        lambda *args, **kwargs: calls.append((args, kwargs)) or True,
    )
    try:
        db.query(ReminderEmailLog).filter(
            ReminderEmailLog.report_date == report_date,
            ReminderEmailLog.recipient_email == recipient.email,
        ).delete(synchronize_session=False)
        db.commit()
        report = build_report(db, q_db, hospital, report_date, target=200)

        first = send_report(db, report, recipient, idempotency_period="pilot-5m-100")
        duplicate = send_report(db, report, recipient, idempotency_period="pilot-5m-100")
        next_period = send_report(db, report, recipient, idempotency_period="pilot-5m-101")

        assert first.status == "sent"
        assert duplicate.id == first.id
        assert next_period.id != first.id
        assert len(calls) == 2
    finally:
        db.query(ReminderEmailLog).filter(
            ReminderEmailLog.report_date == report_date,
            ReminderEmailLog.recipient_email == recipient.email,
        ).delete(synchronize_session=False)
        db.commit()
        db.close()
        q_db.close()
