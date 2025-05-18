import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Documents from './pages/Documents';
import User from './pages/User';
import EditProfile from './pages/EditProfile';
import Admin from './pages/Admin';

// Защита роутов 
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const [isAuth, setIsAuth] = useState(false);

  // Обновляем isAuth при изменении токена
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

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me"
          element={
            <ProtectedRoute>
              <User />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;