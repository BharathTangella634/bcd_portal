import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
def get_risk_categories(db: Session = Depends(get_db)):
    try:
        rows = db.execute(text("""
            SELECT id, risk_category, lifetime_risk_percentage, description, recommendation
            FROM bcd_Results.risk_categories
            ORDER BY id ASC
        """)).fetchall()
    except Exception as e:
        logger.error("Failed to fetch risk categories: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch risk categories")

    return [
        {
            "id": r[0],
            "riskCategory": r[1],
            "lifetimeRiskPercentage": r[2],
            "description": r[3],
            "recommendation": r[4],
        }
        for r in rows
    ]