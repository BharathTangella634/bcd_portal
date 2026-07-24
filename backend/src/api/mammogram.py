import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..db.session import get_db
from ..mammogram_service import get_portal_mammogram_dashboard

router = APIRouter()
logger = logging.getLogger(__name__)


def _iso(v):
    return v.isoformat() if v else None


@router.get("/portal-stats")
def get_mammogram_portal_stats(app_db: Session = Depends(get_db)):
    try:
        return get_portal_mammogram_dashboard(app_db)
    except Exception as e:
        logger.error(f"Error computing portal mammogram stats: {e}")
        return {
            "totalAssessments": 0,
            "totals": {"dicom_files": 0, "reports": 0, "total": 0},
            "viewTypeCounts": [],
            "setCompleteness": [],
            "completionRate": 0.0,
            "byHospital": [],
            "error": str(e),
        }