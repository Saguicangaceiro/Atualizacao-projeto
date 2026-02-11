
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("DutyFinder: Montando aplicação...");

const rootElement = document.getElementById('root');
const loaderElement = document.getElementById('loader');

if (!rootElement) {
  throw new Error("Não foi possível encontrar o elemento root para montar a aplicação.");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  // Remove o loader assim que o React começar a montar
  if (loaderElement) {
    loaderElement.style.display = 'none';
  }
} catch (error) {
  console.error("Erro crítico na montagem do React:", error);
  if (loaderElement) {
    loaderElement.innerHTML = `<p style="color: red; padding: 20px;">Erro ao carregar o sistema. Verifique o console do navegador (F12).</p>`;
  }
}
