import React, { useState } from 'react';
import API from '../services/api';
import { saveUser, saveToken } from '../services/auth';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography, Alert,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import ThemeToggle from '../components/ThemeToggle';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await API.post('/auth/signup', { name, email, password, role });
      const accessToken = res.data?.accessToken;
      const user = res.data?.user;

      if (accessToken && user) {
        saveToken(accessToken);
        saveUser(user);
        nav('/dashboard');
        return;
      }

   
      if (!accessToken && res.data?.message) {
        const loginResp = await API.post('/auth/login', { email, password });
        const token2 = loginResp.data?.accessToken;
        const user2 = loginResp.data?.user;
        if (token2 && user2) {
          saveToken(token2);
          saveUser(user2);
          nav('/dashboard');
          return;
        }
      }

      throw new Error('Signup succeeded but no token received. Please sign in.');
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Signup failed';
      setErr(message);
    } finally {
      setLoading(false);
    }
  };


  const renderField = (label, value, onChange, name, autoComplete, required = true, type = 'text') => {
    const prefilled = Boolean(value && value.toString().trim().length);
    return (
      
      <TextField
        label={prefilled ? '' : label}
        placeholder={prefilled ? label : ''}
        variant="outlined"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        margin="normal"
        name={name}
        autoComplete={autoComplete}
        required={required}
        type={type}
        InputLabelProps={{ shrink: Boolean(!prefilled && value) }}
      />
    );
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Box component="form" onSubmit={submit} className="themed-surface" sx={{ boxShadow: 2}}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h5">Create Account</Typography>
          <ThemeToggle />
        </Box>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        {renderField('Name', name, setName, 'name', 'name')}
        {renderField('Email', email, setEmail, 'email', 'email')}
        {renderField('Password', password, setPassword, 'password', 'new-password', true, 'password')}

        <FormControl fullWidth margin="normal">
          <InputLabel id="role-label">Role</InputLabel>
          <Select labelId="role-label" value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>

        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading}>
          {loading ? 'Creating…' : 'Create Account'}
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link to="/signin">Already have account?</Link>
        </Box>
      </Box>
    </Container>
  );
}