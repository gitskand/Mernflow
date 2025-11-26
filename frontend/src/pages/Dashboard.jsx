import React, { useEffect, useState, useRef } from 'react';
import API from '../services/api';
import {
  Container, Typography, Box, Button, Grid, Card, CardContent, IconButton,
  TextField, Select, MenuItem, FormControl, InputLabel, Pagination
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { getUser, removeUser } from '../services/auth';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const limit = 6; // 6 cards per page
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all'); 
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const user = getUser();

  const searchRef = useRef(null);

  const fetchTasks = async (p = page, s = status, q = query) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', p);
      params.set('limit', limit);
      if (s && s !== 'all') params.set('status', s);
      if (q && q.trim().length > 0) params.set('q', q.trim());

      const res = await API.get(`/tasks?${params.toString()}`);
      const data = res.data || {};
      setTasks(data.tasks || []);
      setPage(data.page || p);
      setPages(data.pages || 1);
      return data;
    } catch (e) {
      console.error('Failed to load tasks', e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchTasks(1, status, query);

  }, [status]);

  useEffect(() => {
    fetchTasks(page, status, query);

  }, [page]);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPage(1);
      fetchTasks(1, status, query);
    }, 300);
    return () => clearTimeout(searchRef.current);

  }, [query]);

  const removeTask = async (id) => {
    if (!confirm('Delete?')) return;
    try {
      await API.delete('/tasks/' + id);
      const data = await fetchTasks(page, status, query);
      if (data && Array.isArray(data.tasks) && data.tasks.length === 0 && page > 1) {
        setPage(page - 1);
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting task');
    }
  };

  const doLogout = async () => {
    try { await API.post('/auth/logout'); } catch (e) {}
    removeUser();
    nav('/signin');
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Tasks</Typography>
        <Box display="flex" alignItems="center">
          <ThemeToggle />
          <Button variant="outlined" sx={{ ml: 1 }} onClick={doLogout}>Logout</Button>
          <Button variant="contained" component={Link} to="/task" sx={{ ml: 1 }}>+ Add Task</Button>
        </Box>
      </Box>

      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: 240 }}
        />

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel id="filter-status-label">Status</InputLabel>
          <Select
            labelId="filter-status-label"
            value={status}
            label="Status"
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>

        <Button onClick={() => { setQuery(''); setStatus('all'); setPage(1); fetchTasks(1,'all',''); }}>
          Reset
        </Button>
      </Box>

      <Grid container spacing={2}>
        {tasks.length === 0 && !loading && (
          <Box sx={{ p: 4 }}>No tasks found.</Box>
        )}

  

        {tasks.map((t) => {
  const isExpanded = expandedTaskId === t._id;

  return (
    <Grid item xs={12} md={6} key={t._id}>
      <Card className="themed-surface">
        <CardContent sx={{ p: 2 }}>

          <Typography
            variant="h6"
            sx={{
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              mb: 1,
            }}
          >
            {t.title}
          </Typography>


          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              color: 'text.secondary',
              ...(isExpanded
                ? {}
                : {
                    display: '-webkit-box',
                    WebkitLineClamp: 4,          
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }),
           
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            {t.description || '-'}
          </Typography>


          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            {t.status} • {new Date(t.createdAt).toLocaleString()}
          </Typography>
          <Typography variant="caption" display="block">
            Author : {t.createdBy ? t.createdBy.name : 'Unknown'}
          </Typography>


          <Box mt={1} display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <IconButton component={Link} to={'/task/' + t._id}><EditIcon /></IconButton>
              {user?.role === 'admin' && (
                <IconButton onClick={() => removeTask(t._id)}><DeleteIcon /></IconButton>
              )}
            </Box>


            {t.description && t.description.length > 200 && (
              <Button
                size="small"
                onClick={() => setExpandedTaskId(isExpanded ? null : t._id)}
                sx={{ textTransform: 'none' }}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
})}
      </Grid>

      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={pages}
          page={page}
          onChange={(e, val) => setPage(val)}
          color="primary"
          disabled={pages <= 1}
        />
      </Box>
    </Container>
  );
}