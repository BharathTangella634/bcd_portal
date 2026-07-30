import logging
from collections import Counter, defaultdict

from sqlalchemy.orm import Session
from sqlalchemy import func, case, text
from .models.models import Attachment, DoctorAssessment, Hospital, PatientSession, Machine

logger = logging.getLogger(__name__)

MAMMOGRAM_VIEW_TYPES = [
    'mammo_cc_left',
    'mammo_cc_right',
    'mammo_mlo_left',
    'mammo_mlo_right',
]

REPORT_FILE_TYPES = [
    'mammo_reading',
    'us_reading',
]

EXCLUDED_HOSPITAL_NAMES = ('Test', 'Tanuh Foundation')
INSTITUTE_QUESTIONS = ('Institute Name', 'Institute Name:', 'Enter the Hospital ID(If any, else leave):', 'Q45')

VALID_BIRADS = {'0', '1', '2', '3', '4', '5'}


def _get_institute_filter():
    return """
    JOIN (
        SELECT session_id, MAX(answer) as answer
        FROM session_data_table
        WHERE question IN :inst_questions
          AND answer IN :valid_names
        GROUP BY session_id
    ) sd_inst ON s.session_id = sd_inst.session_id
    """


def get_view_type_counts(db: Session) -> dict:
    view_counts = {}
    for view_type in MAMMOGRAM_VIEW_TYPES:
        count = db.query(func.count(Attachment.id)).filter(
            Attachment.file_type == view_type
        ).scalar() or 0
        view_name = view_type.replace('mammo_', '').upper()
        view_counts[view_name] = count

    return view_counts


def get_total_subjects_count(db: Session, questionnaire_db: Session) -> int:
    hospital_rows = db.query(Hospital.name).filter(
        ~Hospital.name.in_(list(EXCLUDED_HOSPITAL_NAMES))
    ).all()
    valid_hospitals = [h.name for h in hospital_rows]
    if not valid_hospitals:
        return 0

    inst_filter = _get_institute_filter()
    params = {"inst_questions": INSTITUTE_QUESTIONS, "valid_names": tuple(valid_hospitals)}

    total_res = questionnaire_db.execute(text(f"""
        SELECT COUNT(DISTINCT s.session_id) as total
        FROM session_table s {inst_filter}
        WHERE s.snehita_lifetime_risk IS NOT NULL
    """), params).fetchone()

    return total_res[0] if total_res else 0


