import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Database,
  User,
  Wifi,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { firebaseService } from "@/services/FirebaseService";
import { WorkSaveHelper } from "@/lib/work-save-diagnostics";

interface DiagnosticInfo {
  sessionStatus: "valid" | "invalid" | "partial";
  worksCount: {
    main: number;
    backup: number;
    emergency: number;
    consolidated: number;
  };
  firebaseStatus: "available" | "unavailable" | "unknown";
  networkStatus: "online" | "offline";
  lastOperation: string | null;
  potentialIssues: string[];
  recommendations: string[];
}

export function WorkCreationDiagnostics() {
  const { user } = useAuth();
  const { works, isOnline, isSyncing, isFirebaseAvailable } = useFirebaseSync();

  const [isVisible, setIsVisible] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);

  // Só mostrar para Gonçalo (admin)
  if (!user || user.email !== "gongonsilva@gmail.com") {
    return null;
  }

  useEffect(() => {
    if (isVisible) {
      runDiagnostic();
      const interval = setInterval(runDiagnostic, 10000); // A cada 10 segundos
      return () => clearInterval(interval);
    }
  }, [isVisible, user, works]);

  const runDiagnostic = async () => {
    try {
      setIsRunningDiagnostic(true);

      // 1. Verificar status da sessão
      const sessionStatus = checkSessionStatus();

      // 2. Contar obras em diferentes localizações
      const worksCount = countWorks();

      // 3. Verificar status do Firebase
      const firebaseStatus = isFirebaseAvailable ? "available" : "unavailable";

      // 4. Verificar conectividade
      const networkStatus = isOnline ? "online" : "offline";

      // 5. Última operação
      const lastOperation = localStorage.getItem("last_work_operation") || null;

      // 6. Executar diagnóstico avançado
      const saveHelper = WorkSaveHelper.diagnose();

      // 7. Identificar problemas potenciais
      const potentialIssues = [];
      const recommendations = [];

      if (sessionStatus !== "valid") {
        potentialIssues.push("Sessão de utilizador com problemas");
        recommendations.push("Fazer logout e login novamente");
      }

      if (worksCount.main !== worksCount.backup) {
        potentialIssues.push("Backups de obras desincronizados");
        recommendations.push("Executar consolidação de obras");
      }

      if (worksCount.emergency > 0) {
        potentialIssues.push(
          `${worksCount.emergency} obras em modo de emergência`,
        );
        recommendations.push("Recuperar obras de emergência");
      }

      if (firebaseStatus === "unavailable" && networkStatus === "online") {
        potentialIssues.push("Firebase indisponível apesar de estar online");
        recommendations.push("Verificar configuração do Firebase");
      }

      if (works.length === 0 && worksCount.consolidated > 0) {
        potentialIssues.push(
          "Obras existem localmente mas não aparecem na interface",
        );
        recommendations.push("Recarregar página ou forçar sincronização");
      }

      setDiagnostic({
        sessionStatus,
        worksCount,
        firebaseStatus: firebaseStatus as any,
        networkStatus: networkStatus as any,
        lastOperation,
        potentialIssues: [...potentialIssues, ...saveHelper.potentialIssues],
        recommendations: [...recommendations, ...saveHelper.recommendations],
      });
    } catch (error) {
      console.error("Erro no diagnóstico:", error);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const checkSessionStatus = (): "valid" | "invalid" | "partial" => {
    try {
      const mainUser = localStorage.getItem("leirisonda_user");
      const backupUser = sessionStorage.getItem("temp_user_session");
      const lastUser = localStorage.getItem("leirisonda_last_user");

      if (mainUser && backupUser && lastUser) return "valid";
      if (mainUser || backupUser) return "partial";
      return "invalid";
    } catch {
      return "invalid";
    }
  };

  const countWorks = () => {
    try {
      const main = JSON.parse(localStorage.getItem("works") || "[]").length;
      const backup = JSON.parse(
        localStorage.getItem("leirisonda_works") || "[]",
      ).length;

      let emergency = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("emergency_work_")) {
          emergency++;
        }
      }

      const consolidated =
        firebaseService.consolidateWorksFromAllBackups().length;

      return { main, backup, emergency, consolidated };
    } catch {
      return { main: 0, backup: 0, emergency: 0, consolidated: 0 };
    }
  };

  const handleEmergencyRecovery = async () => {
    try {
      console.log("🚨 Executando recuperação de emergência...");

      // 1. Consolidar obras de emergência
      const consolidation = WorkSaveHelper.consolidateEmergencyWorks();

      // 2. Sincronizar backups
      const sync = WorkSaveHelper.syncBackups();

      // 3. Forçar reload dos dados
      window.location.reload();

      alert(
        `Recuperação executada:\n• ${consolidation.consolidated} obras recuperadas\n• ${sync.backupsUpdated} backups sincronizados`,
      );
    } catch (error) {
      alert(`Erro na recuperação: ${error}`);
    }
  };

  const handleSessionRecovery = () => {
    try {
      // Tentar recuperar sessão do backup
      const lastUser = localStorage.getItem("leirisonda_last_user");
      if (lastUser === "gongonsilva@gmail.com") {
        const goncaloUser = {
          id: "admin_goncalo",
          email: "gongonsilva@gmail.com",
          name: "Gonçalo Fonseca",
          role: "admin" as const,
          permissions: {
            canViewWorks: true,
            canCreateWorks: true,
            canEditWorks: true,
            canDeleteWorks: true,
            canViewMaintenance: true,
            canCreateMaintenance: true,
            canEditMaintenance: true,
            canDeleteMaintenance: true,
            canViewUsers: true,
            canCreateUsers: true,
            canEditUsers: true,
            canDeleteUsers: true,
            canViewReports: true,
            canExportData: true,
            canViewDashboard: true,
            canViewStats: true,
          },
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem("leirisonda_user", JSON.stringify(goncaloUser));
        sessionStorage.setItem(
          "temp_user_session",
          JSON.stringify(goncaloUser),
        );

        alert("Sessão de Gonçalo recuperada! Recarregando página...");
        window.location.reload();
      }
    } catch (error) {
      alert(`Erro na recuperação de sessão: ${error}`);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Diagnóstico
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Diagnóstico de Obras
        </h3>
        <Button
          onClick={() => setIsVisible(false)}
          size="sm"
          variant="ghost"
          className="p-1 h-6 w-6"
        >
          <EyeOff className="w-4 h-4" />
        </Button>
      </div>

      {diagnostic && (
        <div className="space-y-3">
          {/* Status Geral */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <Badge
                variant={
                  diagnostic.sessionStatus === "valid"
                    ? "default"
                    : "destructive"
                }
              >
                {diagnostic.sessionStatus}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              <Badge
                variant={
                  diagnostic.networkStatus === "online"
                    ? "default"
                    : "destructive"
                }
              >
                {diagnostic.networkStatus}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              <Badge
                variant={
                  diagnostic.firebaseStatus === "available"
                    ? "default"
                    : "secondary"
                }
              >
                Firebase {diagnostic.firebaseStatus}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span className="text-gray-600">
                {diagnostic.worksCount.consolidated} obras
              </span>
            </div>
          </div>

          {/* Contadores de Obras */}
          <div className="bg-gray-50 p-2 rounded text-xs">
            <div className="grid grid-cols-2 gap-1">
              <div>Principal: {diagnostic.worksCount.main}</div>
              <div>Backup: {diagnostic.worksCount.backup}</div>
              <div>Emergência: {diagnostic.worksCount.emergency}</div>
              <div>Total: {diagnostic.worksCount.consolidated}</div>
            </div>
          </div>

          {/* Problemas Identificados */}
          {diagnostic.potentialIssues.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-red-700 mb-1">
                Problemas:
              </h4>
              <ul className="text-xs text-red-600 space-y-1">
                {diagnostic.potentialIssues.slice(0, 3).map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recomendações */}
          {diagnostic.recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-blue-700 mb-1">
                Recomendações:
              </h4>
              <ul className="text-xs text-blue-600 space-y-1">
                {diagnostic.recommendations.slice(0, 2).map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Ações de Recuperação */}
          <div className="space-y-2 pt-2 border-t">
            <Button
              onClick={runDiagnostic}
              size="sm"
              variant="outline"
              className="w-full"
              disabled={isRunningDiagnostic}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRunningDiagnostic ? "animate-spin" : ""}`}
              />
              Executar Diagnóstico
            </Button>

            {diagnostic.worksCount.emergency > 0 && (
              <Button
                onClick={handleEmergencyRecovery}
                size="sm"
                className="w-full"
                variant="destructive"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Recuperar Obras ({diagnostic.worksCount.emergency})
              </Button>
            )}

            {diagnostic.sessionStatus !== "valid" && (
              <Button
                onClick={handleSessionRecovery}
                size="sm"
                className="w-full"
                variant="secondary"
              >
                <User className="w-4 h-4 mr-2" />
                Recuperar Sessão
              </Button>
            )}
          </div>

          {diagnostic.lastOperation && (
            <div className="text-xs text-gray-500 pt-2 border-t">
              Última op: {diagnostic.lastOperation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
