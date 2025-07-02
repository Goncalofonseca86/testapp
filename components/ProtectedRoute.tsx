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
  const [justCreatedWork, setJustCreatedWork] = React.useState(false);
  const [isRecoveringFromWorkCreation, setIsRecoveringFromWorkCreation] =
    React.useState(false);

  // Detectar se acabou de criar obra na inicialização
  React.useEffect(() => {
    try {
      const flag = sessionStorage.getItem("just_created_work");
      const workTimestamp = localStorage.getItem("work_created_timestamp");

      if (flag === "true" || workTimestamp) {
        console.log("🎯 OBRA ACABADA DE CRIAR - PROTEGENDO SESSÃO");
        setJustCreatedWork(true);
        setIsRecoveringFromWorkCreation(true);

        // Não remover a flag imediatamente - manter por mais tempo
        // sessionStorage.removeItem("just_created_work");
      }
    } catch (error) {
      console.warn("Erro ao verificar flag de criação de obra:", error);
    }
  }, []);

  // Se acabou de criar obra, tentar forçar recuperação da sessão
  React.useEffect(() => {
    if (justCreatedWork && !user && !isLoading) {
      console.log("🔄 FORÇANDO RECUPERAÇÃO DE SESSÃO PÓS-OBRA");

      const forceRecovery = () => {
        try {
          // Tentar diferentes estratégias de recuperação
          const storedUser = localStorage.getItem("leirisonda_user");
          const sessionUser = sessionStorage.getItem("temp_user_session");

          if (storedUser || sessionUser) {
            console.log("🔄 Tentando recuperar sessão, recarregando página...");
            // Dar um pouco mais de tempo para o AuthProvider processar
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            // Buscar backup por ID
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith("user_backup_")) {
                console.log("🔄 Backup encontrado, recarregando...");
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
                return;
              }
            }

            console.log("❌ Nenhuma sessão encontrada para recuperar");
            setIsRecoveringFromWorkCreation(false);
            setJustCreatedWork(false);
            // Limpar flags problemáticas
            sessionStorage.removeItem("just_created_work");
            localStorage.removeItem("work_created_timestamp");
          }
        } catch (error) {
          console.error("Erro na recuperação forçada:", error);
          setIsRecoveringFromWorkCreation(false);
          setJustCreatedWork(false);
        }
      };

      // Dar um tempo para o AuthProvider tentar primeiro
      const recoveryTimer = setTimeout(forceRecovery, 3000);

      return () => clearTimeout(recoveryTimer);
    }
  }, [justCreatedWork, user, isLoading]);

  // Timeout de segurança mais conservador para evitar redirects desnecessários
  React.useEffect(() => {
    if (
      !isInitialized &&
      !isLoading &&
      !justCreatedWork &&
      !isRecoveringFromWorkCreation
    ) {
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
      }, 8000); // Reduzido para 8 segundos para evitar timeout longo

      return () => clearTimeout(timeout);
    }
  }, [isInitialized, isLoading, justCreatedWork, isRecoveringFromWorkCreation]);

  // PROTEÇÃO ESPECIAL: Se acabou de criar obra, forçar que mostre conteúdo mesmo que user seja null momentaneamente
  if (justCreatedWork && !user) {
    console.log(
      "🛡️ PROTEÇÃO ATIVA: Tentando recuperar sessão pós-criação de obra",
    );

    // Cleanup após um tempo mais longo para dar oportunidade de recuperação
    React.useEffect(() => {
      const cleanupTimer = setTimeout(() => {
        try {
          console.log("🧹 Limpando flags de criação de obra após timeout");
          sessionStorage.removeItem("just_created_work");
          localStorage.removeItem("work_created_timestamp");
          setJustCreatedWork(false);
          setIsRecoveringFromWorkCreation(false);

          // Se ainda não temos usuário, forçar reload
          if (!user) {
            console.log(
              "🔄 Forçando reload após cleanup - nenhum usuário encontrado",
            );
            window.location.reload();
          }
        } catch (error) {
          console.warn("Erro ao limpar flags:", error);
        }
      }, 10000); // Reduzido para 10 segundos

      return () => clearTimeout(cleanupTimer);
    }, [user]);

    return (
      <div className="min-h-screen bg-gradient-to-br from-leirisonda-blue-light to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-leirisonda-primary mx-auto mb-4"></div>
          <p className="text-leirisonda-text-muted">
            Obra guardada com sucesso!
          </p>
          <p className="text-xs text-gray-400 mt-2">A recuperar sessão...</p>
        </div>
      </div>
    );
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

  // State for tracking recovery attempts
  const [recoveryAttempts, setRecoveryAttempts] = React.useState(0);
  const [isRecovering, setIsRecovering] = React.useState(false);

  // Effect for user recovery logic
  React.useEffect(() => {
    if (!user && !isRecovering && recoveryAttempts < 3) {
      try {
        const storedUser = localStorage.getItem("leirisonda_user");
        const sessionUser = sessionStorage.getItem("temp_user_session");
        const justCreated = sessionStorage.getItem("just_created_work");

        // Se há qualquer indicação de sessão v��lida
        if (storedUser || sessionUser || justCreated === "true") {
          console.log(
            "🔄 Sessão detectada, tentativa de recuperação:",
            recoveryAttempts + 1,
          );

          setIsRecovering(true);
          setRecoveryAttempts((prev) => prev + 1);

          // Dar tempo ao AuthProvider para carregar
          setTimeout(() => {
            if (!authData.user) {
              if (recoveryAttempts >= 2) {
                console.log(
                  "🔄 Forçando recarregamento após múltiplas tentativas",
                );
                window.location.reload();
              } else {
                setIsRecovering(false);
              }
            } else {
              setIsRecovering(false);
            }
          }, 2000);
        }
      } catch (error) {
        console.error("Erro na tentativa de recuperação:", error);
        setIsRecovering(false);
      }
    }
  }, [user, isRecovering, recoveryAttempts, authData.user]);

  if (!user) {
    // Se está tentando recuperar ou há indicação de sessão válida
    try {
      const storedUser = localStorage.getItem("leirisonda_user");
      const sessionUser = sessionStorage.getItem("temp_user_session");
      const justCreated = sessionStorage.getItem("just_created_work");

      if (isRecovering || storedUser || sessionUser || justCreated === "true") {
        // Mostrar loading com feedback informativo
        return (
          <div className="min-h-screen bg-gradient-to-br from-leirisonda-blue-light to-white flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-leirisonda-primary mx-auto mb-4"></div>
              <p className="text-leirisonda-text-muted">
                A recuperar sessão...
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {recoveryAttempts === 0
                  ? "A carregar dados do utilizador..."
                  : recoveryAttempts === 1
                    ? "A sincronizar com o servidor..."
                    : "Se demorar muito, será redirecionado automaticamente..."}
              </p>
              {recoveryAttempts >= 2 && (
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Recarregar Agora
                </button>
              )}
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error("Erro ao verificar estado de sessão:", error);
    }

    console.log(
      "🔒 Nenhuma sessão válida encontrada, redirecionando para login",
    );
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
