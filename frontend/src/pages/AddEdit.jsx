import React, {useEffect, useState} from 'react';
import API from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, MenuItem } from '@mui/material';

export default function AddEdit(){
  const { id } = useParams();
  const [title,setTitle]=useState('');
  const [description,setDescription]=useState('');
  const [status,setStatus]=useState('pending');
  const nav = useNavigate();

  useEffect(()=>{
    if(id){
      API.get('/tasks/'+id).then(res=>{
        const t = res.data;
        setTitle(t.title); setDescription(t.description); setStatus(t.status);
      });
    }
  },[id]);

  const submit = async (e)=>{
    e.preventDefault();
    try{
      if(id) await API.put('/tasks/'+id,{ title, description, status });
      else await API.post('/tasks',{ title, description, status });
      nav('/dashboard');
    }catch(e){ alert('Error'); }
  };

  return (
    <Container maxWidth='sm' sx={{mt:6}}>
      <Box component='form' onSubmit={submit} className="themed-surface" sx={{ boxShadow: 2 }}>
        <Typography variant='h6' gutterBottom>{id ? 'Edit Task' : 'Add Task'}</Typography>
        <TextField value={title} onChange={e=>setTitle(e.target.value)} label='Title' fullWidth margin='normal' required />
        <TextField value={description} onChange={e=>setDescription(e.target.value)} label='Description' fullWidth multiline rows={4} margin='normal' />
        <TextField select value={status} onChange={e=>setStatus(e.target.value)} label='Status' fullWidth margin='normal'>
          <MenuItem value='pending'>Pending</MenuItem>
          <MenuItem value='completed'>Completed</MenuItem>
        </TextField>
        <Button type='submit' variant='contained' sx={{mt:2}}>Save</Button>
      </Box>
    </Container>
  );
}
