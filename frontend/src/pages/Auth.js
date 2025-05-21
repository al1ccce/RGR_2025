import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import '../index.css'

const Auth = ({ isRegister = false, setIsAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('')
    try {
      const { data } = isRegister
        ? await authAPI.register(username, password)
        : await authAPI.login(username, password);

      
      localStorage.setItem('token', data.token);
      setIsAuth(true); 
      navigate('/documents');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка авторизации');
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">{isRegister ? 'Регистрация' : 'Вход'}</h2>
      
      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Имя пользователя"
          className="auth-input"
          required
        />
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="auth-input"
          required
        />
        
        <button type="submit" className="auth-button">
          {isRegister ? 'Зарегистрироваться' : 'Войти'}
        </button>

        <div className="auth-switch">
          {isRegister ? (
            <span>Уже есть аккаунт? <Link to="/login">Войти</Link></span>
          ) : (
            <span>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></span>
          )}
        </div>
      </form>
    </div>
  );
};


export default Auth;