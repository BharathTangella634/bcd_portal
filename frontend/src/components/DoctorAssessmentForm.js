import React, { useState, useEffect } from 'react';

const BIRADS_OPTIONS = [
  { value: '1', label: '1 — Negative' },
  { value: '2', label: '2 — Benign' },
  { value: '3', label: '3 — Probably Benign' },
  { value: '4', label: '4 — Suspicious' },
  { value: '5', label: '5 — Highly Suggestive' },
  { value: '6', label: '6 — Known Malignancy' },
];

const DENSITY_OPTIONS = [
  { value: 'A', label: 'A — Almost entirely fatty' },
  { value: 'B', label: 'B — Scattered fibroglandular' },
  { value: 'C', label: 'C — Heterogeneously dense' },
  { value: 'D', label: 'D — Extremely dense' },
];

const EMPTY_BREAST = {
  masses: false,
  mass_location: '',
  mass_description: '',
  calcification: false,
  calcification_type: '',
  skin_thickening: false,
  nipple_retraction: false,
  lymph_nodes: false,
  lymph_nodes_type: '',
  architectural_distortion: false,
  focal_asymmetry: false,
  asymmetry: false,
  birads: '',
  density: '',
};

const styles = {
  form: {
    maxWidth: 860,
    margin: '0 auto',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 2px 12px rgba(20,134,140,0.08)',
    border: '1px solid #e8f4f5',
    marginBottom: 24,
    overflow: 'hidden',
  },
  cardHeader: {
    background: 'linear-gradient(135deg, #14868C 0%, #1a9da3 100%)',
    color: '#fff',
    padding: '16px 24px',
    fontSize: 18,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  cardHeaderIcon: {
    fontSize: 22,
    lineHeight: 1,
  },
  cardBody: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#14868C',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '2px solid #e0f2f3',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  field: {
    flex: '1 1 0',
    minWidth: 200,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#495057',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #d0d7de',
    fontSize: 14,
    background: '#fafbfc',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #d0d7de',
    fontSize: 14,
    background: '#fafbfc',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #d0d7de',
    fontSize: 14,
    background: '#fafbfc',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: 80,
    fontFamily: 'inherit',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    background: '#fafbfc',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: 14,
    userSelect: 'none',
  },
  toggleActive: {
    background: '#e8f7f8',
    borderColor: '#14868C',
    color: '#14868C',
    fontWeight: 500,
  },
  toggleDot: (active) => ({
    width: 18,
    height: 18,
    borderRadius: 4,
    border: active ? '2px solid #14868C' : '2px solid #ccc',
    background: active ? '#14868C' : '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  }),
  uploadZone: {
    border: '2px dashed #c8e0e2',
    borderRadius: 12,
    padding: '20px 16px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#fafefe',
    position: 'relative',
  },
  uploadLabel: {
    fontSize: 13,
    color: '#14868C',
    fontWeight: 600,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
  },
  uploadHasFile: {
    borderColor: '#14868C',
    background: '#e8f7f8',
  },
  submitBtn: {
    width: '100%',
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #14868C 0%, #0e6a6f 100%)',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(20,134,140,0.25)',
  },
  condBox: {
    marginLeft: 28,
    marginTop: 8,
    padding: '10px 14px',
    background: '#f8fafa',
    borderLeft: '3px solid #14868C',
    borderRadius: '0 8px 8px 0',
  },
  breastTab: (active) => ({
    flex: 1,
    padding: '12px 0',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    borderBottom: active ? '3px solid #14868C' : '3px solid transparent',
    color: active ? '#14868C' : '#888',
    transition: 'all 0.2s',
    background: active ? '#f0fafb' : 'transparent',
  }),
};

const Toggle = ({ label, checked, onChange }) => (
  <div
    style={{ ...styles.toggle, ...(checked ? styles.toggleActive : {}) }}
    onClick={() => onChange(!checked)}
  >
    <div style={styles.toggleDot(checked)}>{checked ? '✓' : ''}</div>
    <span>{label}</span>
  </div>
);

const UploadSlot = ({ label, hint, accept, name, file, existing, onChange, onConvert }) => {
  const hasFile = !!file;
  const hasExisting = !!existing;
  return (
    <div style={{ ...styles.uploadZone, ...(hasFile || hasExisting ? styles.uploadHasFile : {}) }}>
      <div style={styles.uploadLabel}>{label}</div>
      {hasExisting && !hasFile && (
        <div style={{ fontSize: 12, color: '#14868C', marginBottom: 6 }}>
          Existing: {existing.file_name}
        </div>
      )}
      {hasFile && <div style={{ fontSize: 12, color: '#0e6a6f', marginBottom: 6 }}>{file.name}</div>}
      <div style={styles.uploadHint}>{hint}</div>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(name, e.target.files[0])}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
      />
    </div>
  );
};

const BreastPanel = ({ side, data, onChange }) => {
  const set = (key, val) => onChange({ ...data, [key]: val });
  const sideLabel = side === 'right' ? 'Right' : 'Left';

  return (
    <div>
      <div style={{ ...styles.sectionTitle, marginTop: 8 }}>
        {sideLabel} Breast Composition
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <Toggle label="Presence of any masses" checked={data.masses} onChange={(v) => set('masses', v)} />
        {data.masses && (
          <div style={styles.condBox}>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Location</label>
                <input style={styles.input} placeholder="e.g. Upper outer quadrant" value={data.mass_location} onChange={(e) => set('mass_location', e.target.value)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <input style={styles.input} placeholder="Size, shape, margins..." value={data.mass_description} onChange={(e) => set('mass_description', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <Toggle label="Presence of calcification" checked={data.calcification} onChange={(v) => set('calcification', v)} />
        {data.calcification && (
          <div style={styles.condBox}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Toggle label="Benign" checked={data.calcification_type === 'benign'} onChange={() => set('calcification_type', 'benign')} />
              <Toggle label="Malignant" checked={data.calcification_type === 'malignant'} onChange={() => set('calcification_type', 'malignant')} />
            </div>
          </div>
        )}
      </div>

      <div style={{ ...styles.sectionTitle, fontSize: 13, color: '#555', borderBottom: 'none', marginBottom: 8 }}>
        Associated Features
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <Toggle label="Skin thickening" checked={data.skin_thickening} onChange={(v) => set('skin_thickening', v)} />
        <Toggle label="Nipple retraction" checked={data.nipple_retraction} onChange={(v) => set('nipple_retraction', v)} />
        <Toggle label="Architectural distortion" checked={data.architectural_distortion} onChange={(v) => set('architectural_distortion', v)} />
        <Toggle label="Focal asymmetry" checked={data.focal_asymmetry} onChange={(v) => set('focal_asymmetry', v)} />
        <Toggle label="Asymmetry" checked={data.asymmetry} onChange={(v) => set('asymmetry', v)} />
        <Toggle label="Lymph nodes" checked={data.lymph_nodes} onChange={(v) => set('lymph_nodes', v)} />
      </div>
      {data.lymph_nodes && (
        <div style={{ ...styles.condBox, marginBottom: 16, marginLeft: 0 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Toggle label="Benign" checked={data.lymph_nodes_type === 'benign'} onChange={() => set('lymph_nodes_type', 'benign')} />
            <Toggle label="Malignant" checked={data.lymph_nodes_type === 'malignant'} onChange={() => set('lymph_nodes_type', 'malignant')} />
          </div>
        </div>
      )}

      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>BIRADS Category</label>
          <select style={styles.select} value={data.birads} onChange={(e) => set('birads', e.target.value)}>
            <option value="">Select BIRADS</option>
            {BIRADS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>ACR Breast Density</label>
          <select style={styles.select} value={data.density} onChange={(e) => set('density', e.target.value)}>
            <option value="">Select Density</option>
            {DENSITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

const DoctorAssessmentForm = ({ sessionId, initialData, onSaveSuccess }) => {
  const [activeBreast, setActiveBreast] = useState('right');
  const [rightBreast, setRightBreast] = useState({ ...EMPTY_BREAST });
  const [leftBreast, setLeftBreast] = useState({ ...EMPTY_BREAST });
  const [routineViews, setRoutineViews] = useState(false);
  const [recommendation, setRecommendation] = useState('');
  const [feedback, setFeedback] = useState('');
  const [questionnaireCorrect, setQuestionnaireCorrect] = useState(false);

  const [files, setFiles] = useState({
    mammo_cc_left: null,
    mammo_cc_right: null,
    mammo_mlo_left: null,
    mammo_mlo_right: null,
    us_video: null,
    us_reading: null,
    biopsy_doc: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (initialData) {
      setFeedback(initialData.questionnaire_feedback || '');
      setQuestionnaireCorrect(initialData.is_questionnaire_correct || false);
      setRecommendation(initialData.recommendation_followup || '');
      setRoutineViews(initialData.routine_views_uploaded || false);
      if (initialData.clinical_findings) {
        const cf = typeof initialData.clinical_findings === 'string'
          ? JSON.parse(initialData.clinical_findings)
          : initialData.clinical_findings;
        if (cf.right) setRightBreast({ ...EMPTY_BREAST, ...cf.right });
        if (cf.left) setLeftBreast({ ...EMPTY_BREAST, ...cf.left });
      }
    }
  }, [initialData]);

  const getAttachmentByType = (type) => {
    if (!initialData || !initialData.attachments) return null;
    return initialData.attachments.find(a => a.file_type === type);
  };

  const handleFileChange = (name, file) => {
    setFiles(prev => ({ ...prev, [name]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    const clinicalFindings = JSON.stringify({ right: rightBreast, left: leftBreast });

    const submitData = new FormData();
    submitData.append('patient_session_id', sessionId);
    submitData.append('questionnaire_feedback', feedback);
    submitData.append('is_questionnaire_correct', questionnaireCorrect);
    submitData.append('mammo_birads', rightBreast.birads || '');
    submitData.append('mammo_density', rightBreast.density || '');
    submitData.append('us_biopsy_birads', leftBreast.birads || '');
    submitData.append('us_biopsy_density', leftBreast.density || '');
    submitData.append('clinical_findings', clinicalFindings);
    submitData.append('recommendation_followup', recommendation);
    submitData.append('routine_views_uploaded', routineViews);
    submitData.append('precision_diagnosis', '');
    submitData.append('datapoint_feedback', '');

    Object.entries(files).forEach(([key, file]) => {
      if (file) submitData.append(key, file);
    });

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/patient/assessment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: submitData,
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Assessment saved successfully!' });
        if (onSaveSuccess) onSaveSuccess();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: `Failed: ${errorData.detail || 'Unknown error'}` });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.form}>
      <form onSubmit={handleSubmit}>

        {/* Questionnaire Review */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardHeaderIcon}>&#128203;</span> Questionnaire Review
          </div>
          <div style={styles.cardBody}>
            <Toggle label="Questionnaire responses are correct" checked={questionnaireCorrect} onChange={setQuestionnaireCorrect} />
            <div style={{ marginTop: 12 }}>
              <label style={styles.label}>Feedback (optional)</label>
              <textarea style={styles.textarea} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Any corrections or notes about the questionnaire..." />
            </div>
          </div>
        </div>

        {/* Mammogram Upload */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardHeaderIcon}>&#128248;</span> Mammogram Views
          </div>
          <div style={styles.cardBody}>
            <Toggle label="Routine CC & MLO views of both breasts uploaded" checked={routineViews} onChange={setRoutineViews} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <UploadSlot label="CC Right" hint=".dcm" accept=".dcm,application/dicom,image/*" name="mammo_cc_right" file={files.mammo_cc_right} existing={getAttachmentByType('mammo_cc_right')} onChange={handleFileChange} />
              <UploadSlot label="CC Left" hint=".dcm" accept=".dcm,application/dicom,image/*" name="mammo_cc_left" file={files.mammo_cc_left} existing={getAttachmentByType('mammo_cc_left')} onChange={handleFileChange} />
              <UploadSlot label="MLO Right" hint=".dcm" accept=".dcm,application/dicom,image/*" name="mammo_mlo_right" file={files.mammo_mlo_right} existing={getAttachmentByType('mammo_mlo_right')} onChange={handleFileChange} />
              <UploadSlot label="MLO Left" hint=".dcm" accept=".dcm,application/dicom,image/*" name="mammo_mlo_left" file={files.mammo_mlo_left} existing={getAttachmentByType('mammo_mlo_left')} onChange={handleFileChange} />
            </div>
          </div>
        </div>

        {/* Breast Composition */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardHeaderIcon}>&#129657;</span> Breast Composition & Findings
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e8' }}>
            <div style={styles.breastTab(activeBreast === 'right')} onClick={() => setActiveBreast('right')}>
              Right Breast
            </div>
            <div style={styles.breastTab(activeBreast === 'left')} onClick={() => setActiveBreast('left')}>
              Left Breast
            </div>
          </div>
          <div style={styles.cardBody}>
            {activeBreast === 'right' && (
              <BreastPanel side="right" data={rightBreast} onChange={setRightBreast} />
            )}
            {activeBreast === 'left' && (
              <BreastPanel side="left" data={leftBreast} onChange={setLeftBreast} />
            )}
          </div>
        </div>

        {/* Ultrasound & Biopsy */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardHeaderIcon}>&#128300;</span> Ultrasound & Biopsy
          </div>
          <div style={styles.cardBody}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <UploadSlot label="Ultrasound" hint=".dcm / .jpg" accept=".dcm,image/*,video/*" name="us_video" file={files.us_video} existing={getAttachmentByType('us_video')} onChange={handleFileChange} />
              <UploadSlot label="US Reading" hint=".pdf" accept=".pdf,image/*" name="us_reading" file={files.us_reading} existing={getAttachmentByType('us_reading')} onChange={handleFileChange} />
              <UploadSlot label="Biopsy Report" hint=".pdf" accept=".pdf,image/*" name="biopsy_doc" file={files.biopsy_doc} existing={getAttachmentByType('biopsy_reading')} onChange={handleFileChange} />
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardHeaderIcon}>&#128221;</span> Recommendation & Follow-up
          </div>
          <div style={styles.cardBody}>
            <textarea
              style={{ ...styles.textarea, minHeight: 100 }}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="Enter recommendation and follow-up plan..."
            />
          </div>
        </div>

        {/* Messages */}
        {message.text && (
          <div style={{
            padding: 14,
            marginBottom: 16,
            borderRadius: 10,
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            fontWeight: 500,
          }}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            ...styles.submitBtn,
            opacity: isSubmitting ? 0.7 : 1,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Assessment' : 'Save Assessment')}
        </button>
      </form>
    </div>
  );
};

export default DoctorAssessmentForm;
