/**
 * WorkSaveHelper - Sistema de diagnóstico e recuperação para salvamento de obras
 */

import { Work } from "@shared/types";

export interface SaveDiagnostics {
  totalWorks: number;
  backupLocations: {
    works: number;
    leirisonda_works: number;
    temp_works: number;
    emergency_works: number;
  };
  potentialIssues: string[];
  lastUpdate: string | null;
  recommendations: string[];
}

export interface ConsolidationResult {
  consolidated: number;
  duplicatesRemoved: number;
  emergencyWorksFound: number;
  details: string;
}

export interface SyncResult {
  synced: boolean;
  backupsUpdated: number;
  details: string;
}

export class WorkSaveHelper {
  /**
   * Diagnóstico completo do sistema de salvamento
   */
  static diagnose(): SaveDiagnostics {
    try {
      console.log("🔍 Executando diagnóstico de salvamento...");

      // Verificar todas as localizações de backup
      const works1 = JSON.parse(localStorage.getItem("works") || "[]");
      const works2 = JSON.parse(
        localStorage.getItem("leirisonda_works") || "[]",
      );
      const works3 = JSON.parse(sessionStorage.getItem("temp_works") || "[]");

      // Contar obras de emergência
      let emergencyCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("emergency_work_")) {
          emergencyCount++;
        }
      }

      // Calcular total único
      const allWorks = [...works1, ...works2, ...works3];
      const uniqueWorks = allWorks.filter(
        (work, index, self) =>
          index === self.findIndex((w) => w.id === work.id),
      );

      // Identificar problemas potenciais
      const issues: string[] = [];
      if (works1.length === 0 && works2.length === 0) {
        issues.push("Nenhuma obra encontrada nos backups principais");
      }
      if (works1.length !== works2.length) {
        issues.push("Backups desincronizados");
      }
      if (emergencyCount > 0) {
        issues.push(`${emergencyCount} obras de emergência encontradas`);
      }

      // Verificar última atualização
      const lastUpdate = localStorage.getItem("leirisonda_last_update");

      // Gerar recomendações
      const recommendations: string[] = [];
      if (issues.length > 0) {
        recommendations.push("Executar consolidação de obras");
      }
      if (emergencyCount > 0) {
        recommendations.push("Recuperar obras de emergência");
      }
      if (works1.length !== works2.length) {
        recommendations.push("Sincronizar backups");
      }

      const diagnostics: SaveDiagnostics = {
        totalWorks: uniqueWorks.length,
        backupLocations: {
          works: works1.length,
          leirisonda_works: works2.length,
          temp_works: works3.length,
          emergency_works: emergencyCount,
        },
        potentialIssues: issues,
        lastUpdate,
        recommendations,
      };

