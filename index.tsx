
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
} catch (error) {
  console.error("Erro crítico na montagem do React:", error);
  if (loaderElement) {
    loaderElement.innerHTML = `<p style="color: red; padding: 20px;">Erro ao carregar o sistema. Verifique o console do navegador (F12).</p>`;
  }
} finally {
  // Pequeno delay para garantir que o React começou a renderizar
  setTimeout(() => {
    if (loaderElement) loaderElement.style.display = 'none';
  }, 500);
}
