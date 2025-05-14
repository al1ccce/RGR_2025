import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { userAPI, documentsAPI } from '../api';
import { jwtDecode } from 'jwt-decode';
import '../index.css';

const Admin = () => {
    const [documents, setDocuments] = useState([]);
    const [users, setUsers] = useState([]);
    const [applications, setApplications] = useState([]);

    const [appDesc, setAppDesc] = useState(null);
    const [showAppDesc, setShowAppDesc] = useState(false);

    const [documentDesc, setDocumentDesc] = useState(null);
    const [showDocumentDesc, setShowDocumentDesc] = useState(false);

    const [userData, setUserData] = useState({
      username: '',
      name: '',
      surname: '',
      email: ''
    });
    const [showUserData, setShowUserData] = useState(false);

    const [showBanModal, setShowBanModal] = useState(false);
    const [comment, setComment] = useState(null);
    const [userban, setUserban] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        const token = localStorage.getItem('token');
        const { role } = jwtDecode(token);
        if (role !== 'admin') {
            alert('Вы не админ.');
            Navigate(-1);
        }

        const fetchData = async () => {
            try {

                const appsResponse = await userAPI.getAllDocuments();
                setDocuments(appsResponse.data);

                const userResponse = await userAPI.getAllUsers();
                setUsers(userResponse.data);

                const applicationsResponse = await userAPI.getApplications();
                setApplications(applicationsResponse.data);

            } catch (err) {
                setError(err.response?.data?.error || 'Ошибка загрузки данных');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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

    const handleClick = async (app_description) => {
        try {
          setAppDesc(app_description);
          setShowAppDesc(true);
        } catch (err) {
          console.error('Ошибка получения описания:', err);
        }
    };

    const handleDocClick = async (id) => {
      try {
        const response = await documentsAPI.info(id);
        setDocumentDesc(response.data);
        setShowDocumentDesc(true);
      } catch (err) {
        console.error('Ошибка получения описания:', err);
      }
    };



    const handleSolve = async (id, number) => {
        try {
            const response = await userAPI.solveApplication(id, number);
            alert(response.data.message);
            setApplications(prevApps => prevApps.filter(app => app.id !== id));

          } catch (err) {
            console.error('Ошибка при отправке заявки:', err);
            alert('Не удалось обработать заявку. Попробуйте позже.');
          }
    };

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

    const handleBan = async (user_id, comment) => {

      const confirmBan = window.confirm('Вы уверены, что хотите заблокировать этого пользователя?');
      if (!confirmBan) {
        setComment(null);
        setShowBanModal(false);
        return;
      }
    
      try {
        const response = await userAPI.ban(user_id, comment);
        setUsers((prev) => prev.filter((user) => user.id !== user_id));
        setShowBanModal(false);
        setComment(null);
        alert(response.data.message);
    
      } catch (err) {
        alert(err.response?.data?.error || 'Не удалось заблокировать пользователя');
        setComment(null);
        setShowBanModal(false);
        console.error(err);
      }
    };

    const handleUserClick = async (id) => {
      try {
        const res = await userAPI.getUserProf(id);
        const userData = res.data;
        setUserData({
          username: userData.username || '',
          name: userData.name || 'Не указано',
          surname: userData.surname || 'Не указано',
          email: userData.email || 'Не указано'
        });
        setShowUserData(true);
      } catch (err) {
        setError('Не удалось загрузить данные');
        console.error(err);
      };
    };
  
    
    const closeModal = () => {
        setShowAppDesc(false);
        setAppDesc(null);

        setShowDocumentDesc(false);
        setDocumentDesc(null);

        setShowUserData(false);
        setUserData({
          username: '',
          name: '',
          surname: '',
          email: ''
        });
        setComment(null);

    };

    return (
      <div className='admin-container'>
        <h2 className="admin-title">Админ-панель</h2>
        <div className="any-container">
          <h3>Заявки на администрирование</h3>
        {applications.length > 0 ? (
            <ul className="any-list">
            {applications.map((app) => (
              <li key={app.id} onClick={() => handleClick(app.description)}>
                <div className="any-item">
                <span>Заявка №{app.id} от пользователя <b>{app.username}</b>. Нажмите, чтобы прочесть</span>
                <div className="buttons">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSolve(app.id, '2');
                      
                    }}
                    className="good-button"
                  >
                    Одобрить
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSolve(app.id, '3');
                    }}
                    className="bad-button"
                  >
                    Отклонить
                  </button>
                </div>
                </div>
              </li>
            ))}
          </ul>
        ) : <p>Заявок пока нет.</p>}
          {showAppDesc && appDesc && (
            <div className="modal">
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="close" onClick={closeModal}>
                    &times;
                </span>
                <p>
                    <b>Описание:</b> {appDesc}
                </p>
                </div>
            </div>
          )}
        </div>
        <span className='spacer'></span>

        {/*documents*/}

        <div className='any-container'>
            <h3>Все документы</h3>
          {documents.length > 0 ? (
            <ul className="any-list">
              {documents.map((doc) => (
                <li key={doc.id} className="any-item" onClick={() => handleDocClick(doc.id)}>
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
                </li>
              ))}
            </ul>
          ) : (
            <p>Загруженных документов пока нет.</p>
          )}

          {showDocumentDesc && documentDesc && (
            <div className="modal">
              <div className="modal-content">
                <span className="close" onClick={closeModal}>&times;</span>
                <p><b>Описание:</b> {documentDesc.description}</p>
                <p><b>Тип:</b> {documentDesc.type}</p>
                <p><b>Дата загрузки:</b> {new Date(documentDesc.uploaded_at).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p><b>Загружено:</b> {documentDesc.username}</p>
              </div>
            </div>
          )}
        </div>

        <span className='spacer'></span>
        {/*users*/}

        <div className='any-container'>
            <h3>Пользователи</h3>
            <ul className="any-list">
              {users.map((user) => (
                <li key={user.id} className="any-item" onClick={() => handleUserClick(user.id)}>
                  <span>{user.username}</span>
                  <div className="buttons">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBanModal(true);
                      setUserban(user.id);
                    }}
                    className="bad-button"
                  >
                    Заблокировать
                  </button>
                </div>
                </li>
              ))}
            </ul>

          {showUserData && userData && (
            <div className="modal">
              <div className="modal-content">
                <span className="close" onClick={closeModal}>&times;</span>
                <p><b>Пользователь:</b> {userData.username}</p>
                <p><b>Имя:</b> {userData.name}</p>
                <p><b>Фамилия:</b> {userData.surname}</p>
                <p><b>Email:</b>{userData.email}</p>
              </div>
            </div>
          )}
        </div>

        {/*bannn*/}
        {showBanModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={() => setShowBanModal(false)}>
                &times;
              </span>
              <form onSubmit={handleBan} className="auth-form">         
                Причина блокировки:
                <input
                  className='auth-input'
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Укажите причину"
                  required
                />
              </form>

              <button className="bad-button" 
                onClick={() => {
                if (!comment || comment.trim() === '') {
                  alert('Причина блокировки обязательна для заполнения');
                  return;
                }
                handleBan(userban, comment);
                }}>
                Заблокировать
              </button>
            </div>
          </div>
        )}
      </div>


        
    );
};

export default Admin;