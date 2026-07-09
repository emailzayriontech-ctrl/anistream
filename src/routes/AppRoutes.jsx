import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Splash from '../pages/Splash';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import Explore from '../pages/Explore';
import AnimeDetail from '../pages/AnimeDetail';
import Watch from '../pages/Watch';
import Ongoing from '../pages/Ongoing';
import Profile from '../pages/Profile';
import AdminDashboard from '../pages/AdminDashboard';

// Route Guard to verify user is authenticated (including guest session)
const AuthGuard = ({ children, user, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090a10]">
        <div className="w-10 h-10 border-4 border-transparent border-t-[#8b5cf6] rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/splash" replace />;
  }
  
  return children;
};

// Route Guard specifically for Administrators
const AdminGuard = ({ children, user, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090a10]">
        <div className="w-10 h-10 border-4 border-transparent border-t-[#8b5cf6] rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

const AppRoutes = ({ user, loading, onAuthChange }) => {
  return (
    <Routes>
      {/* Entry Splash Screen */}
      <Route 
        path="/splash" 
        element={user ? <Navigate to="/home" replace /> : <Splash />} 
      />
      
      {/* Authentication */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/home" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/home" replace /> : <Register />} 
      />

      {/* Main App Views (Guarded by User Presence) */}
      <Route 
        path="/home" 
        element={
          <AuthGuard user={user} loading={loading}>
            <Home user={user} />
          </AuthGuard>
        } 
      />
      <Route 
        path="/explore" 
        element={
          <AuthGuard user={user} loading={loading}>
            <Explore />
          </AuthGuard>
        } 
      />
      <Route 
        path="/anime/:id" 
        element={
          <AuthGuard user={user} loading={loading}>
            <AnimeDetail user={user} />
          </AuthGuard>
        } 
      />
      <Route 
        path="/watch/:animeId/:episodeId" 
        element={
          <AuthGuard user={user} loading={loading}>
            <Watch user={user} />
          </AuthGuard>
        } 
      />
      <Route 
        path="/ongoing" 
        element={
          <AuthGuard user={user} loading={loading}>
            <Ongoing />
          </AuthGuard>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <AuthGuard user={user} loading={loading}>
            <Profile user={user} onAuthChange={onAuthChange} />
          </AuthGuard>
        } 
      />

      {/* Admin Operations Dashboard */}
      <Route 
        path="/admin" 
        element={
          <AdminGuard user={user} loading={loading}>
            <AdminDashboard />
          </AdminGuard>
        } 
      />

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default AppRoutes;
