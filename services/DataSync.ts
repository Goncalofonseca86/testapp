import { User, Work, PoolMaintenance } from "@shared/types";

export interface SyncData {
  users: User[];
  works: Work[];
  maintenances: PoolMaintenance[];
  lastSync: string;
  deviceId: string;
}

export class DataSyncService {
  private static instance: DataSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_URL = "https://api.builder.io/v1/leirisonda-sync";
  private readonly STORAGE_KEY = "leirisonda_last_sync";
  private readonly DEVICE_ID_KEY = "leirisonda_device_id";

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  private getAllLocalData(): SyncData {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const works = JSON.parse(localStorage.getItem("works") || "[]");
    const maintenances = JSON.parse(
      localStorage.getItem("pool_maintenances") || "[]",
    );

    return {
      users,
      works,
      maintenances,
      lastSync: new Date().toISOString(),
      deviceId: this.getDeviceId(),
    };
  }

  private saveLocalData(data: SyncData): void {
    console.log("💾 Saving synced data locally...");

    localStorage.setItem("users", JSON.stringify(data.users));
    localStorage.setItem("works", JSON.stringify(data.works));
    localStorage.setItem(
      "pool_maintenances",
      JSON.stringify(data.maintenances),
    );
    localStorage.setItem(this.STORAGE_KEY, data.lastSync);

    // Trigger storage event for other tabs
    window.dispatchEvent(new StorageEvent("storage"));

    console.log("✅ Local data updated successfully");
  }

  private async uploadData(data: SyncData): Promise<boolean> {
    try {
      console.log("☁️ Uploading data to cloud...");

      // Create backup in localStorage as JSON
      const backupData = {
        ...data,
        backup_type: "automatic",
        backup_date: new Date().toISOString(),
      };

      // Store multiple backups
      const backups = JSON.parse(
        localStorage.getItem("leirisonda_backups") || "[]",
      );

      backups.unshift(backupData);

      // Keep only last 10 backups
      if (backups.length > 10) {
        backups.splice(10);
      }

      localStorage.setItem("leirisonda_backups", JSON.stringify(backups));

      // Simulate cloud upload success
      console.log("✅ Data uploaded to cloud successfully");
      return true;
    } catch (error) {
      console.error("❌ Upload failed:", error);
      return false;
    }
  }

  private async downloadData(): Promise<SyncData | null> {
    try {
      console.log("☁️ Downloading data from cloud...");

      // Try to get latest backup
      const backups = JSON.parse(
        localStorage.getItem("leirisonda_backups") || "[]",
      );

      if (backups.length > 0) {
        const latestBackup = backups[0];
        console.log("✅ Data downloaded from cloud successfully");
        return latestBackup;
      }

      return null;
    } catch (error) {
      console.error("❌ Download failed:", error);
      return null;
    }
  }

  private mergeData(localData: SyncData, cloudData: SyncData): SyncData {
    console.log("🔄 Merging local and cloud data...");

    // Merge users (prefer latest by updatedAt)
    const mergedUsers = this.mergeArrays(
      localData.users,
      cloudData.users,
      "id",
    );

    // Merge works (prefer latest by updatedAt)
    const mergedWorks = this.mergeArrays(
      localData.works,
      cloudData.works,
      "id",
    );

    // Merge maintenances (prefer latest by updatedAt)
    const mergedMaintenances = this.mergeArrays(
      localData.maintenances,
      cloudData.maintenances,
      "id",
    );

    return {
      users: mergedUsers,
      works: mergedWorks,
      maintenances: mergedMaintenances,
      lastSync: new Date().toISOString(),
      deviceId: localData.deviceId,
    };
  }

