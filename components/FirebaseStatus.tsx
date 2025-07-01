import React from "react";
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { useAuth } from "@/components/AuthProvider";

export function FirebaseStatus() {
  const { user } = useAuth();
  const { isOnline, isSyncing, lastSync, syncData } = useFirebaseSync();

  // Check if Firebase is available
  const isFirebaseAvailable = React.useMemo(() => {
    try {
      return typeof window !== "undefined" && window.firebase !== undefined;
    } catch {
      return false;
    }
  }, []);

  if (!user) return null;

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Nunca";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Agora mesmo";
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;

    return date.toLocaleDateString("pt-PT");
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  Online
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">
                  Offline
                </span>
              </>
            )}
          </div>

          <div className="w-px h-4 bg-gray-300" />

          {/* Firebase Status */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <>
                <Cloud className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600">Firebase</span>
              </>
            ) : (
              <>
                <CloudOff className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Local</span>
              </>
            )}
          </div>

          {/* Sync Status */}
          {isSyncing && (
            <div className="flex items-center space-x-1">
              <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
              <span className="text-xs text-blue-500">Sincronizando...</span>
            </div>
          )}
        </div>

        {/* Sync Button & Last Sync */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500">
            Última sync: {formatLastSync(lastSync)}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={syncData}
            disabled={!isOnline || isSyncing}
            className="h-8 px-3 text-xs"
          >
            {isSyncing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            <span className="ml-1">Sync</span>
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      <div className="mt-3 space-y-1">
        {!isFirebaseAvailable && (
          <p className="text-xs text-blue-600">
            📱 Modo local - dados guardados no dispositivo
          </p>
        )}

        {isFirebaseAvailable && !isOnline && (
          <p className="text-xs text-orange-600">
            📱 Offline - sincronização automática quando voltar online
          </p>
        )}

        {isFirebaseAvailable && isOnline && (
          <div className="space-y-1">
            <p className="text-xs text-green-600">
              ⚡ Sincronização instantânea ativa
            </p>
            <p className="text-xs text-gray-500">
              Dados sincronizam automaticamente a cada alteração
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
