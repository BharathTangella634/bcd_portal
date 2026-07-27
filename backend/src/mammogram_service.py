import logging
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from .models.models import Attachment, DoctorAssessment, Hospital, PatientSession, Machine

logger = logging.getLogger(__name__)

MAMMOGRAM_VIEW_TYPES = [
    'mammo_cc_left',
    'mammo_cc_right',
    'mammo_mlo_left',
    'mammo_mlo_right',
]

def get_view_type_counts(db: Session) -> dict:
    view_counts = {}
    for view_type in MAMMOGRAM_VIEW_TYPES:
        count = db.query(func.count(Attachment.id)).filter(
            Attachment.file_type == view_type
        ).scalar() or 0
        view_name = view_type.replace('mammo_', '').upper()
        view_counts[view_name] = count

    return view_counts

def get_total_mammogram_stats(db: Session) -> dict:
    dicom_count = db.query(func.count(Attachment.id)).filter(
        Attachment.file_type.in_(MAMMOGRAM_VIEW_TYPES)
    ).scalar() or 0

    report_count = db.query(func.count(Attachment.id)).filter(
        Attachment.file_type == 'mammo_reading'
    ).scalar() or 0

    return {
        'dicom_files': dicom_count,
        'reports': report_count,
        'total': dicom_count + report_count,
    }

def _mammo_view_count_subquery(db: Session):
    return db.query(func.count(Attachment.id)).filter(
        Attachment.assessment_id == DoctorAssessment.id,
        Attachment.file_type.in_(MAMMOGRAM_VIEW_TYPES)
    ).correlate(DoctorAssessment).scalar_subquery()


def get_complete_sets_count(db: Session) -> int:
    subq = _mammo_view_count_subquery(db)
    complete = db.query(func.count(DoctorAssessment.id)).filter(
        subq == len(MAMMOGRAM_VIEW_TYPES)
    ).scalar() or 0

    return complete


def get_partial_sets_count(db: Session) -> int:
    subq = _mammo_view_count_subquery(db)
    partial = db.query(func.count(DoctorAssessment.id)).filter(
        subq.between(1, len(MAMMOGRAM_VIEW_TYPES) - 1)
    ).scalar() or 0

    return partial


def _report_count_subquery(db: Session):
    return db.query(func.count(Attachment.id)).filter(
        Attachment.assessment_id == DoctorAssessment.id,
        Attachment.file_type == 'mammo_reading'
    ).correlate(DoctorAssessment).scalar_subquery()


def get_report_uploaded_count(db: Session) -> int:
    subq = _report_count_subquery(db)
    return db.query(func.count(DoctorAssessment.id)).filter(subq >= 1).scalar() or 0


def get_report_missing_count(db: Session) -> int:
    subq = _report_count_subquery(db)
    return db.query(func.count(DoctorAssessment.id)).filter(subq == 0).scalar() or 0


