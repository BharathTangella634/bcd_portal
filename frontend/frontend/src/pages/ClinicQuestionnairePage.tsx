import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { 
  Container, Typography, Box, TextField, Button, RadioGroup, 
  FormControlLabel, Radio, Checkbox, FormGroup, Select, MenuItem, 
  InputLabel, FormControl, CircularProgress 
} from '@mui/material';
import api from '../api/client';

const ClinicQuestionnairePage: React.FC = () => {
  const { encounterId: urlEncounterId } = useParams();
  const [encounterId, setEncounterId] = useState<string | null>(urlEncounterId || null);
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [language, setLanguage] = useState('en-IN');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, control, reset } = useForm();

  useEffect(() => {
    fetchQuestionnaire();
  }, [language]);

  const fetchQuestionnaire = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/questionnaires/BREAST_SCREENING?lang=${language}`);
      setQuestionnaire(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onPatientSubmit = async (data: any) => {
    try {
      const response = await api.post('/encounters', {
        patient: {
          externalId: data.externalId,
          name: data.name,
          dob: data.dob,
          sex: data.sex,
        },
        questionnaireCode: 'BREAST_SCREENING'
      });
      setEncounterId(response.data.id);
    } catch (err) {
      console.error(err);
    }
  };

  const onResponsesSubmit = async (data: any, isDraft: boolean) => {
    const formattedResponses = Object.entries(data).map(([key, value]) => ({
      questionId: parseInt(key),
      value
    }));
    try {
      await api.post(`/encounters/${encounterId}/responses`, {
        responses: formattedResponses,
        isDraft
      });
      alert(isDraft ? 'Draft saved' : 'Submitted successfully');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <CircularProgress />;

  if (!encounterId) {
    return (
      <Container maxWidth="sm">
        <Typography variant="h4" sx={{ my: 4 }}>New Patient Encounter</Typography>
        <Box component="form" onSubmit={handleSubmit(onPatientSubmit)}>
          <TextField fullWidth label="External ID (MRN)" {...register('externalId')} margin="normal" required />
          <TextField fullWidth label="Patient Name" {...register('name')} margin="normal" required />
          <TextField fullWidth label="Date of Birth" type="date" {...register('dob')} margin="normal" required InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Sex</InputLabel>
            <Select {...register('sex')} defaultValue="Female">
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Create Encounter</Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 4 }}>
        <Typography variant="h4">Questionnaire</Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Language</InputLabel>
          <Select value={language} label="Language" onChange={(e) => setLanguage(e.target.value as string)}>
            <MenuItem value="en-IN">English</MenuItem>
            <MenuItem value="ta-IN">Tamil</MenuItem>
            <MenuItem value="hi-IN">Hindi</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box component="form">
        {questionnaire?.questions.map((q: any) => (
          <Box key={q.id} sx={{ mb: 4 }}>
            <Typography variant="h6">{q.text}</Typography>
            {q.helpText && <Typography variant="caption" color="textSecondary">{q.helpText}</Typography>}
            
            {q.type === 'numeric' && (
              <TextField fullWidth type="number" {...register(`${q.id}`)} margin="normal" />
            )}
            
            {q.type === 'text' && (
              <TextField fullWidth multiline rows={4} {...register(`${q.id}`)} margin="normal" />
            )}

            {q.type === 'single-choice' && (
              <Controller
                name={`${q.id}`}
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field}>
                    {q.options.map((o: any) => (
                      <FormControlLabel key={o.id} value={o.code} control={<Radio />} label={o.label} />
                    ))}
                  </RadioGroup>
                )}
              />
            )}

            {q.type === 'multi-choice' && (
              <FormGroup>
                {q.options.map((o: any) => (
                  <FormControlLabel
                    key={o.id}
                    control={<Checkbox {...register(`${q.id}.${o.code}`)} />}
                    label={o.label}
                  />
                ))}
              </FormGroup>
            )}
          </Box>
        ))}
        
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={handleSubmit((data) => onResponsesSubmit(data, true))}>Save Draft</Button>
          <Button variant="contained" onClick={handleSubmit((data) => onResponsesSubmit(data, false))}>Submit</Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ClinicQuestionnairePage;
