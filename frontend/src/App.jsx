import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import AddEdit from './pages/AddEdit';

export default function App(){
  return (
    <Routes>
      <Route path='/' element={<Navigate to='/signin' />} />
      <Route path='/signin' element={<SignIn />} />
      <Route path='/signup' element={<SignUp />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/task' element={<AddEdit />} />
      <Route path='/task/:id' element={<AddEdit />} />
    </Routes>
  );
}
