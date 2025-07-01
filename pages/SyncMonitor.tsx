import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  Activity,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { firebaseService } from "@/services/FirebaseService";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface SyncEvent {
  id: string;
  timestamp: string;
  type:
    | "local_change"
    | "firebase_update"
    | "sync_started"
    | "sync_completed"
    | "error";
  message: string;
  data?: any;
}

export function SyncMonitor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { works, isOnline, isSyncing, lastSync, syncData } = useFirebaseSync();
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const syncEventsRef = useRef<SyncEvent[]>([]);

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

  const addSyncEvent = (
    type: SyncEvent["type"],
    message: string,
    data?: any,
  ) => {
    const event: SyncEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    };

    syncEventsRef.current = [event, ...syncEventsRef.current.slice(0, 49)]; // Keep last 50 events
    setSyncEvents([...syncEventsRef.current]);
  };

  // Monitor localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "works" || e.key === "leirisonda_works") {
        addSyncEvent("local_change", `LocalStorage atualizado: ${e.key}`, {
          key: e.key,
          newValue: e.newValue?.length,
        });
      }
    };

    // Monitor custom events
    const handleCustomEvent = (e: any) => {
      addSyncEvent(
        "firebase_update",
        "Obras atualizadas via Firebase real-time",
        { worksCount: e.detail?.works?.length },
      );
    };

    if (isMonitoring) {
      window.addEventListener("storage", handleStorageChange);
      window.addEventListener("leirisonda_works_updated", handleCustomEvent);
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("leirisonda_works_updated", handleCustomEvent);
    };
  }, [isMonitoring]);

  // Monitor sync status changes
  useEffect(() => {
    if (isSyncing) {
      addSyncEvent("sync_started", "Sincronização iniciada");
    } else if (lastSync) {
      addSyncEvent("sync_completed", "Sincronização concluída");
    }
  }, [isSyncing, lastSync]);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () =>
      addSyncEvent("sync_started", "Dispositivo voltou online");
    const handleOffline = () =>
      addSyncEvent("error", "Dispositivo ficou offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getEventIcon = (type: SyncEvent["type"]) => {
    switch (type) {
      case "local_change":
        return <Database className="w-4 h-4 text-blue-600" />;
      case "firebase_update":
        return <Activity className="w-4 h-4 text-green-600" />;
      case "sync_started":
        return <RefreshCw className="w-4 h-4 text-orange-600" />;
      case "sync_completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: SyncEvent["type"]) => {
    switch (type) {
      case "local_change":
        return "bg-blue-50 border-blue-200";
      case "firebase_update":
        return "bg-green-50 border-green-200";
      case "sync_started":
        return "bg-orange-50 border-orange-200";
      case "sync_completed":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const clearEvents = () => {
    setSyncEvents([]);
    syncEventsRef.current = [];
  };

  const forceSync = async () => {
    addSyncEvent("sync_started", "Sincronização manual forçada");
    await syncData();
  };

  const getCurrentStatus = () => {
    const firebaseStatus = firebaseService.getFirebaseStatus();

    return {
      isOnline,
      isSyncing,
      firebaseAvailable: firebaseStatus.isAvailable,
      lastSync: lastSync
        ? format(lastSync, "HH:mm:ss", { locale: pt })
        : "Nunca",
      worksCount: works.length,
      worksWithAssignments: works.filter(
        (w) => w.assignedUsers && w.assignedUsers.length > 0,
      ).length,
      alexandreWorks: works.filter(
        (w) => w.assignedUsers && w.assignedUsers.includes("user_alexandre"),
      ).length,
    };
  };

  const status = getCurrentStatus();

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
              Monitor de Sincronização
            </h1>
            <p className="text-gray-600">
              Monitoramento em tempo real de sincronização entre dispositivos
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-600">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status Conexão</p>
              <p
                className={`font-semibold ${status.isOnline ? "text-green-600" : "text-red-600"}`}
              >
                {status.isOnline ? "Online" : "Offline"}
              </p>
            </div>
            {status.isOnline ? (
              <Wifi className="w-8 h-8 text-green-600" />
            ) : (
              <WifiOff className="w-8 h-8 text-red-600" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Firebase</p>
              <p
                className={`font-semibold ${status.firebaseAvailable ? "text-green-600" : "text-red-600"}`}
              >
                {status.firebaseAvailable ? "Disponível" : "Indisponível"}
              </p>
            </div>
            <Database
              className={`w-8 h-8 ${status.firebaseAvailable ? "text-green-600" : "text-red-600"}`}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Último Sync</p>
              <p className="font-semibold text-gray-900">{status.lastSync}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Obras Total</p>
              <p className="font-semibold text-blue-600">{status.worksCount}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Alexandre Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Status - Alexandre</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Obras Atribuídas:</span>
            <span className="font-semibold ml-2">{status.alexandreWorks}</span>
          </div>
          <div>
            <span className="text-blue-700">Total com Atribuições:</span>
            <span className="font-semibold ml-2">
              {status.worksWithAssignments}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Sincronizando:</span>
            <span
              className={`font-semibold ml-2 ${status.isSyncing ? "text-orange-600" : "text-green-600"}`}
            >
              {status.isSyncing ? "Sim" : "Não"}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={forceSync} disabled={isSyncing}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {isSyncing ? "Sincronizando..." : "Forçar Sync"}
        </Button>

        <Button
          onClick={() => setIsMonitoring(!isMonitoring)}
          variant="outline"
        >
          {isMonitoring ? "Pausar Monitor" : "Retomar Monitor"}
        </Button>

        <Button onClick={clearEvents} variant="outline">
          Limpar Eventos
        </Button>
      </div>

      {/* Events Log */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Log de Eventos de Sincronização
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {syncEvents.length} eventos registrados
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {syncEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum evento registrado ainda
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {syncEvents.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-start space-x-3 p-3 rounded border ${getEventColor(event.type)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {event.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(event.timestamp), "HH:mm:ss", {
                          locale: pt,
                        })}
                      </p>
                    </div>
                    {event.data && (
                      <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