def get_mammogram_by_hospital(db: Session) -> list:
    subject_count_subq = db.query(func.count(PatientSession.id)).filter(
        PatientSession.hospital_id == Hospital.id
    ).correlate(Hospital).scalar_subquery()

    assessment_count_subq = db.query(func.count(DoctorAssessment.id)).filter(
        DoctorAssessment.hospital_id == Hospital.id
    ).correlate(Hospital).scalar_subquery()

    dicom_count_subq = db.query(func.count(Attachment.id)).join(
        DoctorAssessment, Attachment.assessment_id == DoctorAssessment.id
    ).filter(
        DoctorAssessment.hospital_id == Hospital.id,
        Attachment.file_type.in_(MAMMOGRAM_VIEW_TYPES)
    ).correlate(Hospital).scalar_subquery()

    report_count_subq = db.query(func.count(Attachment.id)).join(
        DoctorAssessment, Attachment.assessment_id == DoctorAssessment.id
    ).filter(
        DoctorAssessment.hospital_id == Hospital.id,
        Attachment.file_type == 'mammo_reading'
    ).correlate(Hospital).scalar_subquery()

    results = db.query(
        Hospital.id,
        Hospital.name,
        Hospital.short_name,
        Hospital.state,
        Hospital.type,
        Machine.machine.label('machine_name'),
        Machine.make.label('machine_make'),
        Machine.technology.label('machine_technology'),
        Machine.no_of_machines.label('machine_count'),
        subject_count_subq.label('subject_count'),
        assessment_count_subq.label('assessment_count'),
        dicom_count_subq.label('dicom_count'),
        report_count_subq.label('report_count'),
    ).filter(
        ~Hospital.name.in_(['Test', 'Tanuh Foundation'])
    ).outerjoin(
        Machine, Machine.hospital_id == Hospital.id
    ).order_by(
        subject_count_subq.desc()
    ).all()

    hospital_data = []
    for row in results:
        hospital_data.append({
            'hospital_name': row.name,
            'short_name': row.short_name or row.name,
            'state': row.state,
            'type': row.type,
            'machines': [{
                'machine_name': row.machine_name,
                'make': row.machine_make,
                'technology': row.machine_technology,
                'machine_count': row.machine_count,
            }] if row.machine_name else [],
            'subject_count': row.subject_count or 0,
            'assessment_count': row.assessment_count or 0,
            'dicom_count': row.dicom_count or 0,
            'report_count': row.report_count or 0,
        })

    return hospital_data

def get_hospital_type_breakdown(db: Session) -> list:
    """
    Returns CR/DR counts for a pie chart. Each slice includes the list of
    hospitals in that group, so the frontend can show hospital details on hover.
    """
    rows = db.query(
        Hospital.id,
        Hospital.name,
        Hospital.short_name,
        Hospital.state,
        Hospital.type,
    ).all()

    groups = {'cr': [], 'dr': [], 'unassigned': []}

    for row in rows:
        key = (row.type or '').lower()
        if key not in ('cr', 'dr'):
            key = 'unassigned'
        groups[key].append({
            'hospital_id': row.id,
            'hospital_name': row.name,
            'short_name': row.short_name or row.name,
            'state': row.state,
        })

    labels = {'cr': 'CR', 'dr': 'DR', 'unassigned': 'Unassigned'}

    breakdown = []
    for key in ('cr', 'dr', 'unassigned'):
        if groups[key]:  # skip empty "unassigned" bucket if every hospital is tagged
            breakdown.append({
                'name': labels[key],
                'value': len(groups[key]),
                'hospitals': groups[key],
            })

    return breakdown

def get_total_assessments_count(db: Session) -> int:
    return db.query(func.count(DoctorAssessment.id)).scalar() or 0

def get_completion_rate(db: Session) -> float:
    total_assessments = get_total_assessments_count(db)
    if total_assessments == 0:
        return 0.0

    complete_sets = get_complete_sets_count(db)
    return round((complete_sets / total_assessments) * 100, 2)

def get_portal_mammogram_dashboard(db: Session) -> dict:
    total_assessments = get_total_assessments_count(db)
    complete_sets = get_complete_sets_count(db)
    partial_sets = get_partial_sets_count(db)
    no_mammogram = max(total_assessments - complete_sets - partial_sets, 0)
    report_uploaded = get_report_uploaded_count(db)
    report_missing = max(total_assessments - report_uploaded, 0)

    view_counts = get_view_type_counts(db)
    totals = get_total_mammogram_stats(db)
    by_hospital = get_mammogram_by_hospital(db)
    hospital_type_breakdown = get_hospital_type_breakdown(db)

    return {
        "totalAssessments": total_assessments,
        "totals": totals,
        "viewTypeCounts": [
            {"name": name, "count": count} for name, count in view_counts.items()
        ],
        "setCompleteness": [
            {"name": "Complete (4 views)", "value": complete_sets},
            {"name": "Partial (1-3 views)", "value": partial_sets},
            {"name": "No mammogram", "value": no_mammogram},
        ],
        "reportCompleteness": [
            {"name": "Report Uploaded", "value": report_uploaded},
            {"name": "No Report", "value": report_missing},
        ],
        "completionRate": get_completion_rate(db),
        "byHospital": by_hospital,
        "hospitalTypeBreakdown": hospital_type_breakdown,
    }