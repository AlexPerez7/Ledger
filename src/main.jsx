import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { AuthGate } from "./components/AuthGate.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import "./index.css";

if ("serviceWorker" in navigator) {
  // registerType: "autoUpdate" ya hace que el SW nuevo tome control solo al
  // detectarlo; el chequeo periódico es para que lo detecte incluso si la
  // pestaña queda abierta mucho tiempo sin recargar (no navega, no hay chequeo).
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => registration.update(), 60 * 60 * 1000);
    },
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthGate />
    </ErrorBoundary>
  </React.StrictMode>
);
