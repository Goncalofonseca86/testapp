import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): State {
    console.log("🚨 ErrorBoundary caught error:", error.message);
    console.log("🚨 Error stack:", error.stack);

    // VERIFICAÇÃO ESPECIAL: Se estamos vindo de uma criação de obra
    const currentPath = window.location.pathname;
    const fromCreateWork =
      currentPath.includes("/create-work") ||
      currentPath.includes("/dashboard") ||
      sessionStorage.getItem("just_created_work") === "true";

    if (fromCreateWork) {
      console.log(
        "🏗️ Erro detectado após criar obra - EVITANDO logout forçado",
      );
      sessionStorage.removeItem("just_created_work");
      return { hasError: true, error, retryCount: 0 };
    }

    // EVITAR logout desnecessário em erros de operações CRUD ou Firebase
    const recoversableErrors = [
      "Não foi possível salvar a obra",
      "obra criada mas não encontrada",
      "Firebase",
      "firestore",
      "Failed to fetch",
      "NetworkError",
      "Sync",
      "createWork",
      "updateWork",
      "updateMaintenance",
      "createMaintenance",
      "não foi possível salvar",
      "Por favor, tente novamente",
      "Problema de conectividade",
      "Erro ao guardar obra",
      "Erro ao criar obra",
      "obra pode ter sido guardada",
      "obra provavelmente foi guardada",
      "fallback",
      "backup",
      "atribuições",
      "assignedUsers",
      "Erro do sistema. A obra pode ter sido guardada",
      "Erro interno. Tente recarregar",
      "salvamento",
      "guardar",
      "salvar",
      "firebaseSuccess",
      "ReferenceError",
      "is not defined",
      "CreateWork",
      "nova obra",
      "folha de obra",
      "navigate",
      "navigation",
      "router",
      "Dashboard",
      "after creating",
      "após criar",
      "depois de guardar",
      "após guardar",
      "work created",
      "obra criada",
      "redirect",
      "redirection",
      "pathname",
      "location",
      "window.location",
      "useNavigate",
      "NavLink",
      "Link",
      "route",
      "routing",
    ];

    const isRecoverableError = recoversableErrors.some((keyword) =>
      error.message?.toLowerCase().includes(keyword.toLowerCase()),
    );

    if (isRecoverableError) {
      console.log(
        "⚠️ Erro recuperável detectado - NÃO forçar logout:",
        error.message,
      );
      return { hasError: true, error, retryCount: 0 };
    }

    // Verificar se é um erro recorrente APENAS para erros críticos
    const errorKey = `error_${error.message?.slice(0, 50)}`;
    const errorCount = parseInt(localStorage.getItem(errorKey) || "0");
    localStorage.setItem(errorKey, String(errorCount + 1));

    // Se for erro recorrente crítico (>= 3 vezes), forçar reload
    if (errorCount >= 2) {
      console.warn(
        `⚠️ Erro crítico recorrente detectado (${errorCount + 1}x): ${error.message}`,
      );
      localStorage.removeItem(errorKey);

      // Para erros críticos, limpar dados corrompidos
      try {
        sessionStorage.clear();
        // NÃO remover leirisonda_user a menos que seja um erro de autenticação
        if (
          error.message?.includes("useAuth") ||
          error.message?.includes("AuthProvider")
        ) {
          localStorage.removeItem("leirisonda_user");
        }
      } catch (clearError) {
        console.error("Erro ao limpar dados:", clearError);
      }

      setTimeout(() => {
        console.log("🔄 Auto-reloading devido a erro crítico recorrente...");
        window.location.reload(); // Reload em vez de redirect para login
      }, 1000);
    }

    // Handle common development errors
    if (
      error.message?.includes("useAuth must be used within") ||
      error.message?.includes("AuthProvider") ||
      error.message?.includes("useContext")
    ) {
      console.warn("AuthProvider context error caught, will try to recover...");
      // Try to reload the page to reinitialize context
      setTimeout(() => {
        console.log("🔄 Auto-reloading due to context error...");
        window.location.reload();
      }, 1000);
      return { hasError: true, error, retryCount: 0 };
    }

    // Handle Firebase initialization errors
    if (
      error.message?.includes("Firebase") ||
      error.message?.includes("firebase") ||
      error.message?.includes("auth/") ||
      error.message?.includes("firestore/")
    ) {
      console.warn(
        "Firebase error caught, will show recovery options:",
        error.message,
      );
      return { hasError: true, error, retryCount: 0 };
    }

    // Handle module loading errors
    if (
      error.message?.includes("Loading chunk") ||
      error.message?.includes("ChunkLoadError") ||
      error.message?.includes("Failed to fetch")
    ) {
      console.warn("Chunk loading error, will show reload options");
      return { hasError: true, error, retryCount: 0 };
    }

    // Handle network/connectivity errors
    if (
      error.message?.includes("NetworkError") ||
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("fetch")
    ) {
      console.warn("Network error caught:", error.message);
      return { hasError: true, error, retryCount: 0 };
    }

    // Handle import/module errors
    if (
      error.message?.includes("Cannot resolve module") ||
      error.message?.includes("Module not found") ||
      error.message?.includes("import")
    ) {
      console.warn("Module import error:", error.message);
      return { hasError: true, error, retryCount: 0 };
    }

    return { hasError: true, error, retryCount: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Ignore specific development errors
    if (
      error.message?.includes("useAuth must be used within") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("ChunkLoadError")
    ) {
      return;
    }

    console.error("🚨 Application Error:", error);
    console.error("🚨 Error Info:", errorInfo);

    // Store error details
    this.setState({
      errorInfo,
      retryCount: this.state.retryCount + 1,
    });

    // Auto-reload after multiple errors (possible infinite loop protection)
    if (this.state.retryCount > 3) {
      console.warn("Multiple errors detected, forcing page reload...");
      setTimeout(() => window.location.reload(), 2000);
    }
  }

  private handleReset = () => {
    console.log("🔄 User requested error reset");
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
    });
  };

  private handleReload = () => {
    console.log("🔄 User requested page reload");
    // Clear any stored error state
    localStorage.removeItem("app_error_state");
    localStorage.removeItem("leirisonda_error_state");
    sessionStorage.clear();
    window.location.reload();
  };

  private handleGoHome = () => {
    console.log("🏠 User requested navigation to home");
    // Clear error state and navigate to home
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
    });
    window.location.href = "/dashboard";
  };

  private handleClearData = () => {
    console.log("🧹 User requested data clearing");
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear any caches if available
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }

      alert("Dados limpos! A recarregar página...");
      window.location.reload();
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Erro ao limpar dados. A recarregar página...");
      window.location.reload();
    }
  };

  private handleSystemStatus = () => {
    console.log("🔍 User requested system diagnosis");
    window.location.href = "/system-status";
  };

  private handleEmergencyDiagnostic = () => {
    console.log("🚨 User requested emergency diagnostic");
    window.location.href = "/emergency-diagnostic";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Oops! Algo correu mal
            </h1>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro inesperado. Por favor, experimente uma das opções
              abaixo.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </button>

              <button
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Recarregar Página
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para Início
              </button>

              <button
                onClick={this.handleSystemStatus}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Diagnóstico do Sistema
              </button>

              <button
                onClick={this.handleEmergencyDiagnostic}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Diagnóstico de Emergência
              </button>

              <button
                onClick={this.handleClearData}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Limpar Dados e Reiniciar
              </button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto">
                  <div className="font-semibold mb-2">Erro:</div>
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                  {this.state.error.stack && (
                    <>
                      <div className="font-semibold mt-3 mb-2">
                        Stack trace:
                      </div>
                      <pre className="whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                  {this.state.errorInfo && (
                    <>
                      <div className="font-semibold mt-3 mb-2">
                        Component stack:
                      </div>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