      console.log("✅ Diagnóstico concluído:", diagnostics);
      return diagnostics;
    } catch (error) {
      console.error("❌ Erro no diagnóstico:", error);
      return {
        totalWorks: 0,
        backupLocations: {
          works: 0,
          leirisonda_works: 0,
          temp_works: 0,
          emergency_works: 0,
        },
        potentialIssues: ["Erro no diagnóstico"],
        lastUpdate: null,
        recommendations: ["Recarregar aplicação"],
      };
    }
  }

  /**
   * Consolidar obras de emergência no sistema principal
   */
  static consolidateEmergencyWorks(): ConsolidationResult {
    try {
      console.log("🔄 Consolidando obras de emergência...");

      // Buscar obras de emergência
      const emergencyWorks: Work[] = [];
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("emergency_work_")) {
          try {
            const emergencyWork = JSON.parse(localStorage.getItem(key) || "{}");
            if (emergencyWork.id) {
              emergencyWorks.push(emergencyWork);
              keysToRemove.push(key);
            }
          } catch (parseError) {
            console.warn(`Obra de emergência corrompida: ${key}`);
            keysToRemove.push(key); // Remove even if corrupted
          }
        }
      }

      if (emergencyWorks.length === 0) {
        return {
          consolidated: 0,
          duplicatesRemoved: 0,
          emergencyWorksFound: 0,
          details: "Nenhuma obra de emergência encontrada",
        };
      }

      // Obter obras principais
      const mainWorks = JSON.parse(localStorage.getItem("works") || "[]");
      const backupWorks = JSON.parse(
        localStorage.getItem("leirisonda_works") || "[]",
      );

      // Consolidar sem duplicatas
      const allWorks = [...mainWorks, ...backupWorks, ...emergencyWorks];
      const uniqueWorks = allWorks.filter(
        (work, index, self) =>
          index === self.findIndex((w) => w.id === work.id),
      );

      // Salvar versão consolidada
      localStorage.setItem("works", JSON.stringify(uniqueWorks));
      localStorage.setItem("leirisonda_works", JSON.stringify(uniqueWorks));
      sessionStorage.setItem("temp_works", JSON.stringify(uniqueWorks));

      // Remover obras de emergência já consolidadas
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      const result: ConsolidationResult = {
        consolidated: emergencyWorks.length,
        duplicatesRemoved: allWorks.length - uniqueWorks.length,
        emergencyWorksFound: emergencyWorks.length,
        details: `${emergencyWorks.length} obras de emergência consolidadas em ${uniqueWorks.length} obras totais`,
      };

      console.log("✅ Consolidação concluída:", result);
      return result;
    } catch (error) {
      console.error("❌ Erro na consolidação:", error);
      return {
        consolidated: 0,
        duplicatesRemoved: 0,
        emergencyWorksFound: 0,
        details: `Erro na consolidação: ${error}`,
      };
    }
  }

  /**
   * Sincronizar todos os backups
   */
  static syncBackups(): SyncResult {
    try {
      console.log("🔄 Sincronizando backups...");

      // Obter obras de todas as fontes
      const works1 = JSON.parse(localStorage.getItem("works") || "[]");
      const works2 = JSON.parse(
        localStorage.getItem("leirisonda_works") || "[]",
      );
      const works3 = JSON.parse(sessionStorage.getItem("temp_works") || "[]");

      // Usar a maior coleção como base
      let masterWorks = works1;
      if (works2.length > masterWorks.length) masterWorks = works2;
      if (works3.length > masterWorks.length) masterWorks = works3;

      // Consolidar e remover duplicatas
      const allWorks = [...works1, ...works2, ...works3];
      const uniqueWorks = allWorks.filter(
        (work, index, self) =>
          index === self.findIndex((w) => w.id === work.id),
      );

      // Se consolidação encontrou mais obras, usar essa versão
      if (uniqueWorks.length > masterWorks.length) {
        masterWorks = uniqueWorks;
      }

      // Sincronizar todos os backups com a versão master
      localStorage.setItem("works", JSON.stringify(masterWorks));
      localStorage.setItem("leirisonda_works", JSON.stringify(masterWorks));
      sessionStorage.setItem("temp_works", JSON.stringify(masterWorks));

      // Atualizar timestamp
      localStorage.setItem("leirisonda_last_update", new Date().toISOString());

      const result: SyncResult = {
        synced: true,
        backupsUpdated: 3,
        details: `${masterWorks.length} obras sincronizadas em 3 localizações`,
      };

      console.log("✅ Sincronização concluída:", result);
      return result;
    } catch (error) {
      console.error("❌ Erro na sincronização:", error);
      return {
        synced: false,
        backupsUpdated: 0,
        details: `Erro na sincronização: ${error}`,
      };
    }
  }

  /**
   * Executar recuperação completa do sistema
   */
  static emergencyRecovery(): {
    success: boolean;
    message: string;
    actions: string[];
  } {
    try {
      console.log("🚨 Executando recuperação de emergência...");

      const actions: string[] = [];

      // 1. Consolidar obras de emergência
      const consolidation = this.consolidateEmergencyWorks();
      if (consolidation.consolidated > 0) {
        actions.push(
          `Recuperadas ${consolidation.consolidated} obras de emergência`,
        );
      }

      // 2. Sincronizar backups
      const sync = this.syncBackups();
      if (sync.synced) {
        actions.push(sync.details);
      }

      // 3. Verificar integridade final
      const diagnostics = this.diagnose();
      actions.push(`Sistema agora tem ${diagnostics.totalWorks} obras`);

      if (diagnostics.potentialIssues.length === 0) {
        return {
          success: true,
          message: "Recuperação de emergência concluída com sucesso",
          actions,
        };
      } else {
        return {
          success: false,
          message: `Recuperação parcial. Problemas restantes: ${diagnostics.potentialIssues.join(", ")}`,
          actions,
        };
      }
    } catch (error) {
      console.error("❌ Erro na recuperação de emergência:", error);
      return {
        success: false,
        message: `Erro na recuperação: ${error}`,
        actions: [],
      };
    }
  }

  /**
   * Verificar se uma obra específica foi salva
   */
  static verifyWorkSaved(workId: string): {
    found: boolean;
    locations: string[];
    work?: Work;
  } {
    try {
      const locations: string[] = [];
      let foundWork: Work | undefined;

      // Verificar em todas as localizações
      const storageKeys = [
        "works",
        "leirisonda_works",
        "temp_works",
        `emergency_work_${workId}`,
      ];

      for (const key of storageKeys) {
        try {
          let works: Work[] = [];

          if (key.startsWith("emergency_work_")) {
            const emergencyWork = localStorage.getItem(key);
            if (emergencyWork) {
              const work = JSON.parse(emergencyWork);
              if (work.id === workId) {
                works = [work];
              }
            }
          } else if (key === "temp_works") {
            works = JSON.parse(sessionStorage.getItem(key) || "[]");
          } else {
            works = JSON.parse(localStorage.getItem(key) || "[]");
          }

          const work = works.find((w) => w.id === workId);
          if (work) {
            locations.push(key);
            if (!foundWork) foundWork = work;
          }
        } catch (error) {
          console.warn(`Erro ao verificar ${key}:`, error);
        }
      }

      return {
        found: locations.length > 0,
        locations,
        work: foundWork,
      };
    } catch (error) {
      console.error("❌ Erro na verificação:", error);
      return {
        found: false,
        locations: [],
      };
    }
  }
}
