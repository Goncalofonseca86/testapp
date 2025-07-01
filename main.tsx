import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./global.css";

// Components
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

// Pages
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { WorksList } from "./pages/WorksList";
import { WorkDetail } from "./pages/WorkDetail";
import { CreateWork } from "./pages/CreateWork";
import { EditWork } from "./pages/EditWork";
import { CreateUser } from "./pages/CreateUser";
import { UsersList } from "./pages/UsersList";
import { EditUser } from "./pages/EditUser";
import { UserDataManager } from "./pages/UserDataManager";
import { PoolMaintenancePage } from "./pages/PoolMaintenance";
import { MaintenanceList } from "./pages/MaintenanceList";
import { CreateMaintenance } from "./pages/CreateMaintenance";
import { MaintenanceDetail } from "./pages/MaintenanceDetail";
import { CreateIntervention } from "./pages/CreateIntervention";
import { NewMaintenanceSelector } from "./pages/NewMaintenanceSelector";
import { MobileDeploy } from "./pages/MobileDeploy";
import { SystemStatus } from "./pages/SystemStatus";
import { UserSyncDiagnostic } from "./pages/UserSyncDiagnostic";
import { DebugWorks } from "./pages/DebugWorks";
import { SyncMonitor } from "./pages/SyncMonitor";
import SyncDiagnostic from "./pages/SyncDiagnostic";
import { NotFound } from "./pages/NotFound";
import { EmergencyDiagnostic } from "./pages/EmergencyDiagnostic";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/system-status" element={<SystemStatus />} />
            <Route
              path="/emergency-diagnostic"
              element={<EmergencyDiagnostic />}
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="works" element={<WorksList />} />
              <Route path="works/:id" element={<WorkDetail />} />
              <Route path="create-work" element={<CreateWork />} />
              <Route path="edit-work/:id" element={<EditWork />} />
              <Route path="users" element={<UsersList />} />
              <Route path="create-user" element={<CreateUser />} />
              <Route path="edit-user/:id" element={<EditUser />} />
              <Route path="user-data" element={<UserDataManager />} />
              <Route
                path="user-sync-diagnostic"
                element={<UserSyncDiagnostic />}
              />
              <Route path="debug-works" element={<DebugWorks />} />
              <Route path="sync-monitor" element={<SyncMonitor />} />
              <Route path="sync-diagnostic" element={<SyncDiagnostic />} />
              <Route path="pool-maintenance" element={<MaintenanceList />} />
              <Route
                path="create-maintenance"
                element={<CreateMaintenance />}
              />
              <Route path="maintenance/:id" element={<MaintenanceDetail />} />
              <Route
                path="maintenance/:maintenanceId/new-intervention"
                element={<CreateIntervention />}
              />
              <Route
                path="maintenance/new-general"
                element={<NewMaintenanceSelector />}
              />
              <Route path="mobile-deploy" element={<MobileDeploy />} />
              <Route
                path="old-pool-maintenance"
                element={<PoolMaintenancePage />}
              />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Simple and robust initialization
const initializeApp = () => {
  try {
    console.log("🚀 Starting Leirisonda...");

    // Check for problematic URLs and redirect to safe route
    const currentUrl = window.location.href;
    const currentPath = window.location.pathname + window.location.search;

    console.log("📍 Current URL:", currentUrl);
    console.log("📍 Current path:", currentPath);

    // Se estiver numa URL problemática que causa loop, redirecionar para login/dashboard
    if (
      currentPath.includes("/works?status=pendente") ||
      currentPath.includes("/works?") ||
      currentPath.includes("status=pendente")
    ) {
      console.log("⚠️ Detected problematic URL, redirecting to safe route...");
      window.history.replaceState({}, "", "/login");
    }

    // Verify DOM is ready
    if (document.readyState === "loading") {
      console.log("⏳ DOM still loading, waiting...");
      document.addEventListener("DOMContentLoaded", initializeApp);
      return;
    }

    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }

    // Check for React availability
    if (!React || !ReactDOM) {
      throw new Error("React or ReactDOM not available");
    }

    // Clear any previous content
    rootElement.innerHTML = "";

    // Create React root and render with strict mode
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );

    console.log("✅ Leirisonda loaded successfully!");
  } catch (error) {
    console.error("❌ Error loading app:", error);
    showFallbackError(error);
  }
};

const showFallbackError = (error: any) => {
  console.error("💥 Showing fallback error interface");

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    document.body.innerHTML = createErrorHTML(error);
    return;
  }

  rootElement.innerHTML = createErrorHTML(error);
};