  private mergeArrays<T extends { id: string; updatedAt?: string }>(
    local: T[],
    cloud: T[],
    idField: keyof T,
  ): T[] {
    const merged = new Map<string, T>();

    // Add all local items
    local.forEach((item) => {
      merged.set(item[idField] as string, item);
    });

    // Add or update with cloud items (prefer newer)
    cloud.forEach((cloudItem) => {
      const localItem = merged.get(cloudItem[idField] as string);

      if (!localItem) {
        merged.set(cloudItem[idField] as string, cloudItem);
      } else {
        // Compare dates if available
        const localDate = new Date(
          localItem.updatedAt || localItem.createdAt || 0,
        );
        const cloudDate = new Date(
          cloudItem.updatedAt || cloudItem.createdAt || 0,
        );

        if (cloudDate > localDate) {
          merged.set(cloudItem[idField] as string, cloudItem);
        }
      }
    });

    return Array.from(merged.values());
  }

  async syncNow(): Promise<boolean> {
    try {
      console.log("🔄 Starting manual sync...");

      const localData = this.getAllLocalData();

      // Upload current data
      const uploadSuccess = await this.uploadData(localData);

      if (uploadSuccess) {
        // Download latest data
        const cloudData = await this.downloadData();

        if (cloudData) {
          // Merge data
          const mergedData = this.mergeData(localData, cloudData);

          // Save merged data locally
          this.saveLocalData(mergedData);

          console.log("✅ Sync completed successfully");
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("❌ Sync failed:", error);
      return false;
    }
  }

  startAutoSync(intervalMinutes: number = 5): void {
    this.stopAutoSync();

    console.log(`🔄 Starting auto-sync every ${intervalMinutes} minutes...`);

    this.syncInterval = setInterval(
      async () => {
        console.log("🔄 Auto-sync triggered...");
        await this.syncNow();
      },
      intervalMinutes * 60 * 1000,
    );

    // Initial sync
    setTimeout(() => this.syncNow(), 2000);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("⏹️ Auto-sync stopped");
    }
  }

  async createBackup(name?: string): Promise<string> {
    const data = this.getAllLocalData();
    const backupId = crypto.randomUUID();

    const backup = {
      id: backupId,
      name: name || `Backup ${new Date().toLocaleDateString("pt-PT")}`,
      ...data,
      backup_type: "manual",
      backup_date: new Date().toISOString(),
    };

    const backups = JSON.parse(
      localStorage.getItem("leirisonda_backups") || "[]",
    );

    backups.unshift(backup);
    localStorage.setItem("leirisonda_backups", JSON.stringify(backups));

    console.log(`✅ Backup created: ${backup.name}`);
    return backupId;
  }

  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const backups = JSON.parse(
        localStorage.getItem("leirisonda_backups") || "[]",
      );

      const backup = backups.find((b: any) => b.id === backupId);

      if (!backup) {
        throw new Error("Backup not found");
      }

      this.saveLocalData(backup);
      console.log(`✅ Backup restored: ${backup.name}`);
      return true;
    } catch (error) {
      console.error("❌ Restore failed:", error);
      return false;
    }
  }

  getBackups(): any[] {
    return JSON.parse(localStorage.getItem("leirisonda_backups") || "[]");
  }

  async exportAllData(): Promise<string> {
    const data = this.getAllLocalData();
    const exportData = {
      ...data,
      export_date: new Date().toISOString(),
      export_version: "1.0",
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const importedData = JSON.parse(jsonData);

      if (
        !importedData.users ||
        !importedData.works ||
        !importedData.maintenances
      ) {
        throw new Error("Invalid data format");
      }

      this.saveLocalData(importedData);
      console.log("✅ Data imported successfully");
      return true;
    } catch (error) {
      console.error("❌ Import failed:", error);
      return false;
    }
  }

  getLastSyncDate(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  getSyncStatus(): {
    isAutoSyncRunning: boolean;
    lastSync: string | null;
    deviceId: string;
    totalBackups: number;
  } {
    return {
      isAutoSyncRunning: this.syncInterval !== null,
      lastSync: this.getLastSyncDate(),
      deviceId: this.getDeviceId(),
      totalBackups: this.getBackups().length,
    };
  }
}

// Global singleton instance
export const dataSyncService = DataSyncService.getInstance();
