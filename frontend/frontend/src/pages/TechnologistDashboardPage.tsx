import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import api from '../api/client';

const TechnologistDashboardPage: React.FC = () => {
  const [studies, setStudies] = useState([]);

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      const response = await api.get('/technologist/imaging');
      setStudies(response.data.studies);
    } catch (err) {
      console.error(err);
    }
  };

  const openImaging = (id: number) => {
    window.open(`/api/imaging/${id}`, '_blank');
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ my: 4 }}>Technologist Dashboard</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Modality</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {studies.map((s: any) => (
              <TableRow key={s.id}>
                <TableCell>{s.patient.name}</TableCell>
                <TableCell>{s.modality}</TableCell>
                <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button size="small" variant="contained" onClick={() => openImaging(s.id)}>Open Imaging</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default TechnologistDashboardPage;
