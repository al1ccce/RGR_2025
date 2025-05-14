import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Documents from './pages/Documents';
import User from './pages/User';
import EditProfile from './pages/EditProfile';
import Admin from './pages/Admin'

function App() {
  const [isAuth, setIsAuth] = useState(false);


  // Проверяем авторизацию при загрузке и при изменении
  useEffect(() => {
    setIsAuth(!!localStorage.getItem('token'));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={isAuth ? "/documents" : "/login"} />} />
        <Route 
          path="/login" 
          element={!isAuth ? <Auth setIsAuth={setIsAuth} /> : <Navigate to="/documents" />} 
        />
        <Route 
          path="/register" 
          element={!isAuth ? <Auth isRegister setIsAuth={setIsAuth} /> : <Navigate to="/documents" />} 
        />
        <Route path="/documents" element={isAuth ? <Documents /> : <Navigate to="/login" />} />
        <Route path="/me" element={isAuth ? <User /> : <Navigate to="/login" />} />
        <Route path="/me/edit" element={isAuth ? <EditProfile /> : <Navigate to="/login" />} /> 
        <Route path="/me/admin" element={isAuth ? <Admin /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;