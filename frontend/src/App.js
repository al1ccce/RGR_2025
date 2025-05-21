import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Documents from './pages/Documents';
import User from './pages/User';
import EditProfile from './pages/EditProfile';
import Admin from './pages/Admin';
import './index.css';


function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuth(!!token);
    setIsLoading(false); 
  }, []);

  if (isLoading) {
    return <div className = 'loading'></div>;
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuth ? <Auth setIsAuth={setIsAuth} /> : <Navigate to="/documents" />} 
        />
        <Route 
          path="/register" 
          element={!isAuth ? <Auth isRegister setIsAuth={setIsAuth} /> : <Navigate to="/documents" />} 
        />
        <Route path="/" element={<Navigate to={isAuth ? "/documents" : "/login"} />} />
        <Route 
          path="/documents" 
          element={isAuth ? <Documents /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/me" 
          element={isAuth ? <User /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/me/edit" 
          element={isAuth ? <EditProfile /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/me/admin" 
          element={isAuth ? <Admin /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;