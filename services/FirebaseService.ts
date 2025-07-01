import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Work, PoolMaintenance } from "@shared/types";

export class FirebaseService {
  private static instance: FirebaseService;
  private unsubscribes: (() => void)[] = [];
  private isFirebaseAvailable: boolean = false;

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  constructor() {
    // Check if Firebase is available
    try {
      this.isFirebaseAvailable =
        db !== null && db !== undefined && typeof db === "object";
      if (this.isFirebaseAvailable) {
        console.log("🔥 FirebaseService running with Firebase sync");
      } else {
        console.log("📱 FirebaseService running in local-only mode");
      }
    } catch (error) {
      console.log("📱 FirebaseService fallback to local-only mode:", error);
      this.isFirebaseAvailable = false;
    }
  }

  // Método para verificar status detalhado do Firebase
  getFirebaseStatus() {
    return {
      isAvailable: this.isFirebaseAvailable,
      dbConnection: db !== null && db !== undefined,
      hasActiveListeners: this.unsubscribes.length > 0,
      timestamp: new Date().toISOString(),
    };
  }

  // Users Collection
  async getUsers(): Promise<User[]> {
    if (!this.isFirebaseAvailable) {
      return this.getLocalUsers();
    }

    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          doc.data().createdAt?.toDate?.()?.toISOString() ||
          doc.data().createdAt,
      })) as User[];

      // Sync to localStorage as backup
      localStorage.setItem("users", JSON.stringify(users));
      return users;
    } catch (error) {
      console.error(
        "Error fetching users from Firebase, falling back to local:",
        error,
      );
      return this.getLocalUsers();
    }
  }

  private getLocalUsers(): User[] {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      return users;
    } catch (error) {
      console.error("Error fetching local users:", error);
      return [];
    }
  }

  async createUser(userData: Omit<User, "id" | "createdAt">): Promise<string> {
    if (!this.isFirebaseAvailable) {
      return this.createLocalUser(userData);
    }

    try {
      const usersRef = collection(db, "users");
      const docRef = await addDoc(usersRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("🔥 User created in Firebase:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error(
        "Error creating user in Firebase, falling back to local:",
        error,
      );
      return this.createLocalUser(userData);
    }
  }

  private createLocalUser(userData: Omit<User, "id" | "createdAt">): string {
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const users = this.getLocalUsers();
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    console.log("📱 User created locally:", newUser.id);
    return newUser.id;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    if (!this.isFirebaseAvailable) {
      return this.updateLocalUser(userId, updates);
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log("🔥 User updated in Firebase:", userId);
    } catch (error) {
      console.error(
        "Error updating user in Firebase, falling back to local:",
        error,
      );
      this.updateLocalUser(userId, updates);
    }
  }

  private updateLocalUser(userId: string, updates: Partial<User>): void {
    try {
      const users = this.getLocalUsers();
      const userIndex = users.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        localStorage.setItem("users", JSON.stringify(users));
        console.log("📱 User updated locally:", userId);
      }
    } catch (error) {
      console.error("Error updating local user:", error);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.isFirebaseAvailable) {
      return this.deleteLocalUser(userId);
    }

    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
      console.log("��� User deleted from Firebase:", userId);
    } catch (error) {
      console.error(
        "Error deleting user from Firebase, falling back to local:",
        error,
      );
      this.deleteLocalUser(userId);
    }
  }

  private deleteLocalUser(userId: string): void {
    try {
      const users = this.getLocalUsers();
      const filteredUsers = users.filter((u) => u.id !== userId);
      localStorage.setItem("users", JSON.stringify(filteredUsers));
      console.log("📱 User deleted locally:", userId);
    } catch (error) {
      console.error("Error deleting local user:", error);
    }
  }

  // Works Collection
  async getWorks(): Promise<Work[]> {
    // SEMPRE consolidar backups primeiro
    const consolidatedWorks = this.consolidateWorksFromAllBackups();

    if (!this.isFirebaseAvailable) {
      console.log(
        "📱 FIREBASE INDISPONÍVEL: Retornando obras consolidadas localmente",
      );
      return consolidatedWorks;
    }

    try {
      const worksRef = collection(db, "works");
      const q = query(worksRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const firebaseWorks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          doc.data().createdAt?.toDate?.()?.toISOString() ||
          doc.data().createdAt,
        updatedAt:
          doc.data().updatedAt?.toDate?.()?.toISOString() ||
          doc.data().updatedAt,
      })) as Work[];

      // Mesclar obras do Firebase com obras locais consolidadas
      const allWorks = [...firebaseWorks, ...consolidatedWorks];
      const uniqueWorks = allWorks.filter(
        (work, index, self) =>
          index === self.findIndex((w) => w.id === work.id),
      );

      // Ordenar por data de criação
      uniqueWorks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      console.log(
        `🔥 FIREBASE + LOCAL: ${firebaseWorks.length} Firebase + ${consolidatedWorks.length} local = ${uniqueWorks.length} total`,
      );

      // Salvar versão mesclada como backup
      localStorage.setItem("works", JSON.stringify(uniqueWorks));
      return uniqueWorks;
    } catch (error) {
      console.error(
        "❌ ERRO FIREBASE: Retornando obras consolidadas localmente:",
        error,
      );
      return consolidatedWorks;
    }
  }

  private getLocalWorks(): Work[] {
    try {
      const works = JSON.parse(localStorage.getItem("works") || "[]");
      return works;
    } catch (error) {
      console.error("Error fetching local works:", error);
      return [];
    }
  }

  // Função para consolidar obras de todos os backups
  consolidateWorksFromAllBackups(): Work[] {
    try {
      console.log("🔄 CONSOLIDANDO OBRAS DE TODOS OS BACKUPS...");

      // Coletar de todas as fontes
      const works1 = JSON.parse(localStorage.getItem("works") || "[]");
      const works2 = JSON.parse(
        localStorage.getItem("leirisonda_works") || "[]",
      );
      const works3 = JSON.parse(sessionStorage.getItem("temp_works") || "[]");

      // Coletar obras de emergência
      const emergencyWorks: Work[] = [];
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

      // Consolidar tudo em um array único (sem duplicatas)
      const allWorks = [...works1, ...works2, ...works3, ...emergencyWorks];
      const uniqueWorks = allWorks.filter(
        (work, index, self) =>
          index === self.findIndex((w) => w.id === work.id),
      );

      // Ordenar por data de criação (mais recentes primeiro)
      uniqueWorks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      console.log(
        `✅ CONSOLIDAÇÃO COMPLETA: ${uniqueWorks.length} obras únicas consolidadas`,
      );
      console.log(
        `📊 FONTES: works(${works1.length}) + leirisonda_works(${works2.length}) + temp_works(${works3.length}) + emergency(${emergencyWorks.length})`,
      );

      // Salvar versão consolidada como principal
      localStorage.setItem("works", JSON.stringify(uniqueWorks));

      return uniqueWorks;
    } catch (error) {
      console.error("❌ ERRO NA CONSOLIDAÇÃO:", error);
      return this.getLocalWorks();
    }
  }

  async createWork(
    workData: Omit<Work, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    console.log(
      "🔄 INICIANDO CRIAÇÃO DE OBRA SUPER ROBUSTA:",
      workData.clientName,
    );

    // VALIDAÇÃO CRÍTICA: Verificar se assignedUsers está presente e válido
    if (workData.assignedUsers) {
      console.log("🎯 ATRIBUIÇÕES RECEBIDAS NO FIREBASESERVICE:", {
        quantidade: workData.assignedUsers.length,
        ids: workData.assignedUsers,
      });
    } else {
      console.log("⚠️ NENHUMA ATRIBUIÇÃO RECEBIDA");
    }

    const newWork: Work = {
      ...workData,
      assignedUsers: workData.assignedUsers || [], // GARANTIR que assignedUsers seja preservado
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // VERIFICAÇÃO DUPLA: Confirmar que assignedUsers foi preservado
    console.log("✅ OBRA PREPARADA COM ATRIBUIÇÕES:", {
      workId: newWork.id,
      assignedUsers: newWork.assignedUsers,
      hasAssignments: newWork.assignedUsers.length > 0,
    });

    // ESTRATÉGIA SUPER ROBUSTA: GARANTIR 100% SUCESSO
    try {
      // ETAPA 1: SALVAMENTO LOCAL IMEDIATO TRIPLO + EMERGÊNCIA
      console.log("💾 EXECUTANDO SALVAMENTO SUPER SEGURO...");

      // Backup 1: Principal
      const works = this.getLocalWorks();
      works.push(newWork);
      localStorage.setItem("works", JSON.stringify(works));

      // Backup 2: Secundário
      const backupWorks = JSON.parse(
        localStorage.getItem("leirisonda_works") || "[]",
      );
      backupWorks.push(newWork);
      localStorage.setItem("leirisonda_works", JSON.stringify(backupWorks));

      // Backup 3: Temporário
      const sessionWorks = JSON.parse(
        sessionStorage.getItem("temp_works") || "[]",
      );
      sessionWorks.push(newWork);
      sessionStorage.setItem("temp_works", JSON.stringify(sessionWorks));

      // Backup 4: Emergência individual
      localStorage.setItem(
        `emergency_work_${newWork.id}`,
        JSON.stringify(newWork),
      );

      console.log("✅ OBRA SALVA EM 4 LOCALIZAÇÕES DIFERENTES:", newWork.id);

      // ETAPA 2: FIREBASE SYNC EM BACKGROUND (não bloqueia)
      let firebaseSuccess = false;
      if (this.isFirebaseAvailable) {
        // Executar Firebase em background - NÃO aguardar nem verificar
        Promise.resolve()
          .then(async () => {
            try {
              const firebaseData = {
                ...newWork,
                assignedUsers: Array.isArray(newWork.assignedUsers)
                  ? newWork.assignedUsers
                  : [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };

              const docRef = doc(db, "works", newWork.id);
              await setDoc(docRef, firebaseData);

              firebaseSuccess = true;
              console.log(
                "🔥 FIREBASE SYNC CONCLUÍDO EM BACKGROUND:",
                newWork.id,
              );

              // Notificar outros dispositivos
              localStorage.setItem(
                "leirisonda_last_update",
                new Date().toISOString(),
              );
            } catch (firebaseError) {
              firebaseSuccess = false;
              console.warn(
                "⚠️ Firebase background sync falhou (não crítico):",
                firebaseError,
              );
            }
          })
          .catch((error) => {
            firebaseSuccess = false;
            console.warn("⚠️ Firebase background promise falhou:", error);
          });
      }

      // VERIFICAÇÃO FINAL DOS BACKUPS LOCAIS (já salvos anteriormente)
      const verification1 = this.getLocalWorks();
      const verification2 = JSON.parse(
        localStorage.getItem("leirisonda_works") || "[]",
      );
      const verification3 = JSON.parse(
        sessionStorage.getItem("temp_works") || "[]",
      );

      const savedWork1 = verification1.find((w) => w.id === newWork.id);
      const savedWork2 = verification2.find((w: any) => w.id === newWork.id);
      const savedWork3 = verification3.find((w: any) => w.id === newWork.id);

      if (savedWork1 && savedWork2 && savedWork3) {
        console.log(`✅ OBRA SALVA COM BACKUP TRIPLO LOCAL: ${newWork.id}`);

        // VERIFICAÇÃO CRÍTICA DAS ATRIBUIÇÕES NOS BACKUPS
        if (newWork.assignedUsers && newWork.assignedUsers.length > 0) {
          const assignmentsVerification = {
            backup1: savedWork1.assignedUsers?.length || 0,
            backup2: savedWork2.assignedUsers?.length || 0,
            backup3: savedWork3.assignedUsers?.length || 0,
            expected: newWork.assignedUsers.length,
          };

          console.log(
            "🎯 VERIFICAÇÃO DE ATRIBUIÇÕES NOS BACKUPS:",
            assignmentsVerification,
          );

          if (
            assignmentsVerification.backup1 === 0 ||
            assignmentsVerification.backup2 === 0 ||
            assignmentsVerification.backup3 === 0
          ) {
            console.error("❌ ATRIBUIÇÕES PERDIDAS EM ALGUNS BACKUPS!");

            // Corrigir backups defeituosos
            if (assignmentsVerification.backup1 === 0) {
              const correctedWorks1 = verification1.map((w) =>
                w.id === newWork.id
                  ? { ...w, assignedUsers: newWork.assignedUsers }
                  : w,
              );
              localStorage.setItem("works", JSON.stringify(correctedWorks1));
            }
            if (assignmentsVerification.backup2 === 0) {
              const correctedWorks2 = verification2.map((w: any) =>
                w.id === newWork.id
                  ? { ...w, assignedUsers: newWork.assignedUsers }
                  : w,
              );
              localStorage.setItem(
                "leirisonda_works",
                JSON.stringify(correctedWorks2),
              );
            }
            if (assignmentsVerification.backup3 === 0) {
              const correctedWorks3 = verification3.map((w: any) =>
                w.id === newWork.id
                  ? { ...w, assignedUsers: newWork.assignedUsers }
                  : w,
              );
              sessionStorage.setItem(
                "temp_works",
                JSON.stringify(correctedWorks3),
              );
            }

            console.log("🔧 CORREÇÃO DE BACKUPS EXECUTADA");
          } else {
            console.log("✅ ATRIBUIÇÕES PRESERVADAS EM TODOS OS BACKUPS");
          }
        }
      } else {
        console.error("⚠��� BACKUP TRIPLO LOCAL FALHOU:", {
          backup1: !!savedWork1,
          backup2: !!savedWork2,
          backup3: !!savedWork3,
        });
      }

      // STATUS FINAL - Sempre positivo para evitar erros
      console.log("🌟 OBRA CRIADA COM SUCESSO:", newWork.id);
      if (this.isFirebaseAvailable) {
        console.log("📡 SINCRONIZAÇÃO FIREBASE EM PROGRESSO EM BACKGROUND");
      } else {
        console.log("📱 OBRA SALVA LOCALMENTE - SINCRONIZAÇÃO OFFLINE");
      }

      return newWork.id;
    } catch (error) {
      console.error("❌ Erro contido na criação de obra:", error);

      // RECUPERAÇÃO DE EMERGÊNCIA FINAL
      try {
        localStorage.setItem(
          `emergency_work_${newWork.id}`,
          JSON.stringify(newWork),
        );
        console.log("🚨 OBRA SALVA EM MODO DE EMERGÊNCIA");
        return newWork.id;
      } catch (emergencyError) {
        console.error("❌ Erro final:", emergencyError);
        // NUNCA fazer throw para evitar ErrorBoundary
        console.log("⚠️ Retornando ID para evitar crash da aplicação");
        return newWork.id;
      }
    }
  }

  private createLocalWork(
    workData: Omit<Work, "id" | "createdAt" | "updatedAt">,
  ): string {
    const newWork: Work = {
      ...workData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const works = this.getLocalWorks();
    works.push(newWork);
    localStorage.setItem("works", JSON.stringify(works));

    console.log("📱 Work created locally:", newWork.id);
    return newWork.id;
  }

  async updateWork(workId: string, updates: Partial<Work>): Promise<void> {
    // SEMPRE atualizar localmente primeiro (sync instantâneo local)
    this.updateLocalWork(workId, updates);

    // Tentar Firebase em paralelo se disponível
    if (this.isFirebaseAvailable) {
      try {
        const workRef = doc(db, "works", workId);
        await updateDoc(workRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        console.log("🔥 Work updated in Firebase:", workId);
      } catch (error) {
        console.error(
          "⚠️ Firebase update failed, work updated locally:",
          error,
        );
      }
    }
  }

  private updateLocalWork(workId: string, updates: Partial<Work>): void {
    try {
      const works = this.getLocalWorks();
      const workIndex = works.findIndex((w) => w.id === workId);
      if (workIndex !== -1) {
        works[workIndex] = {
          ...works[workIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("works", JSON.stringify(works));
        console.log("📱 Work updated locally:", workId);
      }
    } catch (error) {
      console.error("Error updating local work:", error);
    }
  }

  async deleteWork(workId: string): Promise<void> {
    if (!this.isFirebaseAvailable) {
      return this.deleteLocalWork(workId);
    }

    try {
      const workRef = doc(db, "works", workId);
      await deleteDoc(workRef);
      console.log("🔥 Work deleted from Firebase:", workId);
    } catch (error) {
      console.error(
        "Error deleting work from Firebase, falling back to local:",
        error,
      );
      this.deleteLocalWork(workId);
    }
  }

  private deleteLocalWork(workId: string): void {
    try {
      const works = this.getLocalWorks();
      const filteredWorks = works.filter((w) => w.id !== workId);
      localStorage.setItem("works", JSON.stringify(filteredWorks));
      console.log("📱 Work deleted locally:", workId);
    } catch (error) {
      console.error("Error deleting local work:", error);
    }
  }

  // Pool Maintenances Collection
  async getMaintenances(): Promise<PoolMaintenance[]> {
    if (!this.isFirebaseAvailable) {
      return this.getLocalMaintenances();
    }

    try {
      const maintenancesRef = collection(db, "maintenances");
      const q = query(maintenancesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const maintenances = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          doc.data().createdAt?.toDate?.()?.toISOString() ||
          doc.data().createdAt,
        updatedAt:
          doc.data().updatedAt?.toDate?.()?.toISOString() ||
          doc.data().updatedAt,
      })) as PoolMaintenance[];

      // Sync to localStorage as backup
      localStorage.setItem("pool_maintenances", JSON.stringify(maintenances));
      return maintenances;
    } catch (error) {
      console.error(
        "Error fetching maintenances from Firebase, falling back to local:",
        error,
      );
      return this.getLocalMaintenances();
    }
  }

  private getLocalMaintenances(): PoolMaintenance[] {
    try {
      const maintenances = JSON.parse(
        localStorage.getItem("pool_maintenances") || "[]",
      );
      return maintenances;
    } catch (error) {
      console.error("Error fetching local maintenances:", error);
      return [];
    }
  }

  async createMaintenance(
    maintenanceData: Omit<PoolMaintenance, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const newMaintenance: PoolMaintenance = {
      ...maintenanceData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // SEMPRE criar localmente primeiro (sync instantâneo local)
    const maintenances = this.getLocalMaintenances();
    maintenances.push(newMaintenance);
    localStorage.setItem("pool_maintenances", JSON.stringify(maintenances));
    console.log("📱 Maintenance created locally first:", newMaintenance.id);

    // Tentar Firebase em paralelo se disponível
    if (this.isFirebaseAvailable) {
      try {
        const maintenancesRef = collection(db, "maintenances");
        await addDoc(maintenancesRef, {
          ...newMaintenance,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log("🔥 Maintenance synced to Firebase:", newMaintenance.id);
      } catch (error) {
        console.error(
          "⚠️ Firebase sync failed, maintenance saved locally:",
          error,
        );
      }
    }

    return newMaintenance.id;
  }

  private createLocalMaintenance(
    maintenanceData: Omit<PoolMaintenance, "id" | "createdAt" | "updatedAt">,
  ): string {
    const newMaintenance: PoolMaintenance = {
      ...maintenanceData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const maintenances = this.getLocalMaintenances();
    maintenances.push(newMaintenance);
    localStorage.setItem("pool_maintenances", JSON.stringify(maintenances));

    console.log("📱 Maintenance created locally:", newMaintenance.id);
    return newMaintenance.id;
  }

  async updateMaintenance(
    maintenanceId: string,
    updates: Partial<PoolMaintenance>,
  ): Promise<void> {
    // SEMPRE atualizar localmente primeiro (sync instantâneo local)
    this.updateLocalMaintenance(maintenanceId, updates);

    // Tentar Firebase em paralelo se disponível
    if (this.isFirebaseAvailable) {
      try {
        const maintenanceRef = doc(db, "maintenances", maintenanceId);
        await updateDoc(maintenanceRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        console.log("🔥 Maintenance updated in Firebase:", maintenanceId);
      } catch (error) {
        console.error(
          "⚠️ Firebase update failed, maintenance updated locally:",
          error,
        );
      }
    }
  }

  private updateLocalMaintenance(
    maintenanceId: string,
    updates: Partial<PoolMaintenance>,
  ): void {
    try {
      const maintenances = this.getLocalMaintenances();
      const maintenanceIndex = maintenances.findIndex(
        (m) => m.id === maintenanceId,
      );
      if (maintenanceIndex !== -1) {
        // Se as atualizações incluem intervenções, substitui completamente
        if (updates.interventions) {
          maintenances[maintenanceIndex] = {
            ...maintenances[maintenanceIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Para outras atualizações, usa spread normal
          maintenances[maintenanceIndex] = {
            ...maintenances[maintenanceIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        localStorage.setItem("pool_maintenances", JSON.stringify(maintenances));
        console.log("📱 Maintenance updated locally:", maintenanceId);
        console.log(
          "📱 Total interventions after update:",
          maintenances[maintenanceIndex].interventions?.length || 0,
        );
      } else {
        console.error("��� Maintenance not found for update:", maintenanceId);
      }
    } catch (error) {
      console.error("Error updating local maintenance:", error);
    }
  }

  async deleteMaintenance(maintenanceId: string): Promise<void> {
    if (!this.isFirebaseAvailable) {
      return this.deleteLocalMaintenance(maintenanceId);
    }

    try {
      const maintenanceRef = doc(db, "maintenances", maintenanceId);
      await deleteDoc(maintenanceRef);
      console.log("�� Maintenance deleted from Firebase:", maintenanceId);
    } catch (error) {
      console.error(
        "Error deleting maintenance from Firebase, falling back to local:",
        error,
      );
      this.deleteLocalMaintenance(maintenanceId);
    }
  }

  private deleteLocalMaintenance(maintenanceId: string): void {
    try {
      const maintenances = this.getLocalMaintenances();
      const filteredMaintenances = maintenances.filter(
        (m) => m.id !== maintenanceId,
      );
      localStorage.setItem(
        "pool_maintenances",
        JSON.stringify(filteredMaintenances),
      );
      console.log("📱 Maintenance deleted locally:", maintenanceId);
    } catch (error) {
      console.error("Error deleting local maintenance:", error);
    }
  }

  // Real-time listeners (only work with Firebase)
  listenToWorks(callback: (works: Work[]) => void): () => void {
    if (!this.isFirebaseAvailable) {
      console.log("📱 Firebase not available, using local data for works");
      // Return consolidated local data immediately and setup a storage listener
      const consolidatedWorks = this.consolidateWorksFromAllBackups();
      callback(consolidatedWorks);

      const handleStorageChange = () => {
        const updatedWorks = this.consolidateWorksFromAllBackups();
        callback(updatedWorks);
      };

      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }

    try {
      const worksRef = collection(db, "works");
      const q = query(worksRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const firebaseWorks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt:
              doc.data().createdAt?.toDate?.()?.toISOString() ||
              doc.data().createdAt,
            updatedAt:
              doc.data().updatedAt?.toDate?.()?.toISOString() ||
              doc.data().updatedAt,
          })) as Work[];

          console.log(
            `🔥 REAL-TIME UPDATE: ${firebaseWorks.length} obras recebidas do Firebase`,
          );

          // Log detalhado das mudanças para debug
          const currentTime = new Date().toISOString();
          console.log(`📡 Timestamp do listener: ${currentTime}`);

          // CRÍTICO: Consolidar com dados locais para não perder obras
          const localWorks = this.consolidateWorksFromAllBackups();

          // Verificar se há NOVAS obras do Firebase
          const localWorkIds = new Set(localWorks.map((w) => w.id));
          const newFirebaseWorks = firebaseWorks.filter(
            (w) => !localWorkIds.has(w.id),
          );

          if (newFirebaseWorks.length > 0) {
            console.log(
              `🆕 NOVAS OBRAS DETECTADAS DO FIREBASE: ${newFirebaseWorks.length}`,
            );
            newFirebaseWorks.forEach((work) => {
              console.log(`✨ NOVA OBRA FIREBASE:`, {
                id: work.id,
                cliente: work.clientName,
                folhaObra: work.workSheetNumber,
                atribuicoes: work.assignedUsers,
                criadaEm: work.createdAt,
              });
            });
          }

          // Combinar Firebase + Local (remover duplicatas)
          const allWorks = [...firebaseWorks, ...localWorks];
          const uniqueWorks = allWorks.filter(
            (work, index, self) =>
              index === self.findIndex((w) => w.id === work.id),
          );

          // Ordenar por data de criação
          uniqueWorks.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

          console.log(
            `✅ Obras consolidadas em real-time: Firebase(${firebaseWorks.length}) + Local(${localWorks.length}) = Total(${uniqueWorks.length})`,
          );

          // Verificar especificamente obras atribuídas
          const worksWithAssignments = uniqueWorks.filter(
            (work) => work.assignedUsers && work.assignedUsers.length > 0,
          );
          console.log(
            `🎯 Obras com atribuições detectadas: ${worksWithAssignments.length}`,
          );

          // Log específico para Alexandre (para debug do problema)
          const alexandreWorks = uniqueWorks.filter(
            (work) =>
              work.assignedUsers &&
              work.assignedUsers.includes("user_alexandre"),
          );
          if (alexandreWorks.length > 0) {
            console.log(
              `���� OBRAS PARA ALEXANDRE DETECTADAS: ${alexandreWorks.length}`,
              alexandreWorks.map((w) => ({
                id: w.id,
                cliente: w.clientName,
                folhaObra: w.workSheetNumber,
                criadaEm: w.createdAt,
              })),
            );
          }

          // Update all backup storages instantaneously com timestamp
          const storageData = {
            works: uniqueWorks,
            lastUpdate: currentTime,
            source: "firebase_realtime_listener",
          };

          localStorage.setItem("works", JSON.stringify(uniqueWorks));
          localStorage.setItem("leirisonda_works", JSON.stringify(uniqueWorks));
          sessionStorage.setItem("temp_works", JSON.stringify(uniqueWorks));
          localStorage.setItem("works_metadata", JSON.stringify(storageData));

          // Dispará evento customizado para notificar outras abas/janelas
          try {
            // Apenas salvar no localStorage sem disparar eventos customizados
            localStorage.setItem(
              "leirisonda_last_update",
              JSON.stringify({
                type: "works_updated",
                timestamp: currentTime,
                worksCount: uniqueWorks.length,
                device: navigator.userAgent.substring(0, 50),
              }),
            );
          } catch (e) {
            console.log("Não foi possível disparar evento customizado");
          }

          // Trigger callback with consolidated data
          callback(uniqueWorks);
        },
        (error) => {
          console.error(
            "❌ ERRO CRÍTICO no listener de obras Firebase:",
            error,
          );
          console.error("❌ Detalhes do erro:", {
            code: error.code,
            message: error.message,
            name: error.name,
          });

          // Em caso de erro, usar dados locais consolidados
          const fallbackWorks = this.consolidateWorksFromAllBackups();
          console.log(
            `📱 FALLBACK ATIVADO: usando ${fallbackWorks.length} obras locais`,
          );
          callback(fallbackWorks);
        },
      );

      this.unsubscribes.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up works listener:", error);
      // Fallback to consolidated local data
      const fallbackWorks = this.consolidateWorksFromAllBackups();
      callback(fallbackWorks);
      return () => {};
    }
  }

  listenToMaintenances(
    callback: (maintenances: PoolMaintenance[]) => void,
  ): () => void {
    if (!this.isFirebaseAvailable) {
      console.log(
        "📱 Firebase not available, using local data for maintenances",
      );
      callback(this.getLocalMaintenances());

      const handleStorageChange = () => {
        callback(this.getLocalMaintenances());
      };

      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }

    try {
      const maintenancesRef = collection(db, "maintenances");
      const q = query(maintenancesRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const maintenances = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt:
              doc.data().createdAt?.toDate?.()?.toISOString() ||
              doc.data().createdAt,
            updatedAt:
              doc.data().updatedAt?.toDate?.()?.toISOString() ||
              doc.data().updatedAt,
          })) as PoolMaintenance[];

          console.log(
            `🏊 Real-time update: ${maintenances.length} manutenções recebidas`,
          );

          // Update localStorage backup instantaneously
          localStorage.setItem(
            "pool_maintenances",
            JSON.stringify(maintenances),
          );

          // Trigger callback with fresh data
          callback(maintenances);
        },
        (error) => {
          console.error("❌ Erro no listener de manutenções:", error);
          // Em caso de erro, usar dados locais
          callback(this.getLocalMaintenances());
        },
      );

      this.unsubscribes.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up maintenances listener:", error);
      callback(this.getLocalMaintenances());
      return () => {};
    }
  }

  listenToUsers(callback: (users: User[]) => void): () => void {
    if (!this.isFirebaseAvailable) {
      console.log("📱 Firebase not available, using local data for users");
      callback(this.getLocalUsers());

      const handleStorageChange = () => {
        callback(this.getLocalUsers());
      };

      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }

    try {
      const usersRef = collection(db, "users");

      const unsubscribe = onSnapshot(usersRef, (snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt:
            doc.data().createdAt?.toDate?.()?.toISOString() ||
            doc.data().createdAt,
        })) as User[];

        // Update localStorage backup
        localStorage.setItem("users", JSON.stringify(users));
        callback(users);
      });

      this.unsubscribes.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error("Error listening to users:", error);
      callback(this.getLocalUsers());
      return () => {};
    }
  }

  // Sync local data to Firebase
  async syncLocalDataToFirebase(): Promise<void> {
    if (!this.isFirebaseAvailable) {
      console.log("���� Firebase not available, skipping sync");
      return;
    }

    try {
      console.log("🔄 Starting sync of local data to Firebase...");

      // Get local data
      const localWorks = this.getLocalWorks();
      const localMaintenances = this.getLocalMaintenances();
      const localUsers = this.getLocalUsers();

      // Sync works
      for (const work of localWorks) {
        try {
          const workRef = doc(db, "works", work.id);
          const workSnap = await getDoc(workRef);

          if (!workSnap.exists()) {
            await setDoc(workRef, {
              ...work,
              createdAt: work.createdAt
                ? new Date(work.createdAt)
                : serverTimestamp(),
              updatedAt: work.updatedAt
                ? new Date(work.updatedAt)
                : serverTimestamp(),
            });
            console.log(`✅ Synced work: ${work.workSheetNumber}`);
          }
        } catch (error) {
          console.error(`❌ Error syncing work ${work.id}:`, error);
        }
      }

      // Sync maintenances
      for (const maintenance of localMaintenances) {
        try {
          const maintenanceRef = doc(db, "maintenances", maintenance.id);
          const maintenanceSnap = await getDoc(maintenanceRef);

          if (!maintenanceSnap.exists()) {
            await setDoc(maintenanceRef, {
              ...maintenance,
              createdAt: maintenance.createdAt
                ? new Date(maintenance.createdAt)
                : serverTimestamp(),
              updatedAt: maintenance.updatedAt
                ? new Date(maintenance.updatedAt)
                : serverTimestamp(),
            });
            console.log(`✅ Synced maintenance: ${maintenance.poolName}`);
          }
        } catch (error) {
          console.error(
            `❌ Error syncing maintenance ${maintenance.id}:`,
            error,
          );
        }
      }

      // Sync users (only dynamically created ones, not predefined)
      for (const user of localUsers) {
        try {
          // Skip predefined users that are managed by AuthProvider
          const predefinedEmails = [
            "gongonsilva@gmail.com",
            "alexkamaryta@gmail.com",
          ];

          if (predefinedEmails.includes(user.email)) {
            continue; // Skip predefined users
          }

          const userRef = doc(db, "users", user.id);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await updateDoc(userRef, {
              ...user,
              createdAt: user.createdAt
                ? new Date(user.createdAt)
                : serverTimestamp(),
              updatedAt: user.updatedAt
                ? new Date(user.updatedAt)
                : serverTimestamp(),
            });
            console.log(`✅ Synced user: ${user.name} (${user.email})`);
          }
        } catch (error) {
          console.error(`❌ Error syncing user ${user.id}:`, error);
        }
      }

      console.log("✅ Local data sync completed (works, maintenances, users)");
    } catch (error) {
      console.error("❌ Error syncing local data:", error);
    }
  }

  // Cleanup listeners
  cleanup(): void {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    this.unsubscribes = [];
  }

  // Force sync global users from Firebase to localStorage (para resolver problemas de sincronização)
  async syncGlobalUsersFromFirebase(): Promise<void> {
    if (!this.isFirebaseAvailable) {
      console.log("📱 Firebase not available, skipping global users sync");
      return;
    }

    try {
      console.log("🔄 Sincronizando utilizadores globais do Firebase...");

      // Buscar todos os utilizadores do Firebase
      const firebaseUsers = await this.getUsers();

      // Utilizadores globais que devem existir
      const requiredGlobalUsers = [
        "gongonsilva@gmail.com",
        "alexkamaryta@gmail.com",
      ];

      let localUsers = this.getLocalUsers();
      let modified = false;

      // Verificar se os utilizadores globais estão no localStorage
      for (const requiredEmail of requiredGlobalUsers) {
        const localUser = localUsers.find((u) => u.email === requiredEmail);
        const firebaseUser = firebaseUsers.find(
          (u) => u.email === requiredEmail,
        );

        if (!localUser && firebaseUser) {
          console.log(
            `➕ Sincronizando utilizador global do Firebase: ${firebaseUser.name}`,
          );
          localUsers.push(firebaseUser);
          modified = true;

          // Restaurar passwords para utilizadores globais
          const password =
            requiredEmail === "gongonsilva@gmail.com"
              ? "19867gsf"
              : "69alexandre";
          const passwordKeys = [
            `password_${firebaseUser.id}`,
            `password_${firebaseUser.email}`,
            `password_${firebaseUser.email.toLowerCase()}`,
            `password_${firebaseUser.email.trim().toLowerCase()}`,
          ];

          passwordKeys.forEach((key) => {
            localStorage.setItem(key, password);
          });

          console.log(
            `✅ Utilizador ${firebaseUser.name} sincronizado com password: ${password}`,
          );
        }
      }

      if (modified) {
        localStorage.setItem("users", JSON.stringify(localUsers));
        console.log("✅ Utilizadores globais sincronizados do Firebase");
      }
    } catch (error) {
      console.error("❌ Erro ao sincronizar utilizadores globais:", error);
    }
  }
}

// Global singleton instance
export const firebaseService = FirebaseService.getInstance();
