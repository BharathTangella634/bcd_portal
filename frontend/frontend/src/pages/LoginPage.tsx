import React from 'react';
import { useForm } from 'react-hook-form';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Container, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState('');

  const onSubmit = async (data: any) => {
    try {
      const response = await api.post('/auth/login', data);
      login(response.data.token, response.data.user);
      
      const role = response.data.user.role;
      if (role === 'admin') navigate('/doctor/encounters'); // Admin defaults to doctor dashboard for now or a custom one
      else if (role === 'clinic') navigate('/clinic/questionnaire');
      else if (role === 'doctor') navigate('/doctor/encounters');
      else if (role === 'technologist') navigate('/technologist/imaging');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Sign in</Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Hospital Code"
            {...register('hospitalCode')}
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            {...register('username')}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select {...register('role')} defaultValue="clinic" label="Role">
              <MenuItem value="clinic">Clinic</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="technologist">Technologist</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            {...register('password')}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
