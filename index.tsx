
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("DutyFinder: Script index.tsx carregado e compilado com sucesso!");

const rootElement = document.getElementById('root');
const loaderElement = document.getElementById('loader');

if (!rootElement) {
  console.error("DutyFinder: Elemento #root não encontrado!");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("DutyFinder: React renderizado.");
  } catch (error) {
    console.error("DutyFinder: Erro fatal no React:", error);
    if (loaderElement) {
      loaderElement.innerHTML = `<p style="color: red; padding: 20px;">Erro crítico: ${error.message}</p>`;
    }
  } finally {
    // Esconde o loader
    setTimeout(() => {
      if (loaderElement) {
        loaderElement.style.opacity = '0';
        setTimeout(() => { loaderElement.style.display = 'none'; }, 500);
      }
    }, 800);
  }
}