def get_total_mammogram_stats(db: Session, questionnaire_db: Session) -> dict:
    imaging_studies_count = get_total_subjects_count(db, questionnaire_db)

    report_count = db.query(func.count(Attachment.id)).join(
        DoctorAssessment, Attachment.assessment_id == DoctorAssessment.id
    ).join(
        Hospital, DoctorAssessment.hospital_id == Hospital.id
    ).filter(
        Attachment.file_type.in_(REPORT_FILE_TYPES),
        ~Hospital.name.in_(list(EXCLUDED_HOSPITAL_NAMES))
    ).scalar() or 0

    return {
        'imaging_studies': imaging_studies_count,
        'reports': report_count,
        'total': imaging_studies_count + report_count,
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


def get_report_uploaded_count(db: Session) -> int:

    return db.query(func.count(func.distinct(DoctorAssessment.id))).join(
        Attachment, Attachment.assessment_id == DoctorAssessment.id
    ).join(
        Hospital, DoctorAssessment.hospital_id == Hospital.id
    ).filter(
        Attachment.file_type.in_(REPORT_FILE_TYPES),
        ~Hospital.name.in_(list(EXCLUDED_HOSPITAL_NAMES))
    ).scalar() or 0


def get_report_missing_count(db: Session) -> int:
    total = get_total_assessments_count(db)
    uploaded = get_report_uploaded_count(db)
    return max(total - uploaded, 0)


def get_reports_by_hospital(db: Session) -> list:
    report_count_subq = db.query(func.count(Attachment.id)).join(
        DoctorAssessment, Attachment.assessment_id == DoctorAssessment.id
    ).filter(
        DoctorAssessment.hospital_id == Hospital.id,
        Attachment.file_type.in_(REPORT_FILE_TYPES)
    ).correlate(Hospital).scalar_subquery()

    results = db.query(
        Hospital.id,
        Hospital.name,
        Hospital.short_name,
        report_count_subq.label('report_count'),
    ).filter(
        ~Hospital.name.in_(list(EXCLUDED_HOSPITAL_NAMES))
    ).order_by(
        report_count_subq.desc()
    ).all()

    return [
        {
            'hospital_id': row.id,
            'hospital_name': row.name,
            'short_name': row.short_name or row.name,
            'report_count': row.report_count or 0,
        }
        for row in results
    ]

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
        Attachment.file_type.in_(REPORT_FILE_TYPES)
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
        ~Hospital.name.in_(list(EXCLUDED_HOSPITAL_NAMES))
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
    return db.query(func.count(DoctorAssessment.id)).join(
        Hospital, DoctorAssessment.hospital_id == Hospital.id
    ).filter(
        ~Hospital.name.in_(list(EXCLUDED_HOSPITAL_NAMES))
    ).scalar() or 0


def get_total_views_uploaded_count(db: Session) -> int:
    return db.query(func.count(Attachment.id)).filter(
        Attachment.file_type == 'mammo_cc_left'
    ).scalar() or 0


def get_completion_rate(db: Session, questionnaire_db: Session) -> dict:
    views_uploaded = get_total_views_uploaded_count(db)
    total_subjects = get_total_subjects_count(db, questionnaire_db)
    rate = round((views_uploaded / total_subjects) * 100, 2) if total_subjects else 0.0

    return {
        "viewsUploaded": views_uploaded,
        "totalSubjects": total_subjects,
        "rate": rate,
    }


def _extract_side_birads(clinical_findings):
    """
    Pulls (left_birads, right_birads) out of a DoctorAssessment.clinical_findings
    JSON value.

    ASSUMPTION: clinical_findings stores BIRADS per side. This handles the
    most likely shapes:
      1) {"left": {"birads": "4A"}, "right": {"birads": "2"}}
      2) {"left_birads": "4A", "right_birads": "2"}
      3) {"left": "4A", "right": "2"}

    If the real JSON uses different key names, only this function needs to
    change — aggregation and the endpoint stay the same.
    """
    left_val = None
    right_val = None

    if isinstance(clinical_findings, dict):
        left_raw = clinical_findings.get('left')
        right_raw = clinical_findings.get('right')

        if isinstance(left_raw, dict):
            left_val = left_raw.get('birads') or left_raw.get('mammo_birads')
        elif isinstance(left_raw, str):
            left_val = left_raw

        if isinstance(right_raw, dict):
            right_val = right_raw.get('birads') or right_raw.get('mammo_birads')
        elif isinstance(right_raw, str):
            right_val = right_raw

        # fallback: flat left_birads / right_birads keys
        left_val = left_val or clinical_findings.get('left_birads')
        right_val = right_val or clinical_findings.get('right_birads')

    return left_val, right_val


def get_birads_by_institute_and_side(db: Session) -> list:
    """
    Returns BIRADS distribution per hospital, split into left/right,
    sourced from DoctorAssessment.clinical_findings.
    """
    rows = db.query(
        Hospital.id,
        Hospital.name,
        Hospital.short_name,
        DoctorAssessment.clinical_findings,
    ).join(
        DoctorAssessment, DoctorAssessment.hospital_id == Hospital.id
    ).filter(
        ~Hospital.name.in_(list(EXCLUDED_HOSPITAL_NAMES)),
        DoctorAssessment.clinical_findings.isnot(None),
    ).all()

    by_institute = defaultdict(lambda: {
        'hospital_name': None,
        'short_name': None,
        'left_birads_counts': Counter(),
        'right_birads_counts': Counter(),
        'left_total': 0,
        'right_total': 0,
    })

    for hosp_id, name, short_name, findings in rows:
        entry = by_institute[hosp_id]
        entry['hospital_name'] = name
        entry['short_name'] = short_name or name

        left_val, right_val = _extract_side_birads(findings)

        if left_val:
            entry['left_birads_counts'][left_val] += 1
            entry['left_total'] += 1
        if right_val:
            entry['right_birads_counts'][right_val] += 1
            entry['right_total'] += 1

    result = []
    for hosp_id, data in by_institute.items():
        result.append({
            'hospital_id': hosp_id,
            'hospital_name': data['hospital_name'],
            'short_name': data['short_name'],
            'left': {
                'total': data['left_total'],
                'birads_counts': dict(data['left_birads_counts']),
            },
            'right': {
                'total': data['right_total'],
                'birads_counts': dict(data['right_birads_counts']),
            },
        })

    result.sort(key=lambda r: (r['left']['total'] + r['right']['total']), reverse=True)
    return result


def get_portal_mammogram_dashboard(db: Session, questionnaire_db: Session) -> dict:
    total_assessments = get_total_assessments_count(db)
    complete_sets = get_complete_sets_count(db)
    partial_sets = get_partial_sets_count(db)
    no_mammogram = max(total_assessments - complete_sets - partial_sets, 0)
    report_uploaded = get_report_uploaded_count(db)
    report_missing = max(total_assessments - report_uploaded, 0)

    view_counts = get_view_type_counts(db)
    totals = get_total_mammogram_stats(db, questionnaire_db)
    by_hospital = get_mammogram_by_hospital(db)
    hospital_type_breakdown = get_hospital_type_breakdown(db)
    reports_by_hospital = get_reports_by_hospital(db)   # <-- now GCS-based
    birads_by_institute_side = get_birads_by_institute_and_side(db)

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
        "completionRate": get_completion_rate(db, questionnaire_db),
        "byHospital": by_hospital,
        "hospitalTypeBreakdown": hospital_type_breakdown,
        "reportsByHospital": reports_by_hospital,   # <-- now GCS-based
        "biradsByInstituteAndSide": birads_by_institute_side,
    }