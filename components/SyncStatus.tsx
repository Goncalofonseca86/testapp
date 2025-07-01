import React, { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle } from "lucide-react";
import { dataSyncService } from "@/services/DataSync";

export function SyncStatus() {
  const [status, setStatus] = useState(dataSyncService.getSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(dataSyncService.getSyncStatus());
    };

    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000);
    updateStatus();

    return () => clearInterval(interval);
  }, []);

  const handleQuickSync = async () => {
    setIsSyncing(true);
    await dataSyncService.syncNow();
    setStatus(dataSyncService.getSyncStatus());
    setIsSyncing(false);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

      if (diffMinutes < 1) return "Agora";
      if (diffMinutes < 60) return `${diffMinutes}m atrás`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
      return date.toLocaleDateString("pt-PT");
    } catch {
      return "Erro";
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        onClick={handleQuickSync}
        disabled={isSyncing}
        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        title={`Última sincronização: ${formatTime(status.lastSync)}`}
      >
        {isSyncing ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : status.isAutoSyncRunning ? (
          <Cloud className="w-3 h-3 text-green-500" />
        ) : (
          <CloudOff className="w-3 h-3 text-gray-400" />
        )}
        <span className="hidden sm:inline">
          {isSyncing
            ? "Sync..."
            : status.isAutoSyncRunning
              ? "Auto-Sync"
              : "Offline"}
        </span>
      </button>

      {status.lastSync && (
        <span className="text-gray-500 hidden md:inline">
          {formatTime(status.lastSync)}
        </span>
      )}
    </div>
  );
}
