"""Hospital-scoped access checks shared by clinician-facing endpoints."""

from sqlalchemy import text

from ..models.models import Hospital, PatientSession


INSTITUTE_QUESTIONS = (
    "Institute Name",
    "Institute Name:",
    "Enter the Hospital ID(If any, else leave):",
    "Q45",
)


def session_belongs_to_hospital(app_db, questionnaire_db, session_id, hospital_id):
    """Return True only when the session is owned by the supplied hospital."""
    app_session = app_db.query(PatientSession).filter(
        PatientSession.id == session_id
    ).first()
    if app_session:
        return app_session.hospital_id == hospital_id

    hospital_name = app_db.query(Hospital.name).filter(
        Hospital.id == hospital_id
    ).scalar()
    if not hospital_name:
        return False

    row = questionnaire_db.execute(text("""
        SELECT 1
        FROM session_data_table
        WHERE session_id = :session_id
          AND question IN (
              'Institute Name', 'Institute Name:',
              'Enter the Hospital ID(If any, else leave):', 'Q45'
          )
          AND answer = :hospital_name
        LIMIT 1
    """), {
        "session_id": session_id,
        "hospital_name": hospital_name,
    }).fetchone()
    return row is not None
