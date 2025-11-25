import React, { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import { saveUser, saveToken } from '../services/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Alert } from '@mui/material';
import ThemeToggle from '../components/ThemeToggle';

function usePrefilledInput(initialVal = '') {
  const ref = useRef(null);
  const [hasValue, setHasValue] = useState(Boolean(initialVal));

  useEffect(() => {
 
    const check = () => {
      const v = ref.current?.value;
      setHasValue(Boolean(v && v.toString().trim().length));
    };
    check();
    const t = setTimeout(check, 50);
    const el = ref.current;
    if (el) {
      const onInput = () => setHasValue(Boolean(el.value && el.value.trim().length));
      el.addEventListener('input', onInput);
      return () => {
        clearTimeout(t);
        el.removeEventListener('input', onInput);
      };
    }
    return () => clearTimeout(t);
  }, []);

  return [ref, hasValue, setHasValue];
}

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  // refs + detection for prefilled/autofill
  const [emailRef, emailPrefilled] = usePrefilledInput(email);
  const [passwordRef, passwordPrefilled] = usePrefilledInput(password);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      // backend expected to return { accessToken, user }
      const accessToken = res.data?.accessToken;
      const user = res.data?.user;
      if (!accessToken || !user) throw new Error('Invalid response from server.');
      saveToken(accessToken);
      saveUser(user);
      nav('/dashboard');
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Login failed';
      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Box component="form" onSubmit={submit} className="themed-surface" sx={{ boxShadow: 2}}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h5">Sign In</Typography>
          <ThemeToggle />
        </Box>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <TextField
          inputRef={emailRef}
          label={emailPrefilled ? '' : 'Email'}
          placeholder={emailPrefilled ? 'Email' : ''}
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          autoComplete="email"
          required
          InputLabelProps={{ shrink: Boolean(!emailPrefilled && email) }}
        />

        <TextField
          inputRef={passwordRef}
          label={passwordPrefilled ? '' : 'Password'}
          placeholder={passwordPrefilled ? 'Password' : ''}
          variant="outlined"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          autoComplete="current-password"
          required
          InputLabelProps={{ shrink: Boolean(!passwordPrefilled && password) }}
        />

        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link to="/signup">Create account</Link>
        </Box>
      </Box>
    </Container>
  );
}