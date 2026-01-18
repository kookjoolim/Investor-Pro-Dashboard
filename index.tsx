import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// 👇 1. 이 줄을 추가합니다. (라우터 기능 가져오기)
import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* 👇 2. BrowserRouter로 감싸고 basename을 설정합니다 */}
    <BrowserRouter basename="/Investor-Pro-Dashboard">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
