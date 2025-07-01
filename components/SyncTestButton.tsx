import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { useAuth } from "@/components/AuthProvider";
import { firebaseService } from "@/services/FirebaseService";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Database,
  Activity,
} from "lucide-react";

interface SyncTestResult {
  type: "success" | "warning" | "error";
  message: string;
  details?: any;
}

export function SyncTestButton() {
  const { user } = useAuth();
  const {
    works,
    maintenances,
    isOnline,
    isSyncing,
    isFirebaseAvailable,
    syncData,
  } = useFirebaseSync();

  const [isTestingSync, setIsTestingSync] = useState(false);
  const [testResults, setTestResults] = useState<SyncTestResult[]>([]);

  const runSyncTest = async () => {
    if (!user) return;

    setIsTestingSync(true);
    setTestResults([]);
    const results: SyncTestResult[] = [];

    try {
      // Test 1: Conectividade
      results.push({
        type: isOnline ? "success" : "error",
        message: `Conectividade: ${isOnline ? "Online" : "Offline"}`,
        details: { navigator_online: navigator.onLine },
      });

      // Test 2: Firebase disponibilidade
      results.push({
        type: isFirebaseAvailable ? "success" : "error",
        message: `Firebase: ${isFirebaseAvailable ? "Disponível" : "Indisponível"}`,
        details: firebaseService.getFirebaseStatus(),
      });

      // Test 3: Dados locais
      const localWorks = JSON.parse(localStorage.getItem("works") || "[]");
      const localMaintenances = JSON.parse(
        localStorage.getItem("pool_maintenances") || "[]",
      );

      results.push({
        type: localWorks.length > 0 ? "success" : "warning",
        message: `Dados Locais: ${localWorks.length} obras, ${localMaintenances.length} manutenções`,
        details: {
          localWorks: localWorks.length,
          localMaintenances: localMaintenances.length,
        },
      });

      // Test 4: Sync manual
      if (isFirebaseAvailable && isOnline) {
        try {
          await syncData();
          results.push({
            type: "success",
            message: "Sincronização manual: Sucesso",
            details: { timestamp: new Date().toISOString() },
          });
        } catch (error) {
          results.push({
            type: "error",
            message: `Sincronização manual: Erro - ${error.message}`,
            details: { error: error.message },
          });
        }
      } else {
        results.push({
          type: "warning",
          message:
            "Sincronização manual: Não disponível (offline ou Firebase indisponível)",
          details: { isOnline, isFirebaseAvailable },
        });
      }

      // Test 5: Verificar atribuições
      const worksWithAssignments = works.filter(
        (w) => w.assignedUsers && w.assignedUsers.length > 0,
      );
      const alexandreWorks = works.filter(
        (w) => w.assignedUsers && w.assignedUsers.includes("user_alexandre"),
      );

      results.push({
        type: worksWithAssignments.length > 0 ? "success" : "warning",
        message: `Atribuições: ${worksWithAssignments.length} obras atribuídas (${alexandreWorks.length} para Alexandre)`,
        details: {
          totalWithAssignments: worksWithAssignments.length,
          alexandreWorks: alexandreWorks.length,
          assignedWorks: worksWithAssignments.map((w) => ({
            id: w.id,
            client: w.clientName,
            assigned: w.assignedUsers,
          })),
        },
      });

      // Test 6: Consolidação de backups
      const consolidated = firebaseService.consolidateWorksFromAllBackups();
      results.push({
        type: consolidated.length === works.length ? "success" : "warning",
        message: `Backups: ${consolidated.length} obras consolidadas vs ${works.length} ativas`,
        details: { consolidated: consolidated.length, active: works.length },
      });
    } catch (error) {
      results.push({
        type: "error",
        message: `Erro no teste: ${error.message}`,
        details: { error: error.message },
      });
    } finally {
      setTestResults(results);
      setIsTestingSync(false);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Status rápido */}
      <div className="flex items-center gap-2 mb-4">
        <Badge
          variant={isOnline ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          {isOnline ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {isOnline ? "Online" : "Offline"}
        </Badge>
        <Badge
          variant={isFirebaseAvailable ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          <Database className="w-3 h-3" />
          Firebase {isFirebaseAvailable ? "OK" : "Erro"}
        </Badge>
        <Badge
          variant={isSyncing ? "secondary" : "outline"}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sincronizando..." : "Inativo"}
        </Badge>
      </div>

      {/* Botão de teste */}
      <Button
        onClick={runSyncTest}
        disabled={isTestingSync}
        className="w-full"
        size="sm"
      >
        <RefreshCw
          className={`w-4 h-4 mr-2 ${isTestingSync ? "animate-spin" : ""}`}
        />
        {isTestingSync ? "Testando Sincronização..." : "Testar Sincronização"}
      </Button>

      {/* Resultados dos testes */}
      {testResults.length > 0 && (
        <div className="space-y-2">
          {testResults.map((result, index) => (
            <Alert key={index}>
              <div className="flex items-start gap-2">
                {getResultIcon(result.type)}
                <div className="flex-1">
                  <AlertDescription className="text-sm">
                    <div className="flex items-center justify-between">
                      <span>{result.message}</span>
                      <Badge variant={getBadgeVariant(result.type)} size="sm">
                        {result.type}
                      </Badge>
                    </div>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                          Ver detalhes
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Resumo rápido */}
      <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
        <div className="flex justify-between">
          <span>Obras: {works.length}</span>
          <span>Manutenções: {maintenances.length}</span>
          <span>
            Atribuídas:{" "}
            {works.filter((w) => w.assignedUsers?.length > 0).length}
          </span>
        </div>
      </div>
    </div>
  );
}
