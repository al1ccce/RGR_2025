import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI, userAPI } from '../api';
import '../index.css';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desc, setDesc] = useState(null);
  const [showDesc, setShowDesc] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data } = await userAPI.getAllDocuments();
        setDocuments(data);
        console.log(data);
      } catch (err) {
        console.error('Ошибка загрузки документов:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const handleDownload = async (id, filename) => {
    try {
      const response = await documentsAPI.download(id, { 
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      link.remove();
      
    } catch (err) {
      console.error('Ошибка:', err);
      if (err.status === 400){
        alert('Хеш-суммы не совпадают, скачивание предотвращено!');
      }
    }
  };

  const handleLogout = () => {
    navigate('/login');
    localStorage.removeItem('token');
  };

  const handleClick = async (id) => {
    try {
      const response = await documentsAPI.info(id);
      setDesc(response.data);
      setShowDesc(true);
    } catch (err) {
      console.error('Ошибка получения описания:', err);
    }
  };

  const closeModal = () => {
    setShowDesc(false);
    setDesc(null); // Сбросить описание при закрытии
  };

  return (
    <div className="any-container">
      <header className="any-header">
        <h2>Все документы</h2>
        <div className='dratuti'>
          <button type="button" onClick={() => navigate('/me')} className="good-button">Профиль</button>
          <button onClick={handleLogout} className="bad-button">Выйти</button>
        </div>
      </header>

      {loading ? (
        <div className="loading">Загрузка документов...</div>
      ) : documents.length > 0 ? (
        <ul className="any-list">
          {documents.map((doc) => (
            <li key={doc.id} className="any-item" onClick={() => handleClick(doc.id)}>
              <span>{doc.filename}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(doc.id, doc.filename);
                }}
                className="good-button"
              >
                Скачать
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Ну-и-ну! Здесь пока пусто... Но вы можете заполнить пустоту, загрузив первый документ!</p>
      )}

      {showDesc && desc && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>&times;</span>
            <p><b>Описание:</b> {desc.description}</p>
            <p><b>Тип:</b> {desc.type}</p>
            <p><b>Дата загрузки:</b> {new Date(desc.uploaded_at).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p><b>Загружено:</b> {desc.username}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
