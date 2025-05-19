import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, documentsAPI } from '../api';
import { jwtDecode } from 'jwt-decode';
import '../index.css';



const User = () => {
  const token = localStorage.getItem('token');
  const { role } = jwtDecode(token);
  console.log('role:', role);

  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [desc, setDesc] = useState(null);
  const [showDesc, setShowDesc] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [applicationDescription, setApplicationDescription] = useState('');

  // Для загрузки документа
  const [description, setDescription] = useState('');
  const [uploadType, setUploadType] = useState('Другое');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false); 

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await userAPI.getProf();
        setUser(userResponse.data);

        const docsResponse = await userAPI.getDocs();
        setDocuments(docsResponse.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowUploadModal(true); // Открываем модалку при выборе файла
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', uploadType);
    formData.append('description', description);
    console.log(formData);

    setUploading(true);
    try {
      const response = await documentsAPI.upload(selectedFile, uploadType, description);
      setDocuments((prev) => [...prev, response.data]);
      alert('Документ успешно загружен!');
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      alert('Не удалось загрузить документ.');
    } finally {
      setUploading(false);
      setSelectedFile(null);
      setDescription('');
      setUploadType('Другое');
      setShowUploadModal(false);
    }
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
    setDesc(null);
  };

  const handleDownload = async (id, filename) => {
    try {
      const response = await documentsAPI.download(id, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Ошибка:', err);
      if (err.status === 400) {
        alert('Хеш-суммы не совпадают, скачивание предотвращено!');
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await documentsAPI.delete(id);
      setDocuments((prev) => prev.filter(doc => doc.id !== id));
      alert('Документ удалён');
    } catch (err) {
      console.error('Не удалось удалить документ:', err);
      alert('Ошибка при удалении документа');
    }
  };

  const handleLogout = () => {
    navigate('/login');
    localStorage.removeItem('token');
  };

  const handleApplicationSubmit = async () => {
    const app_description = applicationDescription.trim();
    if (!app_description) {
      alert('Пожалуйста, введите описание заявки');
      return;
    }
  
    try {
      await userAPI.postApplication(app_description);
      alert('Заявка успешно отправлена!');
      setApplicationDescription(''); 
    } catch (err) {
      console.error('Ошибка при отправке заявки:', err);
      alert(err.response?.data?.error || 'Не удалось отправить заявку. Попробуйте позже.');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  if (error) {
    return (
      <div className="auth-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Попробовать снова</button>
      </div>
    );
  }

  return (
    <div className="any-container">
      <div className="auth-title">
        <h1>Мой профиль</h1>
        {role === 'admin' && (
          <button className="good-button" onClick={() => navigate('/me/admin')}>
            Админ-панель
          </button>
        )}
      </div>
      <div className="auth-container">
        <h2 className="auth-title">Личная информация</h2>

        <ul className="info-grid">
          {[
            { label: 'Имя пользователя', value: user.username || 'Не указано' },
            { label: 'Имя', value: user.name || 'Не указано'},
            { label: 'Фамилия', value: user.surname || 'Не указано'},
            { label: 'Email', value: user.email || 'Не указано'}
          ]
            .map((item, index) => (
              <React.Fragment key={index}>
                <li className="info-label">{item.label}:</li>
                <li className="info-value">{item.value}</li>
              </React.Fragment>
            ))}
        </ul>
        <button className="good-button" onClick={() => navigate('/me/edit')} >Редактировать профиль</button>
        <button className="bad-button" onClick={handleLogout}>Выйти из профиля</button>
      </div>
      <span class="spacer"></span>
      <div className="any-container">

        <h2>Мои документы</h2>

        <div className="upload-file">
          <label className="auth-button">
            Выбрать файл для загрузки
            <input
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden-input"
            />
          </label>
          <span className="file-name">
            {selectedFile ? selectedFile.name : "Файл не выбран"}
          </span>
          <button className="good-button" onClick={() => navigate('/documents')} >Все документы</button>
        </div>

        {/* Модальное окно добавления документа*/}
        {showUploadModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={() => setShowUploadModal(false)}>
                &times;
              </span>
              <h3 >Информация о документе</h3>

              <div className='form-group'>
                Описание:
                <input
                  className='auth-input'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Введите описание"
                />
              </div>

              <div className='form-group'>
                Документ:
                <select className = 'auth-input' value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                  <option value="Навигационная карта">Навигационная карта</option>
                  <option value="Бортовой журнал">Бортовой журнал</option>
                  <option value="Другое">Другое</option>
                </select>
              </div>

              <button className="good-button" onClick={handleSubmit} disabled={uploading}>
                {uploading ? 'Загрузка...' : 'Загрузить'}
              </button>
              <button className="bad-button" onClick={() => setShowUploadModal(false)}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Список документов */}
        {documents.length === 0 ? (
          <p>У вас пока нет загруженных документов</p>
        ) : (
          <ul className="any-list">
            {documents.map((doc) => (
              <li key={doc.id} onClick={() => handleClick(doc.id)}>
                <div className="any-item">
                <span>{doc.filename}</span>
                <div className="buttons">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc.id, doc.filename);
                    }}
                    className="good-button"
                  >
                    Скачать
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    className="bad-button"
                  >
                    Удалить
                  </button>
                </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Модалка просмотра информации */}
        {showDesc && desc && (
          <div className="modal">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <span className="close" onClick={closeModal}>
                &times;
              </span>
              <p>
                <b>Описание:</b> {desc.description}
              </p>
              <p>
                <b>Тип:</b> {desc.type}
              </p>
              <p>
                <b>Дата загрузки:</b>{' '}
                {new Date(desc.uploaded_at).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p>
                <b>Загружено:</b> {desc.username}
              </p>
            </div>
          </div>
        )}
      </div>
      <span className='spacer'></span>
      {role !== 'admin' && (
        <div className="any-container">
          <h3>Желаете стать администратором? Оставьте заявку и укажите, почему именно Вы подходите на эту роль!</h3>
          <div className='form-group'>
            Описание:
            <input
              className='auth-input'
              value={applicationDescription}
              onChange={(e) => setApplicationDescription(e.target.value)}
              placeholder="Введите описание"
            />
          </div>
          <button
            className="good-button"
            onClick={handleApplicationSubmit}
          >
            Отправить заявку
          </button>
        </div>
      )}
    </div>
  );
};

export default User;