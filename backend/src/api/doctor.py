from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from ..db.session import get_db
from ..models.models import PatientSession, DoctorAssessment, Attachment
from ..schemas.schemas import PatientSessionListItem, PatientSessionDetail, DoctorAssessmentResponse
from .auth import get_current_user
from typing import List

router = APIRouter()

def get_session_status_dict(session: PatientSession):
    # This assumes session.assessments and their attachments are already loaded
    assessment = session.assessments[0] if session.assessments else None
    
    status_dict = {
        "has_assessment": assessment is not None,
        "has_mammo_dicom": False,
        "has_mammo_reading": False,
        "has_us_video": False,
        "has_us_reading": False,
        "has_biopsy": False
    }
    
    if assessment:
        for att in assessment.attachments:
            if att.file_type == 'mammo_dicom':
                status_dict["has_mammo_dicom"] = True
            elif att.file_type == 'mammo_reading':
                status_dict["has_mammo_reading"] = True
            elif att.file_type == 'us_video':
                status_dict["has_us_video"] = True
            elif att.file_type == 'us_reading':
                status_dict["has_us_reading"] = True
            elif att.file_type == 'biopsy_reading':
                status_dict["has_biopsy"] = True
    return status_dict

@router.get("/sessions", response_model=List[PatientSessionListItem])
def get_patient_sessions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    hospital_id = current_user.get("hospital_id")
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User hospital ID not found")
    
    sessions = db.query(PatientSession).filter(
        PatientSession.hospital_id == hospital_id
    ).options(
        joinedload(PatientSession.assessments).joinedload(DoctorAssessment.attachments)
    ).order_by(PatientSession.consent_timestamp.desc()).all()
    
    result = []
    for s in sessions:
        status_dict = get_session_status_dict(s)
        # Create a dictionary and update with status
        s_dict = {
            "id": s.id,
            "consent_scanned_url": s.consent_scanned_url,
            "consent_timestamp": s.consent_timestamp,
            **status_dict
        }
        result.append(s_dict)
    
    return result

@router.get("/sessions/{session_id}", response_model=PatientSessionDetail)
def get_patient_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    hospital_id = current_user.get("hospital_id")
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User hospital ID not found")
    
    session = db.query(PatientSession).filter(
        PatientSession.id == session_id,
        PatientSession.hospital_id == hospital_id
    ).options(
        joinedload(PatientSession.responses),
        joinedload(PatientSession.assessments).joinedload(DoctorAssessment.attachments)
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Patient session not found")
    
    status_dict = get_session_status_dict(session)
    assessment = session.assessments[0] if session.assessments else None
    
    # We need to return a combined object
    return {
        "id": session.id,
        "consent_scanned_url": session.consent_scanned_url,
        "consent_timestamp": session.consent_timestamp,
        "responses": session.responses,
        "assessment": assessment,
        **status_dict
    }
