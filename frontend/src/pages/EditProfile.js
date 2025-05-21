import React, { useEffect, useState } from 'react';
import { userAPI } from '../api';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    surname: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await userAPI.getProf();
        const userData = res.data;
        setFormData({
          username: userData.username || '',
          name: userData.name || '',
          surname: userData.surname || '',
          email: userData.email || ''
        });
      } catch (err) {
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      await userAPI.updateProf(formData);
      alert('Профиль успешно обновлён');
      navigate('/me');
  
    } catch (err) {
      const errorMessage = err.response?.data?.error 
        || 'Неизвестная ошибка';
      setError(errorMessage);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="auth-container">
      <h2 className="auth-title">Редактировать профиль</h2>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>Пользователь:</label>
          <input type="text" className="auth-input" name="username" value={formData.username} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Имя:</label>
          <input type="text" className="auth-input" name="name" value={formData.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Фамилия:</label>
          <input type="text" className="auth-input" name="surname" value={formData.surname} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input type="email" className="auth-input" name="email" value={formData.email} onChange={handleChange} />
        </div>

        <button type="submit" className="good-button">Сохранить изменения</button>
        <button type="button" onClick={() => navigate(-1)} className="bad-button">Отмена</button>
      </form>
    </div>
  );
};

export default EditProfile;