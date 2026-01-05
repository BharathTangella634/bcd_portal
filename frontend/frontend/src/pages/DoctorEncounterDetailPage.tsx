import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Paper, TextField, Button, List, ListItem, ListItemText, Divider } from '@mui/material';
import api from '../api/client';

const DoctorEncounterDetailPage: React.FC = () => {
  const { id } = useParams();
  const [encounter, setEncounter] = useState<any>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchEncounter();
  }, [id]);

  const fetchEncounter = async () => {
    try {
      const response = await api.get(`/encounters/${id}`);
      setEncounter(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async () => {
    try {
      await api.post(`/doctor/encounters/${id}/clinical-notes`, { noteText: note });
      setNote('');
      fetchEncounter();
    } catch (err) {
      console.error(err);
    }
  };

  if (!encounter) return null;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ my: 4 }}>Encounter Detail</Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Patient Info</Typography>
        <Typography>Name: {encounter.patient.name}</Typography>
        <Typography>MRN: {encounter.patient.external_id}</Typography>
        <Typography>DOB: {new Date(encounter.patient.dob).toLocaleDateString()}</Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Responses</Typography>
        {encounter.responses.map((r: any) => (
          <Box key={r.id} sx={{ my: 1 }}>
            <Typography variant="subtitle2">Question ID: {r.question_id}</Typography>
            <Typography>Value: {JSON.stringify(r.value_json)}</Typography>
            <Divider />
          </Box>
        ))}
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Clinical Notes</Typography>
        {/* Assume encounter.clinicalNotes is available if we fetched it */}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="New Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button variant="contained" sx={{ mt: 2 }} onClick={handleAddNote}>Add Note</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">File Upload</Typography>
        <input type="file" multiple style={{ marginTop: '16px' }} />
        <Button variant="outlined" sx={{ mt: 2, display: 'block' }}>Upload Files</Button>
      </Paper>
    </Container>
  );
};

export default DoctorEncounterDetailPage;
