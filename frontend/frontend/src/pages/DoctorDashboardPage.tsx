import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const DoctorDashboardPage: React.FC = () => {
  const [encounters, setEncounters] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    try {
      const response = await api.get('/doctor/encounters');
      setEncounters(response.data.encounters);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ my: 4 }}>Doctor Dashboard</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient Name</TableCell>
              <TableCell>MRN</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {encounters.map((e: any) => (
              <TableRow key={e.id} hover onClick={() => navigate(`/doctor/encounters/${e.id}`)} sx={{ cursor: 'pointer' }}>
                <TableCell>{e.patient.name}</TableCell>
                <TableCell>{e.patient.external_id}</TableCell>
                <TableCell>{e.status}</TableCell>
                <TableCell>{new Date(e.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button size="small" variant="outlined">View Detail</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default DoctorDashboardPage;
