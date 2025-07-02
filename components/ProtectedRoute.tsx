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

  // VERIFICAÇÃO CRÍTICA: Se acabou de criar uma obra, NÃO redirecionar para login
  const justCreatedWork = React.useMemo(() => {
    try {
      const flag = sessionStorage.getItem("just_created_work");
      if (flag === "true") {
        console.log("🎯 OBRA ACABADA DE CRIAR - PROTEGENDO SESSÃO");
        // Limpar flag após usar
        sessionStorage.removeItem("just_created_work");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Show loading while auth is initializing or processing
  // Timeout de segurança mais conservador para evitar redirects desnecessários
  React.useEffect(() => {
    if (!isInitialized && !isLoading && !justCreatedWork) {
      const timeout = setTimeout(() => {
        console.warn(
          "⚠️ Auth inicialização demorou muito, verificando estado...",
        );

        // VERIFICAÇÃO MÚLTIPLA antes de redirecionar
        try {
          const storedUser = localStorage.getItem("leirisonda_user");
          const sessionUser = sessionStorage.getItem("temp_user_session");
          const justCreated = sessionStorage.getItem("just_created_work");

          // Se há qualquer indicação de usuário válido, recarregar em vez de redirecionar
          if (storedUser || sessionUser || justCreated === "true") {
            console.log(
              "👤 Estado de usuário detectado, recarregando página...",
            );
            window.location.reload();
            return;
          }

          // Verificar se há backup de usuário por ID
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("user_backup_")) {
              console.log("👤 Backup de usuário encontrado, recarregando...");
              window.location.reload();
              return;
            }
          }

          console.log(
            "🔒 Nenhum estado de usuário encontrado, redirecionando para login",
          );
          window.location.href = "/login";
        } catch (error) {
          console.error("Erro ao verificar estado de autenticação:", error);
          // Em caso de erro, ser conservador e recarregar em vez de redirecionar
          window.location.reload();
        }
      }, 12000); // Aumentado para 12 segundos para dar mais tempo ao Firebase

      return () => clearTimeout(timeout);
    }
  }, [isInitialized, isLoading, justCreatedWork]);

  // PROTEÇÃO ESPECIAL: Se acabou de criar obra, forçar que mostre conteúdo mesmo que user seja null momentaneamente
  if (justCreatedWork) {
    console.log("🛡️ PROTEÇÃO ATIVA: Mostrando conteúdo pós-criação de obra");
    return <>{children}</>;
  }

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-leirisonda-blue-light to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-leirisonda-primary mx-auto mb-4"></div>
          <p className="text-leirisonda-text-muted">A carregar...</p>
          <p className="text-xs text-gray-400 mt-2">
            A inicializar sistema de autenticação...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // VERIFICAÇÃO ADICIONAL: Tentar recuperar utilizador do localStorage
    try {
      const storedUser = localStorage.getItem("leirisonda_user");
      if (storedUser) {
        console.log(
          "🔄 Utilizador encontrado no localStorage mas não no contexto, recarregando...",
        );
        // Dar tempo ao AuthProvider para carregar o utilizador
        setTimeout(() => {
          if (!authData.user) {
            window.location.reload();
          }
        }, 1000);

        // Mostrar loading enquanto espera
        return (
          <div className="min-h-screen bg-gradient-to-br from-leirisonda-blue-light to-white flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-leirisonda-primary mx-auto mb-4"></div>
              <p className="text-leirisonda-text-muted">
                A recuperar sessão...
              </p>
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error("Erro ao verificar localStorage:", error);
    }

    console.log("🔒 Utilizador não autenticado, redirecionando para login");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