const createErrorHTML = (error: any) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const timestamp = new Date().toLocaleString();
  const userAgent = navigator.userAgent;
  const url = window.location.href;

  return `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #f9fafb; padding: 1rem; font-family: system-ui, -apple-system, sans-serif;">
      <div style="max-width: 32rem; width: 100%; background: white; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); padding: 2rem;">

        <!-- Logo/Header -->
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #b30229, #007784); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
            <span style="color: white; font-size: 1.5rem; font-weight: bold;">L</span>
          </div>
          <h1 style="font-size: 1.5rem; font-weight: bold; color: #111827; margin: 0;">
            Leirisonda
          </h1>
          <p style="color: #6b7280; margin: 0.5rem 0 0 0;">
            Sistema de Gestão de Obras
          </p>
        </div>

        <!-- Error Message -->
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
            <svg style="width: 1.25rem; height: 1.25rem; color: #dc2626; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 14.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <span style="font-weight: 600; color: #dc2626;">Erro de Inicialização</span>
          </div>
          <p style="color: #7f1d1d; margin: 0; font-size: 0.875rem;">
            A aplicação não conseguiu carregar corretamente. Por favor, tente uma das opções abaixo.
          </p>
        </div>

        <!-- Action Buttons -->
        <div style="space-y: 0.75rem;">
          <button
            onclick="tryAgain()"
            style="width: 100%; display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; background-color: #16a34a; color: white; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 500; text-decoration: none; transition: background-color 0.2s; margin-bottom: 0.75rem;"
            onmouseover="this.style.backgroundColor='#15803d'"
            onmouseout="this.style.backgroundColor='#16a34a'"
          >
            <svg style="width: 1rem; height: 1rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Tentar Novamente
          </button>

          <button
            onclick="window.location.reload()"
            style="width: 100%; display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; background-color: #2563eb; color: white; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 500; text-decoration: none; transition: background-color 0.2s; margin-bottom: 0.75rem;"
            onmouseover="this.style.backgroundColor='#1d4ed8'"
            onmouseout="this.style.backgroundColor='#2563eb'"
          >
            <svg style="width: 1rem; height: 1rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Recarregar Página
          </button>

          <button
            onclick="window.location.href='/login'"
            style="width: 100%; display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; background-color: #0891b2; color: white; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 500; text-decoration: none; transition: background-color 0.2s; margin-bottom: 0.75rem;"
            onmouseover="this.style.backgroundColor='#0e7490'"
            onmouseout="this.style.backgroundColor='#0891b2'"
          >
            <svg style="width: 1rem; height: 1rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            Ir para Login
          </button>

          <button
            onclick="window.location.href='/system-status'"
            style="width: 100%; display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; background-color: #6b7280; color: white; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 500; text-decoration: none; transition: background-color 0.2s; margin-bottom: 0.75rem;"
            onmouseover="this.style.backgroundColor='#4b5563'"
            onmouseout="this.style.backgroundColor='#6b7280'"
          >
            <svg style="width: 1rem; height: 1rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Diagnóstico do Sistema
          </button>

          <button
            onclick="window.location.href='/emergency-diagnostic'"
            style="width: 100%; display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; background-color: #ea580c; color: white; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 500; text-decoration: none; transition: background-color 0.2s; margin-bottom: 0.75rem;"
            onmouseover="this.style.backgroundColor='#c2410c'"
            onmouseout="this.style.backgroundColor='#ea580c'"
          >
            <svg style="width: 1rem; height: 1rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 14.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            Diagnóstico de Emergência
          </button>

          <button
            onclick="clearAppData()"
            style="width: 100%; display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; background-color: #dc2626; color: white; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 500; text-decoration: none; transition: background-color 0.2s;"
            onmouseover="this.style.backgroundColor='#b91c1c'"
            onmouseout="this.style.backgroundColor='#dc2626'"
          >
            <svg style="width: 1rem; height: 1rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Limpar Dados e Tentar Novamente
          </button>
        </div>

        <!-- Technical Details (Collapsible) -->
        <details style="margin-top: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;">
          <summary style="cursor: pointer; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
            Detalhes Técnicos
          </summary>
          <div style="font-size: 0.75rem; color: #6b7280; space-y: 0.25rem;">
            <div><strong>Erro:</strong> ${errorMessage}</div>
            <div><strong>Hora:</strong> ${timestamp}</div>
            <div><strong>URL:</strong> ${url}</div>
            <div><strong>Navegador:</strong> ${userAgent}</div>
            <div><strong>Suporte localStorage:</strong> ${typeof Storage !== "undefined" ? "Sim" : "Não"}</div>
            <div><strong>Suporte ServiceWorker:</strong> ${"serviceWorker" in navigator ? "Sim" : "Não"}</div>
          </div>
        </details>

        <!-- Contact Info -->
        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 0.875rem; margin: 0;">
            Se o problema persistir, contacte o suporte técnico
          </p>
        </div>
      </div>
    </div>

    <script>
      function tryAgain() {
        console.log('🔄 User clicked try again');
        // Clear error flags first
        sessionStorage.removeItem('leirisonda_error');
        localStorage.removeItem('leirisonda_error_state');

        // Try to reinitialize the app
        if (window.initializeApp) {
          window.initializeApp();
        } else {
          window.location.reload();
        }
      }

      function clearAppData() {
        try {
          console.log('🧹 Clearing app data...');
          // Clear localStorage
          localStorage.clear();
          // Clear sessionStorage
          sessionStorage.clear();
          // Clear any potential service worker caches
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name);
              });
            });
          }
          alert('Dados limpos! A recarregar página...');
          window.location.reload();
        } catch (error) {
          console.error('Error clearing data:', error);
          alert('Erro ao limpar dados. A recarregar página...');
          window.location.reload();
        }
      }
    </script>
  `;
};

// Função de recuperação de emergência
const emergencyRecovery = () => {
  console.log("🚨 RECUPERAÇÃO DE EMERGÊNCIA INICIADA");

  try {
    // 1. Limpar todos os dados locais
    localStorage.clear();
    sessionStorage.clear();

    // 2. Limpar caches se disponível
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }

    // 3. Remover listeners de eventos
    window.removeEventListener("online", () => {});
    window.removeEventListener("offline", () => {});

    // 4. Forçar navegação para login
    window.location.href = "/login";
  } catch (error) {
    console.error("❌ Erro na recuperação de emergência:", error);
    // Último recurso: reload completo
    window.location.reload();
  }
};

// Expose functions globally for error recovery
(window as any).initializeApp = initializeApp;
(window as any).emergencyRecovery = emergencyRecovery;

// Handle different loading states
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
