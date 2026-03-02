/*import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
    
  </StrictMode>,
)*/
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import { MusicProvider } from "./components/MusicContext"; // ✅ indispensable

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* ✅ on enveloppe tout l'app dans MusicProvider */}
    <MusicProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MusicProvider>
  </StrictMode>
);


