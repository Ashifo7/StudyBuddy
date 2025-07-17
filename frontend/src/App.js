
import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Signup from './auth/Signup';
import Login from './auth/Login';
import ForgotPassword from './auth/ForgotPassword';
import ProfileComplete from './pages/ProfileComplete';
import Home from './pages/Home';
import Matches from './pages/Matches';
import OAuthCallback from './auth/OAuthCallback';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile-complete" element={<ProfileComplete />} />
        <Route path="/home" element={<Home />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
