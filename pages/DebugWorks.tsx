import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  AlertTriangle,
  CheckCircle,
  Eye,
  Plus,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  Trash2,
  Activity,
} from "lucide-react";
import { Work, User } from "@shared/types";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { firebaseService } from "@/services/FirebaseService";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export function DebugWorks() {
  const navigate = useNavigate();
  const { user, getAllUsers } = useAuth();
  const { works, createWork, updateWork, isOnline, isSyncing, syncData } =
    useFirebaseSync();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [isTestingSync, setIsTestingSync] = useState(false);

  // Restringir acesso apenas ao Gonçalo
  if (!user || user.email !== "gongonsilva@gmail.com") {
    return (
      <div className="p-6 max-w-md mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-red-600 mb-4">
            Esta página é restrita ao administrador principal.
          </p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadDebugInfo();
  }, [works]);

  const loadDebugInfo = () => {
    try {
      const allUsers = getAllUsers();

      // Dados de obras de diferentes fontes
      const worksMain = JSON.parse(localStorage.getItem("works") || "[]");
      const worksLeirisonda = JSON.parse(
        localStorage.getItem("leirisonda_works") || "[]",
      );
      const worksTemp = JSON.parse(
        sessionStorage.getItem("temp_works") || "[]",
      );

      // Contar obras de emergência
      let emergencyWorks = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("emergency_work_")) emergencyWorks++;
      }

      // Obras consolidadas
      const consolidatedWorks =
        firebaseService.consolidateWorksFromAllBackups();

      // Análise de atribuiç��es
      const worksWithAssignments = works.filter(
        (work) => work.assignedUsers && work.assignedUsers.length > 0,
      );

      const assignmentsByUser = allUsers.map((user) => {
        const assignedWorks = works.filter(
          (work) => work.assignedUsers && work.assignedUsers.includes(user.id),
        );
        return {
          user,
          assignedCount: assignedWorks.length,
          works: assignedWorks,
        };
      });

      // Verificar obras órfãs (com IDs de usuários que não existem)
      const orphanedWorks = works.filter((work) => {
        if (!work.assignedUsers || work.assignedUsers.length === 0)
          return false;
        return work.assignedUsers.some(
          (userId) => !allUsers.find((u) => u.id === userId),
        );
      });

      setDebugInfo({
        allUsers,
        storage: {
          worksMain: worksMain.length,
          worksLeirisonda: worksLeirisonda.length,
          worksTemp: worksTemp.length,
          emergencyWorks,
          consolidatedWorks: consolidatedWorks.length,
          syncedWorks: works.length,
        },
        assignments: {
          totalWorksWithAssignments: worksWithAssignments.length,
          assignmentsByUser,
          orphanedWorks,
        },
        firebase: firebaseService.getFirebaseStatus(),
      });
    } catch (error) {
      console.error("Erro ao carregar debug info:", error);
    }
  };

  const createTestWork = async () => {
    setIsCreatingTest(true);
    try {
      const testWorkData = {
        workSheetNumber: `TEST-${Date.now()}`,
        type: "piscina" as const,
        clientName: `Teste Cliente ${new Date().toLocaleTimeString()}`,
        address: "Morada de Teste, Leiria",
        contact: "244 123 456",
        entryTime: new Date().toISOString(),
        status: "pendente" as const,
        vehicles: ["Viatura Teste"],
        technicians: ["Técnico Teste"],
        assignedUsers: ["user_alexandre"], // Atribuir ao Alexandre
        photos: [],
        observations: "Obra criada para teste de atribuição",
        workPerformed: "Teste de funcionamento do sistema",
        workSheetCompleted: false,
      };

      console.log("🧪 Criando obra teste com atribuição ao Alexandre...");
      const workId = await createWork(testWorkData);
      console.log("✅ Obra teste criada:", workId);

      // Aguardar um pouco e recarregar debug info
      setTimeout(() => {
        loadDebugInfo();
        setIsCreatingTest(false);
      }, 2000);
    } catch (error) {
      console.error("❌ Erro ao criar obra teste:", error);
      setIsCreatingTest(false);
    }
  };

  const forceSync = async () => {
    console.log("🔄 Forçando sincronização completa...");
    await syncData();
    setTimeout(() => {
      loadDebugInfo();
    }, 1000);
  };

  const cleanupEmergencyWorks = () => {
    console.log("🧹 Limpando obras de emergência...");
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("emergency_work_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log(`✅ ${keysToRemove.length} obras de emergência removidas`);
    loadDebugInfo();
  };

  const testSyncBetweenDevices = async () => {
    setIsTestingSync(true);
    try {
      console.log("🧪 TESTANDO SINCRONIZAÇÃO ENTRE DISPOSITIVOS...");

      // 1. Criar obra teste com timestamp único
      const timestamp = new Date().toISOString();
      const testWorkData = {
        workSheetNumber: `SYNC-TEST-${Date.now()}`,
        type: "piscina" as const,
        clientName: `🧪 TESTE SYNC - ${timestamp}`,
        address: "Endereço para teste de sincronização",
        contact: "123456789",
        entryTime: new Date().toISOString(),
        status: "pendente" as const,
        vehicles: ["Viatura Teste Sync"],
        technicians: ["Técnico Teste Sync"],
        assignedUsers: ["user_alexandre"], // Atribuir ao Alexandre para teste
        photos: [],
        observations: `Obra criada para testar sincronização entre dispositivos em ${timestamp}`,
        workPerformed: "Teste de propagação de dados entre dispositivos",
        workSheetCompleted: false,
      };

      console.log("📤 Criando obra teste para sincronização...");
      const workId = await createWork(testWorkData);
      console.log(`✅ Obra teste criada: ${workId}`);

      // 2. Aguardar um momento para propagação
      console.log("⏱️ Aguardando 3 segundos para propagação...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. Forçar sync múltiplo para garantir propagação
      console.log("🔄 Forçando múltiplos syncs para garantir propagação...");
      await syncData();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await syncData();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await syncData();

      // 4. Verificar se obra aparece em diferentes storages
      const worksMain = JSON.parse(localStorage.getItem("works") || "[]");
      const worksLeirisonda = JSON.parse(
        localStorage.getItem("leirisonda_works") || "[]",
      );
      const worksTemp = JSON.parse(
        sessionStorage.getItem("temp_works") || "[]",
      );

      const foundInMain = worksMain.find((w: any) => w.id === workId);
      const foundInLeirisonda = worksLeirisonda.find(
        (w: any) => w.id === workId,
      );
      const foundInTemp = worksTemp.find((w: any) => w.id === workId);

      console.log("🔍 RESULTADO DO TESTE DE SINCRONIZAÇÃO:", {
        workId,
        timestamp,
        foundInMain: !!foundInMain,
        foundInLeirisonda: !!foundInLeirisonda,
        foundInTemp: !!foundInTemp,
        assignedToAlexandre:
          foundInMain?.assignedUsers?.includes("user_alexandre") || false,
      });

      // 5. Instruções para o utilizador
      alert(`
🧪 TESTE DE SINCRONIZAÇÃO COMPLETO

Obra criada: ${testWorkData.clientName}
ID: ${workId}
Atribuída ao Alexandre: ${foundInMain?.assignedUsers?.includes("user_alexandre") ? "Sim" : "Não"}

AGORA TESTE NO OUTRO DISPOSITIVO:
1. Abra a aplicação no dispositivo do Alexandre
2. Vá ao Dashboard
3. Procure pela obra: "${testWorkData.clientName}"
4. Verifique se aparece na seção "Suas Obras Atribuídas"

Se NÃO aparecer, há problema de sincronização Firebase!
      `);

      loadDebugInfo();
    } catch (error) {
      console.error("�� Erro no teste de sincronização:", error);
      alert(`Erro no teste: ${error}`);
    } finally {
      setIsTestingSync(false);
    }
  };

  const addAlexandreToWork = async (workId: string) => {
    try {
      const work = works.find((w) => w.id === workId);
      if (!work) return;

      const updatedAssignedUsers = work.assignedUsers || [];
      if (!updatedAssignedUsers.includes("user_alexandre")) {
        updatedAssignedUsers.push("user_alexandre");

        console.log(
          `🎯 Atribuindo obra ${work.workSheetNumber} ao Alexandre...`,
        );
        await updateWork(workId, { assignedUsers: updatedAssignedUsers });

        setTimeout(() => {
          loadDebugInfo();
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Erro ao atribuir obra:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Debug: Obras e Atribuições
            </h1>
            <p className="text-gray-600">
              Diagnosticar problemas de sincronização e atribuição
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Online</span>
              {isSyncing && (
                <span className="text-xs text-gray-500">Sync...</span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-600">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Button
          onClick={createTestWork}
          disabled={isCreatingTest}
          className="h-auto py-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isCreatingTest ? "Criando..." : "Criar Obra Teste"}
        </Button>

        <Button
          onClick={testSyncBetweenDevices}
          disabled={isTestingSync}
          className="h-auto py-4 bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {isTestingSync ? "Testando..." : "Testar Sync Dispositivos"}
        </Button>

        <Button onClick={forceSync} variant="outline" className="h-auto py-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Forçar Sync
        </Button>

        <Button
          onClick={cleanupEmergencyWorks}
          variant="outline"
          className="h-auto py-4"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar Emergency
        </Button>

        <Button
          onClick={loadDebugInfo}
          variant="outline"
          className="h-auto py-4"
        >
          <Eye className="w-4 h-4 mr-2" />
          Recarregar Info
        </Button>

        <Button
          onClick={() => navigate("/sync-monitor")}
          variant="outline"
          className="h-auto py-4 bg-green-600 hover:bg-green-700 text-white"
        >
          <Activity className="w-4 h-4 mr-2" />
          Monitor Tempo Real
        </Button>
      </div>

      {/* Teste Completo de Sincronização */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">
          🧪 Teste Completo de Sincronização
        </h3>
        <p className="text-purple-700 mb-4">
          Este teste cria uma obra, verifica se é salva corretamente em todas as
          fontes e confirma se aparecerá no dispositivo do Alexandre.
        </p>
      </div>

      {/* Informações de Armazenamento */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Armazenamento de Dados</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-900">Works Main</div>
            <div className="text-2xl font-bold text-blue-600">
              {debugInfo.storage?.worksMain || 0}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-900">Leirisonda Works</div>
            <div className="text-2xl font-bold text-green-600">
              {debugInfo.storage?.worksLeirisonda || 0}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-900">Temp Works</div>
            <div className="text-2xl font-bold text-orange-600">
              {debugInfo.storage?.worksTemp || 0}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-900">Emergency</div>
            <div className="text-2xl font-bold text-red-600">
              {debugInfo.storage?.emergencyWorks || 0}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded">
          <div className="flex justify-between">
            <span className="font-medium">Consolidadas:</span>
            <span className="font-bold text-blue-700">
              {debugInfo.storage?.consolidatedWorks || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Sincronizadas:</span>
            <span className="font-bold text-blue-700">
              {debugInfo.storage?.syncedWorks || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Informações de Atribuição */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Users className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Atribuições de Obras</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 p-3 rounded">
            <div className="font-medium text-gray-900">
              Total de Obras com Atribuições
            </div>
            <div className="text-2xl font-bold text-green-600">
              {debugInfo.assignments?.totalWorksWithAssignments || 0}
            </div>
          </div>

          {debugInfo.assignments?.assignmentsByUser?.map((item: any) => (
            <div
              key={item.user.id}
              className="border border-gray-200 rounded p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">
                    {item.user.name}
                  </div>
                  <div className="text-sm text-gray-600">{item.user.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {item.assignedCount}
                  </div>
                  <div className="text-xs text-gray-500">obras atribuídas</div>
                </div>
              </div>

              {item.works.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Obras:
                  </div>
                  {item.works.slice(0, 3).map((work: Work) => (
                    <div
                      key={work.id}
                      className="text-xs bg-gray-50 p-2 rounded"
                    >
                      <div className="font-medium">{work.clientName}</div>
                      <div className="text-gray-600">
                        {work.workSheetNumber} -{" "}
                        {format(new Date(work.createdAt), "dd/MM/yyyy HH:mm", {
                          locale: pt,
                        })}
                      </div>
                    </div>
                  ))}
                  {item.works.length > 3 && (
                    <div className="text-xs text-gray-500">
                      ... e mais {item.works.length - 3} obras
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {debugInfo.assignments?.orphanedWorks?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <div className="font-medium text-red-800">Obras Órfãs</div>
              </div>
              <div className="text-sm text-red-700">
                {debugInfo.assignments.orphanedWorks.length} obra(s)
                atribuída(s) a usuários inexistentes
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Firebase */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Status Firebase</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Disponível:</span>
            <span
              className={
                debugInfo.firebase?.isAvailable
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {debugInfo.firebase?.isAvailable ? "Sim" : "Não"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Mensagem:</span>
            <span className="text-gray-600">{debugInfo.firebase?.message}</span>
          </div>
        </div>
      </div>

      {/* Lista de Obras Recentes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Últimas 10 Obras</h3>
          <span className="text-sm text-gray-600">{works.length} total</span>
        </div>

        <div className="space-y-2">
          {works.slice(0, 10).map((work) => (
            <div key={work.id} className="border border-gray-200 rounded p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {work.clientName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {work.workSheetNumber} -{" "}
                    {format(new Date(work.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: pt,
                    })}
                  </div>
                  {work.assignedUsers && work.assignedUsers.length > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      Atribuída a:{" "}
                      {work.assignedUsers
                        .map((userId) => {
                          const user = debugInfo.allUsers?.find(
                            (u: User) => u.id === userId,
                          );
                          return user ? user.name : userId;
                        })
                        .join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {(!work.assignedUsers ||
                    !work.assignedUsers.includes("user_alexandre")) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addAlexandreToWork(work.id)}
                    >
                      Atribuir ao Alexandre
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/works/${work.id}`)}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
