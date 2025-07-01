import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Cloud,
  Download,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Database,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { dataSyncService } from "@/services/DataSync";

export function SyncManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(dataSyncService.getSyncStatus());
  const [backups, setBackups] = useState(dataSyncService.getBackups());
  const [backupName, setBackupName] = useState("");
  const [importData, setImportData] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      setSyncStatus(dataSyncService.getSyncStatus());
      setBackups(dataSyncService.getBackups());
    };

    // Update status every 30 seconds
    const interval = setInterval(updateStatus, 30000);
    updateStatus();

    return () => clearInterval(interval);
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const success = await dataSyncService.syncNow();
      if (success) {
        showNotification("success", "Sincronização concluída com sucesso!");
        setSyncStatus(dataSyncService.getSyncStatus());
      } else {
        showNotification("error", "Erro na sincronização. Tente novamente.");
      }
    } catch (error) {
      showNotification("error", "Erro na sincronização.");
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleAutoSyncToggle = (enabled: boolean) => {
    if (enabled) {
      dataSyncService.startAutoSync(5); // Every 5 minutes
      showNotification("success", "Sincronização automática ativada!");
    } else {
      dataSyncService.stopAutoSync();
      showNotification("success", "Sincronização automática desativada!");
    }
    setSyncStatus(dataSyncService.getSyncStatus());
  };

  const handleCreateBackup = async () => {
    try {
      const backupId = await dataSyncService.createBackup(
        backupName || undefined,
      );
      setBackups(dataSyncService.getBackups());
      setBackupName("");
      showNotification("success", "Backup criado com sucesso!");
    } catch (error) {
      showNotification("error", "Erro ao criar backup.");
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      const success = await dataSyncService.restoreBackup(backupId);
      if (success) {
        showNotification("success", "Backup restaurado com sucesso!");
        window.location.reload(); // Refresh to show restored data
      } else {
        showNotification("error", "Erro ao restaurar backup.");
      }
    } catch (error) {
      showNotification("error", "Erro ao restaurar backup.");
    }
  };

  const handleExportData = async () => {
    try {
      const exportedData = await dataSyncService.exportAllData();
      const blob = new Blob([exportedData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leirisonda-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification("success", "Dados exportados com sucesso!");
    } catch (error) {
      showNotification("error", "Erro ao exportar dados.");
    }
  };

  const handleImportData = async () => {
    try {
      const success = await dataSyncService.importData(importData);
      if (success) {
        showNotification("success", "Dados importados com sucesso!");
        setImportData("");
        window.location.reload();
      } else {
        showNotification(
          "error",
          "Erro ao importar dados. Verifica o formato.",
        );
      }
    } catch (error) {
      showNotification("error", "Erro ao importar dados.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("pt-PT");
    } catch {
      return "Data inválida";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="relative">
            <Cloud className="mr-2 h-4 w-4" />
            Sincronização
            {syncStatus.isAutoSyncRunning && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Smartphone className="mr-2 h-5 w-5 text-blue-600" />
              Gestão de Sincronização
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Notification */}
            {notification && (
              <Alert
                className={
                  notification.type === "success"
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }
              >
                {notification.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription
                  className={
                    notification.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }
                >
                  {notification.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">
                    Auto-Sync
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      syncStatus.isAutoSyncRunning
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  ></div>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {syncStatus.isAutoSyncRunning ? "Ativo" : "Inativo"}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">
                    Última Sincronização
                  </span>
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {syncStatus.lastSync
                    ? formatDate(syncStatus.lastSync)
                    : "Nunca"}
                </p>
              </div>
            </div>

            {/* Manual Sync */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Sincronização Manual
              </h3>

              <div className="flex gap-4">
                <Button
                  onClick={handleManualSync}
                  disabled={isManualSyncing}
                  className="flex-1"
                >
                  {isManualSyncing ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {isManualSyncing ? "A sincronizar..." : "Sincronizar Agora"}
                </Button>
              </div>
            </div>

            {/* Auto-Sync Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Sincronização Automática
              </h3>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-sync"
                  checked={syncStatus.isAutoSyncRunning}
                  onCheckedChange={handleAutoSyncToggle}
                />
                <Label htmlFor="auto-sync">
                  Sincronizar automaticamente a cada 5 minutos
                </Label>
              </div>

              <p className="text-sm text-gray-600">
                Quando ativado, os dados serão sincronizados automaticamente
                entre todos os dispositivos a cada 5 minutos.
              </p>
            </div>

            {/* Backup Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Gestão de Backups
              </h3>

              <div className="flex gap-2">
                <Input
                  placeholder="Nome do backup (opcional)"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleCreateBackup}>
                  <Database className="mr-2 h-4 w-4" />
                  Criar Backup
                </Button>
              </div>

              {/* Backup List */}
              <div className="max-h-40 overflow-y-auto space-y-2">
                {backups.slice(0, 5).map((backup: any) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{backup.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(backup.backup_date)} •{" "}
                        {backup.backup_type === "manual" ? "Manual" : "Auto"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreBackup(backup.id)}
                    >
                      Restaurar
                    </Button>
                  </div>
                ))}

                {backups.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum backup disponível
                  </p>
                )}
              </div>
            </div>

            {/* Import/Export */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Importar/Exportar Dados
              </h3>

              <div className="flex gap-2">
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Dados
                </Button>
              </div>

              <div className="space-y-2">
                <textarea
                  placeholder="Colar dados JSON para importar..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="w-full h-20 p-2 border border-gray-300 rounded-lg text-xs"
                />
                <Button
                  onClick={handleImportData}
                  disabled={!importData.trim()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Dados
                </Button>
              </div>
            </div>

            {/* Device Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Informações do Dispositivo
              </h4>
              <p className="text-xs text-gray-600">
                ID: {syncStatus.deviceId.slice(0, 8)}...
              </p>
              <p className="text-xs text-gray-600">
                Backups: {syncStatus.totalBackups}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
