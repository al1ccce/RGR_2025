import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';


import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:3000/api';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);