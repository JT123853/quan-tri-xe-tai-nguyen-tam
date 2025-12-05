import './index.css'; 
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './index.jsx';

// DÒNG NÀY ĐÃ ĐƯỢC DỌN DẸP HOÀN TOÀN:
// Không còn bất kỳ tham chiếu nào đến 'path', 'electron' hay '__dirname'.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);