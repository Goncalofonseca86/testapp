import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { useAuth } from "@/components/AuthProvider";
import { firebaseService } from "@/services/FirebaseService";
import {
  ArrowLeft,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  Cloud,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";

export default function SyncDiagnostic() {
  const { user } = useAuth();
  const {
    works,
    maintenances,
    users,
    isOnline,
    isSyncing,
    lastSync,
    isFirebaseAvailable,
    syncData,
  } = useFirebaseSync();

  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Função para coletar dados de diagnóstico completos
  const collectDiagnosticData = async () => {
    try {
      console.log("🔍 Coletando dados de diagnóstico...");

      // 1. Status Firebase
      const firebaseStatus = firebaseService.getFirebaseStatus();

      // 2. Dados locais
      const localWorks = JSON.parse(localStorage.getItem("works") || "[]");
      const localMaintenances = JSON.parse(
        localStorage.getItem("pool_maintenances") || "[]",
      );
      const localUsers = JSON.parse(localStorage.getItem("users") || "[]");

      // 3. Backups
      const backupWorks = JSON.parse(
        localStorage.getItem("leirisonda_works") || "[]",
      );
      const sessionWorks = JSON.parse(
        sessionStorage.getItem("temp_works") || "[]",
      );

      // 4. Obras de emergência
      const emergencyWorks = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("emergency_work_")) {
          try {
            const emergencyWork = JSON.parse(localStorage.getItem(key) || "");
            emergencyWorks.push(emergencyWork);
          } catch (error) {
            console.error("Erro ao recuperar obra de emergência:", key);
          }
        }
      }

      // 5. Metadados de sincronização
      const worksMetadata = JSON.parse(
        localStorage.getItem("works_metadata") || "{}",
      );
      const lastUpdateData = JSON.parse(
        localStorage.getItem("leirisonda_last_update") || "{}",
      );

      // 6. Informações do dispositivo
      const deviceInfo = {
        userAgent: navigator.userAgent,
        onLine: navigator.onLine,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        storage: {
          localStorage: typeof localStorage !== "undefined",
          sessionStorage: typeof sessionStorage !== "undefined",
        },
      };

      // 7. Análise de atribuições
      const worksWithAssignments = works.filter(
        (w) => w.assignedUsers && w.assignedUsers.length > 0,
      );
      const alexandreWorks = works.filter(
        (w) => w.assignedUsers && w.assignedUsers.includes("user_alexandre"),
      );
      const goncaloWorks = works.filter(
        (w) => w.assignedUsers && w.assignedUsers.includes("admin_goncalo"),
      );

      const diagnostic = {
        timestamp: new Date().toISOString(),
        firebaseStatus,
        counts: {
          works: works.length,
          maintenances: maintenances.length,
          users: users.length,
          worksWithAssignments: worksWithAssignments.length,
          alexandreWorks: alexandreWorks.length,
          goncaloWorks: goncaloWorks.length,
        },
        storage: {
          localWorks: localWorks.length,
          backupWorks: backupWorks.length,
          sessionWorks: sessionWorks.length,
          emergencyWorks: emergencyWorks.length,
          localMaintenances: localMaintenances.length,
          localUsers: localUsers.length,
        },
        sync: {
          isOnline,
          isSyncing,
          isFirebaseAvailable,
          lastSync: lastSync?.toISOString(),
          worksMetadata,
          lastUpdateData,
        },
        deviceInfo,
        assignments: {
          total: worksWithAssignments,
          alexandre: alexandreWorks,
          goncalo: goncaloWorks,
        },
      };

      setDiagnosticData(diagnostic);
      console.log("✅ Diagnóstico coletado:", diagnostic);
    } catch (error) {
      console.error("❌ Erro ao coletar diagnóstico:", error);
      setDiagnosticData({ error: error.message });
    }
  };

  // Testes de conectividade e sincronização
  const runConnectivityTests = async () => {
    setIsRunningTests(true);
    const results: any = {};

    try {
      // Test 1: Conectividade básica
      results.internetConnection = {
        status: navigator.onLine ? "✅ Online" : "❌ Offline",
        success: navigator.onLine,
      };

      // Test 2: Firebase disponibilidade
      results.firebaseAvailability = {
        status: isFirebaseAvailable ? "✅ Disponível" : "❌ Indisponível",
        success: isFirebaseAvailable,
      };

      // Test 3: localStorage funcionando
      try {
        const testKey = "sync_test_" + Date.now();
        localStorage.setItem(testKey, "test");
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        results.localStorage = {
          status: retrieved === "test" ? "✅ Funcionando" : "❌ Falhou",
          success: retrieved === "test",
        };
      } catch (error) {
        results.localStorage = {
          status: "❌ Erro: " + error.message,
          success: false,
        };
      }

      // Test 4: Sync manual
      try {
        await syncData();
        results.manualSync = {
          status: "✅ Sucesso",
          success: true,
        };
      } catch (error) {
        results.manualSync = {
          status: "❌ Erro: " + error.message,
          success: false,
        };
      }

      // Test 5: Criação de dados Firebase
      if (isFirebaseAvailable) {
        try {
          // Verificar se consegue ler dados do Firebase
          const firebaseWorks = await firebaseService.getWorks();
          results.firebaseRead = {
            status: `✅ Leu ${firebaseWorks.length} obras`,
            success: true,
          };
        } catch (error) {
          results.firebaseRead = {
            status: "❌ Erro: " + error.message,
            success: false,
          };
        }
      }

      setTestResults(results);
    } catch (error) {
      console.error("❌ Erro nos testes:", error);
      results.error = error.message;
      setTestResults(results);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Força sincronização total
  const forceTotalSync = async () => {
    try {
      console.log("🔄 Forçando sincronização total...");

      // Limpar caches
      if (isFirebaseAvailable) {
        await firebaseService.syncLocalDataToFirebase();
        await syncData();
      }

      // Recarregar diagnóstico
      await collectDiagnosticData();

      console.log("✅ Sincronização total concluída");
    } catch (error) {
      console.error("❌ Erro na sincronização total:", error);
    }
  };

  // Coletar dados ao carregar a página
  useEffect(() => {
    collectDiagnosticData();
    runConnectivityTests();
  }, []);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      collectDiagnosticData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Acesso negado. Faça login primeiro.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Diagnóstico de Sincronização</h1>
            <p className="text-gray-600">
              Análise completa do sistema de sincronização
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={collectDiagnosticData} disabled={isSyncing}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button
            onClick={forceTotalSync}
            disabled={isSyncing || !isFirebaseAvailable}
            variant="secondary"
          >
            <Cloud className="w-4 h-4 mr-2" />
            Sync Total
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Conectividade</p>
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {isFirebaseAvailable ? (
                <Database className="w-5 h-5 text-blue-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Firebase</p>
                <Badge
                  variant={isFirebaseAvailable ? "default" : "destructive"}
                >
                  {isFirebaseAvailable ? "Disponível" : "Indisponível"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {isSyncing ? (
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
              ) : (
                <Activity className="w-5 h-5 text-green-500" />
              )}
              <div>
                <p className="font-medium">Sincronização</p>
                <Badge variant={isSyncing ? "secondary" : "default"}>
                  {isSyncing ? "Em progresso" : "Inativa"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="font-medium">Última Sync</p>
              <p className="text-sm text-gray-600">
                {lastSync ? lastSync.toLocaleString() : "Nunca"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teste de Conectividade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Testes de Conectividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={runConnectivityTests}
              disabled={isRunningTests}
              className="mb-4"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRunningTests ? "animate-spin" : ""}`}
              />
              Executar Testes
            </Button>

            {Object.keys(testResults).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(testResults).map(
                  ([test, result]: [string, any]) => (
                    <div key={test} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{test}</span>
                        {result.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {result.status}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contadores de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Contadores de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          {diagnosticData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {diagnosticData.counts.works}
                </div>
                <div className="text-sm text-gray-600">Obras Total</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-green-600">
                  {diagnosticData.counts.worksWithAssignments}
                </div>
                <div className="text-sm text-gray-600">Com Atribuições</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {diagnosticData.counts.alexandreWorks}
                </div>
                <div className="text-sm text-gray-600">Alexandre</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-red-600">
                  {diagnosticData.counts.goncaloWorks}
                </div>
                <div className="text-sm text-gray-600">Gonçalo</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Armazenamento</CardTitle>
        </CardHeader>
        <CardContent>
          {diagnosticData && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <div className="font-medium">localStorage</div>
                <div className="text-sm text-gray-600">
                  {diagnosticData.storage.localWorks} obras
                </div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Backup</div>
                <div className="text-sm text-gray-600">
                  {diagnosticData.storage.backupWorks} obras
                </div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Session</div>
                <div className="text-sm text-gray-600">
                  {diagnosticData.storage.sessionWorks} obras
                </div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Emergência</div>
                <div className="text-sm text-gray-600">
                  {diagnosticData.storage.emergencyWorks} obras
                </div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Manutenções</div>
                <div className="text-sm text-gray-600">
                  {diagnosticData.storage.localMaintenances} itens
                </div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">Utilizadores</div>
                <div className="text-sm text-gray-600">
                  {diagnosticData.storage.localUsers} itens
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Obras com Atribuições */}
      {diagnosticData && diagnosticData.assignments.total.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Obras com Atribuições Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diagnosticData.assignments.total
                .slice(0, 10)
                .map((work: any) => (
                  <div key={work.id} className="p-3 border rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{work.clientName}</div>
                        <div className="text-sm text-gray-600">
                          Folha: {work.workSheetNumber} | Criada:{" "}
                          {new Date(work.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm">
                          Atribuída a:{" "}
                          {work.assignedUsers?.join(", ") || "Nenhum"}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {work.assignedUsers?.length || 0} atribuições
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Data (para debug) */}
      {diagnosticData && (
        <Card>
          <CardHeader>
            <CardTitle>Dados Brutos (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(diagnosticData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
