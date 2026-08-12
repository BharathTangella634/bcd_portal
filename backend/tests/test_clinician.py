"""Tests for clinician UI endpoints: doctor sessions, assessments, file uploads."""
import uuid
from sqlalchemy import text

from .conftest import get_token, TestSession, TestQSession
from backend.src.core.security import get_password_hash
from backend.src.models.models import DoctorAssessment, Hospital, PatientSession, Role, User


class TestDoctorSessions:
    def test_list_sessions_empty(self, client, seed_hospital_and_user):
        token = get_token("Doctor", "doctor@test.com")
        res = client.get("/api/v1/doctor/sessions", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_sessions_unauthorized(self, client):
        res = client.get("/api/v1/doctor/sessions")
        assert res.status_code == 401

    def test_session_detail_not_found(self, client, seed_hospital_and_user):
        token = get_token("Doctor", "doctor@test.com")
        res = client.get("/api/v1/doctor/sessions/99999", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 404


class TestPatientConsent:
    def test_consent_without_file(self, client, seed_hospital_and_user):
        token = get_token("Staff", "staff@test.com")
        res = client.post(
            "/api/v1/patient/consent",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "id" in data

    def test_consent_unauthorized(self, client):
        res = client.post("/api/v1/patient/consent")
        assert res.status_code == 401


class TestAssessment:
    def _create_session(self, client, token):
        res = client.post("/api/v1/patient/consent", headers={"Authorization": f"Bearer {token}"})
        return res.json()["id"]

    def test_create_assessment_basic(self, client, seed_hospital_and_user):
        token = get_token("Doctor", "doctor@test.com")
        session_id = self._create_session(client, get_token("Staff", "staff@test.com"))

        res = client.post("/api/v1/patient/assessment", data={
            "patient_session_id": session_id,
            "questionnaire_feedback": "Looks good",
            "is_questionnaire_correct": "true",
            "mammo_birads": "2",
            "mammo_density": "B",
            "us_biopsy_birads": "",
            "us_biopsy_density": "",
            "precision_diagnosis": "",
            "datapoint_feedback": "",
            "clinical_findings": '{"right": {"masses": false, "birads": "2", "density": "B"}, "left": {"masses": false, "birads": "1", "density": "A"}}',
            "recommendation_followup": "Routine screening in 1 year",
            "routine_views_uploaded": "true",
        }, headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200

    def test_assessment_missing_session(self, client, seed_hospital_and_user):
        token = get_token("Doctor", "doctor@test.com")
        res = client.post("/api/v1/patient/assessment", data={
            "patient_session_id": 99999,
            "is_questionnaire_correct": "false",
            "mammo_birads": "",
            "mammo_density": "",
            "us_biopsy_birads": "",
            "us_biopsy_density": "",
            "precision_diagnosis": "",
            "datapoint_feedback": "",
            "routine_views_uploaded": "false",
        }, headers={"Authorization": f"Bearer {token}"})
        assert res.status_code in [404, 500]

    def test_assessment_unauthorized(self, client):
        res = client.post("/api/v1/patient/assessment", data={
            "patient_session_id": 1,
            "is_questionnaire_correct": "false",
        })
        assert res.status_code == 401

    def test_clinicians_in_same_hospital_can_edit_shared_assessment(
        self, client, seed_hospital_and_user
    ):
        session_id = f"shared_{uuid.uuid4().hex[:10]}"
        db = TestSession()
        q_db = TestQSession()
        try:
            role = db.query(Role).filter(Role.name == "Clinician").first()
            owner = db.query(User).filter(User.email == "doctor@test.com").first()
            colleague = User(
                email=f"colleague-{uuid.uuid4().hex[:8]}@test.com",
                password_hash=get_password_hash("password123"),
                hospital_id="clinic_00001",
                role_id=role.id,
                is_active=True,
                full_name="Dr. Colleague",
            )
            db.add(colleague)
            db.add(PatientSession(id=session_id, hospital_id="clinic_00001"))
            db.flush()
            db.add(DoctorAssessment(
                patient_session_id=session_id,
                hospital_id="clinic_00001",
                doctor_id=owner.id,
                doctor_case_notes="Original notes",
            ))
            db.commit()

            q_db.execute(text("""
                INSERT INTO session_table
                    (session_id, session_start_time, snehita_lifetime_risk, risk_category)
                VALUES (:sid, '2026-08-11', '25', 'Baseline Risk')
            """), {"sid": session_id})
            q_db.commit()

            token = get_token("Clinician", colleague.email, "clinic_00001")
            response = client.post(
                "/api/v1/patient/assessment",
                data={
                    "patient_session_id": session_id,
                    "is_questionnaire_correct": "true",
                    "doctor_case_notes": "Updated by hospital colleague",
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 200
            db.expire_all()
            assessment = db.query(DoctorAssessment).filter(
                DoctorAssessment.patient_session_id == session_id
            ).first()
            assert assessment.doctor_case_notes == "Updated by hospital colleague"
        finally:
            q_db.execute(text("DELETE FROM session_data_table WHERE session_id = :sid"), {"sid": session_id})
            q_db.execute(text("DELETE FROM session_table WHERE session_id = :sid"), {"sid": session_id})
            q_db.commit()
            db.query(DoctorAssessment).filter(DoctorAssessment.patient_session_id == session_id).delete()
            db.query(PatientSession).filter(PatientSession.id == session_id).delete()
            db.query(User).filter(User.email.like("colleague-%@test.com")).delete(synchronize_session=False)
            db.commit()
            q_db.close()
            db.close()

    def test_clinician_cannot_edit_another_hospitals_assessment(
        self, client, seed_hospital_and_user
    ):
        session_id = f"foreign_{uuid.uuid4().hex[:10]}"
        foreign_hospital_id = f"clinic_{uuid.uuid4().hex[:8]}"
        foreign_email = f"foreign-{uuid.uuid4().hex[:8]}@test.com"
        db = TestSession()
        q_db = TestQSession()
        try:
            role = db.query(Role).filter(Role.name == "Clinician").first()
            owner = db.query(User).filter(User.email == "doctor@test.com").first()
            db.add(Hospital(
                id=foreign_hospital_id,
                name=f"Foreign Hospital {uuid.uuid4().hex[:6]}",
                contact_person="Dr. Foreign",
                email=f"hospital-{uuid.uuid4().hex[:8]}@test.com",
            ))
            db.flush()
            db.add(User(
                email=foreign_email,
                password_hash=get_password_hash("password123"),
                hospital_id=foreign_hospital_id,
                role_id=role.id,
                is_active=True,
                full_name="Dr. Foreign",
            ))
            db.add(PatientSession(id=session_id, hospital_id="clinic_00001"))
            db.flush()
            db.add(DoctorAssessment(
                patient_session_id=session_id,
                hospital_id="clinic_00001",
                doctor_id=owner.id,
            ))
            db.commit()

            q_db.execute(text("""
                INSERT INTO session_table
                    (session_id, session_start_time, snehita_lifetime_risk, risk_category)
                VALUES (:sid, '2026-08-11', '25', 'Baseline Risk')
            """), {"sid": session_id})
            q_db.commit()

            token = get_token("Clinician", foreign_email, foreign_hospital_id)
            response = client.post(
                "/api/v1/patient/assessment",
                data={"patient_session_id": session_id},
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 403
        finally:
            q_db.execute(text("DELETE FROM session_data_table WHERE session_id = :sid"), {"sid": session_id})
            q_db.execute(text("DELETE FROM session_table WHERE session_id = :sid"), {"sid": session_id})
            q_db.commit()
            db.query(DoctorAssessment).filter(DoctorAssessment.patient_session_id == session_id).delete()
            db.query(PatientSession).filter(PatientSession.id == session_id).delete()
            db.query(User).filter(User.email == foreign_email).delete()
            db.query(Hospital).filter(Hospital.id == foreign_hospital_id).delete()
            db.commit()
            q_db.close()
            db.close()


class TestQuestionnaireSubmission:
    def test_submit_responses(self, client, seed_hospital_and_user):
        token = get_token("Staff", "staff@test.com")
        session_id = self._create_session(client, token)

        res = client.post("/api/v1/patient/questionnaire", json={
            "session_id": session_id,
            "responses": [
                {"question": "What is your age?", "answer": "45"},
                {"question": "Family history?", "answer": "No"}
            ]
        }, headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["status"] == "success"

    def _create_session(self, client, token):
        res = client.post("/api/v1/patient/consent", headers={"Authorization": f"Bearer {token}"})
        return res.json()["id"]
