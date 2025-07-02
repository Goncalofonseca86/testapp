import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  Users,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { firebaseService } from "@/services/FirebaseService";

interface SyncStatusProps {
  showForUser?: string; // Email do usuário que pode ver este componente
}

export function SyncStatus({
  showForUser = "gongonsilva@gmail.com",
}: SyncStatusProps) {
  const { user } = useAuth();
  const {
    works,
    isOnline,
    isSyncing,
    lastSync,
    isFirebaseAvailable,
    syncData,
  } = useFirebaseSync();

  const [isVisible, setIsVisible] = useState(false);
  const [syncDetails, setSyncDetails] = useState<any>(null);
  const [consolidatedWorks, setConsolidatedWorks] = useState(0);

  // Só mostrar para usuários específicos
  if (!user || user.email !== showForUser) {
    return null;
  }

  useEffect(() => {
    // Carregar informações detalhadas
    const loadSyncDetails = () => {
      try {
        const firebaseStatus = firebaseService.getFirebaseStatus();
        const consolidated = firebaseService.consolidateWorksFromAllBackups();

        setSyncDetails({
          firebase: firebaseStatus,
          localStorage: {
            works: JSON.parse(localStorage.getItem("works") || "[]").length,
            leirisonda_works: JSON.parse(
              localStorage.getItem("leirisonda_works") || "[]",
            ).length,
            temp_works: JSON.parse(sessionStorage.getItem("temp_works") || "[]")
              .length,
            users: JSON.parse(localStorage.getItem("users") || "[]").length,
          },
          lastUpdate: localStorage.getItem("leirisonda_last_update"),
          sessionUser: !!sessionStorage.getItem("temp_user_session"),
          deviceInfo: {
            userAgent: navigator.userAgent.substring(0, 50),
            timestamp: new Date().toISOString(),
          },
        });

        setConsolidatedWorks(consolidated.length);
      } catch (error) {
        console.error("Erro ao carregar detalhes de sync:", error);
      }
    };

    if (isVisible) {
      loadSyncDetails();
      const interval = setInterval(loadSyncDetails, 5000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const handleForceSync = async () => {
    try {
      await syncData();
      // Recarregar detalhes após sync
      setTimeout(() => {
        const consolidated = firebaseService.consolidateWorksFromAllBackups();
        setConsolidatedWorks(consolidated.length);
      }, 1000);
    } catch (error) {
      console.error("Erro no sync forçado:", error);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return "destructive";
    if (isSyncing) return "secondary";
    if (isFirebaseAvailable) return "default";
    return "secondary";
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (isSyncing) return "Sincronizando...";
    if (isFirebaseAvailable) return "Online";
    return "Local apenas";
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Status de Sincronização
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

      {/* Status Principal */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <Badge variant={getStatusColor() as any}>{getStatusText()}</Badge>
          {isSyncing && (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700">
            {works.length} obras | {consolidatedWorks} consolidadas
          </span>
        </div>

        {lastSync && (
          <div className="text-xs text-gray-500">
            Último sync: {new Date(lastSync).toLocaleTimeString("pt-PT")}
          </div>
        )}
      </div>

      {/* Detalhes Técnicos */}
      {syncDetails && (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Firebase:</span>
            <span
              className={
                syncDetails.firebase.isAvailable
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {syncDetails.firebase.isAvailable ? "✓" : "✗"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>works: {syncDetails.localStorage.works}</div>
            <div>backup: {syncDetails.localStorage.leirisonda_works}</div>
            <div>temp: {syncDetails.localStorage.temp_works}</div>
            <div>users: {syncDetails.localStorage.users}</div>
          </div>

          <div className="flex items-center gap-1">
            <span>Sessão:</span>
            {syncDetails.sessionUser ? (
              <CheckCircle className="w-3 h-3 text-green-600" />
            ) : (
              <AlertCircle className="w-3 h-3 text-yellow-600" />
            )}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="mt-4 space-y-2">
        <Button
          onClick={handleForceSync}
          size="sm"
          className="w-full"
          disabled={isSyncing}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
          />
          Sincronizar Agora
        </Button>

        {!isOnline && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Dispositivo offline. As alterações serão sincronizadas quando
              voltar online.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
