import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  let authData;

  try {
    authData = useAuth();
  } catch (error) {
    console.error("❌ Erro no ProtectedRoute ao acessar auth:", error);
    // Redirecionar para login se não conseguir acessar contexto
    return <Navigate to="/login" replace />;
  }

  const { user, isLoading, isInitialized } = authData;

  // Show loading while auth is initializing or processing
  // Adicionar timeout de segurança para evitar loading infinito
  React.useEffect(() => {
    if (!isInitialized && !isLoading) {
      const timeout = setTimeout(() => {
        console.warn("⚠️ Auth inicialização demorou muito, redirecionando...");
        window.location.href = "/login";
      }, 5000); // 5 segundos timeout

      return () => clearTimeout(timeout);
    }
  }, [isInitialized, isLoading]);

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-leirisonda-blue-light to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-leirisonda-primary mx-auto mb-4"></div>
          <p className="text-leirisonda-text-muted">A carregar...</p>
          <p className="text-xs text-gray-400 mt-2">
            Se demorar muito, será redirecionado automaticamente...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("🔒 Utilizador não autenticado, redirecionando para login");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
