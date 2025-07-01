import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { firebaseService } from "@/services/FirebaseService";
import { DefaultDataService } from "@/services/DefaultData";
import { User } from "@shared/types";
import {
  ArrowLeft,
  RefreshCw,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Link } from "react-router-dom";

export function UserSyncDiagnostic() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [firebaseUsers, setFirebaseUsers] = useState<User[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    runDiagnostic();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const runDiagnostic = async () => {
    setIsLoading(true);
    console.log("🔍 Iniciando diagnóstico de sincronização de utilizadores...");

    try {
      // 1. Verificar utilizadores locais
      const local = JSON.parse(localStorage.getItem("users") || "[]");
      setLocalUsers(local);

      // 2. Verificar utilizadores no Firebase (se disponível)
      let firebase: User[] = [];
      if (isOnline && firebaseService.getFirebaseStatus().isAvailable) {
        try {
          firebase = await firebaseService.getUsers();
          setFirebaseUsers(firebase);
        } catch (error) {
          console.log("❌ Erro ao buscar utilizadores do Firebase:", error);
        }
      }

      // 3. Verificar utilizadores globais obrigatórios
      const requiredGlobalUsers = [
        {
          email: "gongonsilva@gmail.com",
          name: "Gonçalo Fonseca",
          password: "19867gsf",
        },
        {
          email: "alexkamaryta@gmail.com",
          name: "Alexandre Fernandes",
          password: "69alexandre",
        },
      ];

      const results = {
        timestamp: new Date().toISOString(),
        online: isOnline,
        firebaseAvailable: firebaseService.getFirebaseStatus().isAvailable,
        localUsersCount: local.length,
        firebaseUsersCount: firebase.length,
        globalUsersStatus: requiredGlobalUsers.map((required) => {
          const localUser = local.find((u: User) => u.email === required.email);
          const firebaseUser = firebase.find(
            (u: User) => u.email === required.email,
          );

          // Verificar passwords
          const passwordKeys = [
            `password_${localUser?.id}`,
            `password_${required.email}`,
            `password_${required.email.toLowerCase()}`,
          ];

          const hasPassword = passwordKeys.some(
            (key) => localStorage.getItem(key) === required.password,
          );

          return {
            email: required.email,
            name: required.name,
            requiredPassword: required.password,
            existsLocally: !!localUser,
            existsInFirebase: !!firebaseUser,
            hasCorrectPassword: hasPassword,
            localUserId: localUser?.id,
            firebaseUserId: firebaseUser?.id,
            synced:
              !!localUser && !!firebaseUser && localUser.id === firebaseUser.id,
          };
        }),
        recommendations: [],
      };

      // 4. Gerar recomendações
      for (const globalStatus of results.globalUsersStatus) {
        if (!globalStatus.existsLocally) {
          results.recommendations.push({
            type: "error",
            message: `❌ Utilizador ${globalStatus.name} não existe localmente`,
            action: "Executar sincronização global",
          });
        }

        if (!globalStatus.hasCorrectPassword) {
          results.recommendations.push({
            type: "warning",
            message: `⚠️ Password incorreta para ${globalStatus.name}`,
            action: "Restaurar password correta",
          });
        }

        if (
          isOnline &&
          results.firebaseAvailable &&
          !globalStatus.existsInFirebase
        ) {
          results.recommendations.push({
            type: "info",
            message: `ℹ️ Utilizador ${globalStatus.name} não existe no Firebase`,
            action: "Pode ser normal para utilizadores predefinidos",
          });
        }
      }

      if (results.recommendations.length === 0) {
        results.recommendations.push({
          type: "success",
          message:
            "✅ Todos os utilizadores globais estão sincronizados corretamente",
          action: "Nenhuma ação necessária",
        });
      }

      setDiagnosticResults(results);
      console.log("🔍 Diagnóstico completado:", results);
    } catch (error) {
      console.error("❌ Erro durante diagnóstico:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fixGlobalUsers = async () => {
    setIsLoading(true);
    console.log("🔧 Corrigindo utilizadores globais...");

    try {
      // Força criação/correção dos utilizadores globais
      DefaultDataService.forceCleanUserSystem();

      // Se online, tenta sincronizar do Firebase
      if (isOnline && firebaseService.getFirebaseStatus().isAvailable) {
        await firebaseService.syncGlobalUsersFromFirebase();
      }

      // Re-executa diagnóstico
      await runDiagnostic();

      console.log("✅ Utilizadores globais corrigidos");
      alert("✅ Utilizadores globais corrigidos com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao corrigir utilizadores:", error);
      alert("❌ Erro ao corrigir utilizadores: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncFromFirebase = async () => {
    if (!isOnline || !firebaseService.getFirebaseStatus().isAvailable) {
      alert("❌ Firebase não disponível ou offline");
      return;
    }

    setIsLoading(true);
    console.log("🔄 Sincronizando utilizadores do Firebase...");

    try {
      await firebaseService.syncGlobalUsersFromFirebase();
      await runDiagnostic();

      console.log("✅ Sincronização do Firebase completada");
      alert("✅ Utilizadores sincronizados do Firebase!");
    } catch (error) {
      console.error("❌ Erro na sincronização:", error);
      alert("❌ Erro na sincronização: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.email !== "gongonsilva@gmail.com") {
    return (
      <div className="leirisonda-main">
        <div className="max-w-md mx-auto mt-20 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 mb-4">
            Esta página é exclusiva para o administrador principal.
          </p>
          <Link
            to="/dashboard"
            className="btn-leirisonda inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="leirisonda-main">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-content">
            <Link
              to="/dashboard"
              className="btn-leirisonda bg-gray-500 hover:bg-gray-600 inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Voltar
            </Link>
            <div>
              <h1 className="page-title">
                <Users className="h-8 w-8 text-blue-600" />
                Diagnóstico de Sincronização
              </h1>
              <p className="page-subtitle">
                Diagnosticar problemas de sincronização de utilizadores entre
                dispositivos
              </p>
            </div>
          </div>
          <div className="page-header-actions">
            <button
              onClick={runDiagnostic}
              disabled={isLoading}
              className="btn-leirisonda-secondary inline-flex items-center gap-2"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
              {isLoading ? "A diagnosticar..." : "Executar Diagnóstico"}
            </button>
          </div>
        </div>

        {/* Status de Conectividade */}
        <div className="card-leirisonda mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                <span className={isOnline ? "text-green-600" : "text-red-600"}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {firebaseService.getFirebaseStatus().isAvailable ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span>
                  Firebase: {firebaseService.getFirebaseStatus().message}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados do Diagnóstico */}
        {diagnosticResults && (
          <div className="space-y-6">
            {/* Resumo */}
            <div className="card-leirisonda">
              <h3 className="text-lg font-semibold mb-4">
                Resumo do Diagnóstico
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card-leirisonda stat-card-primary">
                  <div className="text-2xl font-bold text-blue-600">
                    {diagnosticResults.localUsersCount}
                  </div>
                  <div className="text-sm text-gray-600">
                    Utilizadores Locais
                  </div>
                </div>
                <div className="stat-card-leirisonda stat-card-secondary">
                  <div className="text-2xl font-bold text-teal-600">
                    {diagnosticResults.firebaseUsersCount}
                  </div>
                  <div className="text-sm text-gray-600">
                    Utilizadores Firebase
                  </div>
                </div>
                <div className="stat-card-leirisonda stat-card-success">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      diagnosticResults.globalUsersStatus.filter(
                        (u: any) => u.existsLocally,
                      ).length
                    }
                    /2
                  </div>
                  <div className="text-sm text-gray-600">
                    Utilizadores Globais
                  </div>
                </div>
              </div>
            </div>

            {/* Status de Utilizadores Globais */}
            <div className="card-leirisonda">
              <h3 className="text-lg font-semibold mb-4">
                Status dos Utilizadores Globais
              </h3>
              <div className="space-y-3">
                {diagnosticResults.globalUsersStatus.map((userStatus: any) => (
                  <div
                    key={userStatus.email}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{userStatus.name}</div>
                        <div className="text-sm text-gray-600">
                          {userStatus.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {userStatus.existsLocally ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="text-sm">
                          {userStatus.existsLocally
                            ? "Existe Localmente"
                            : "Não Existe Localmente"}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div
                        className={
                          userStatus.existsLocally
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        Local: {userStatus.existsLocally ? "✓" : "❌"}
                      </div>
                      <div
                        className={
                          userStatus.existsInFirebase
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        Firebase: {userStatus.existsInFirebase ? "✓" : "—"}
                      </div>
                      <div
                        className={
                          userStatus.hasCorrectPassword
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        Password: {userStatus.hasCorrectPassword ? "✓" : "❌"}
                      </div>
                      <div
                        className={
                          userStatus.synced
                            ? "text-green-600"
                            : "text-yellow-600"
                        }
                      >
                        Sync: {userStatus.synced ? "✓" : "⚠"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recomendações */}
            <div className="card-leirisonda">
              <h3 className="text-lg font-semibold mb-4">Recomendações</h3>
              <div className="space-y-3">
                {diagnosticResults.recommendations.map(
                  (rec: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        rec.type === "error"
                          ? "bg-red-50 border-red-200 text-red-800"
                          : rec.type === "warning"
                            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                            : rec.type === "success"
                              ? "bg-green-50 border-green-200 text-green-800"
                              : "bg-blue-50 border-blue-200 text-blue-800"
                      }`}
                    >
                      <div className="font-medium">{rec.message}</div>
                      <div className="text-sm mt-1">{rec.action}</div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Ações de Correção */}
            <div className="card-leirisonda">
              <h3 className="text-lg font-semibold mb-4">Ações de Correção</h3>
              <div className="space-y-3">
                <button
                  onClick={fixGlobalUsers}
                  disabled={isLoading}
                  className="w-full btn-leirisonda bg-red-600 hover:bg-red-700 justify-center"
                >
                  🔧 Corrigir Utilizadores Globais (Forçar Recriar)
                </button>

                {isOnline &&
                  firebaseService.getFirebaseStatus().isAvailable && (
                    <button
                      onClick={syncFromFirebase}
                      disabled={isLoading}
                      className="w-full btn-leirisonda-secondary justify-center"
                    >
                      ⬇️ Sincronizar do Firebase
                    </button>
                  )}

                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>ℹ️ Informação:</strong> Se o utilizador Alexandre não
                  aparecer noutros dispositivos, execute "Corrigir Utilizadores
                  Globais" e depois "Sincronizar do Firebase" se estiver online.
                  Isto garante que ambos os utilizadores (Gonçalo e Alexandre)
                  estão disponíveis em todos os dispositivos.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
