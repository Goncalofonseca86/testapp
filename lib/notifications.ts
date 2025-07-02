import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
} from "firebase/messaging";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import app from "./firebase";

export interface NotificationPayload {
  title: string;
  body: string;
  type:
    | "new_work"
    | "work_assigned"
    | "work_updated"
    | "maintenance_assigned"
    | "general";
  workId?: string;
  maintenanceId?: string;
  assignedUserId?: string;
  createdBy?: string;
  urgency?: "low" | "normal" | "high";
}

export interface UserToken {
  token: string;
  userId: string;
  deviceInfo: string;
  lastUsed: string;
  isActive: boolean;
}

class NotificationService {
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.initializeMessaging();
  }

  private async initializeMessaging() {
    try {
      // Verificar se o ambiente suporta FCM
      if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        console.log("📱 Service Workers não suportados");
        return;
      }

      this.messaging = getMessaging(app);
      this.isSupported = true;

      console.log("🔥 Firebase Cloud Messaging inicializado");

      // Registrar service worker para notificações
      await this.registerServiceWorker();

      // Configurar listener para mensagens em foreground
      this.setupForegroundMessageListener();
    } catch (error) {
      console.error("❌ Erro ao inicializar Firebase Messaging:", error);
      this.isSupported = false;
    }
  }

  private async registerServiceWorker() {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );
        console.log("🔧 Service Worker registrado:", registration);

        // Listener para mensagens do service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "NOTIFICATION_CLICK") {
            console.log(
              "🔔 Notificação clicada - navegando para:",
              event.data.url,
            );
            window.location.href = event.data.url;
          }
        });
      }
    } catch (error) {
      console.error("❌ Erro ao registrar service worker:", error);
    }
  }

  private setupForegroundMessageListener() {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log("📱 Mensagem recebida em foreground:", payload);

      // Mostrar notificação do browser mesmo em foreground
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(
          payload.notification?.title || "Leirisonda",
          {
            body: payload.notification?.body || "Nova notificação",
            icon: "https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=png&width=192",
            badge:
              "https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=png&width=72",
            tag: payload.data?.type || "leirisonda",
            data: payload.data,
            requireInteraction: true,
            silent: false,
          },
        );

        notification.onclick = () => {
          notification.close();

          // Navegar baseado no tipo de notificação
          let targetUrl = "/dashboard";
          if (payload.data?.type === "new_work" && payload.data?.workId) {
            targetUrl = `/works/${payload.data.workId}`;
          } else if (
            payload.data?.type === "work_assigned" &&
            payload.data?.workId
          ) {
            targetUrl = `/works/${payload.data.workId}`;
          }

          window.focus();
          window.location.href = targetUrl;
        };

        // Auto-close após 10 segundos
        setTimeout(() => notification.close(), 10000);
      }
    });
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (!this.isSupported) {
        console.log("📱 Notificações push não suportadas neste dispositivo");
        return false;
      }

      if (!("Notification" in window)) {
        console.log("📱 Notificações não suportadas pelo browser");
        return false;
      }

      let permission = Notification.permission;

      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission === "granted") {
        console.log("✅ Permissão de notificações concedida");
        return true;
      } else {
        console.log("❌ Permissão de notificações negada");
        return false;
      }
    } catch (error) {
      console.error("❌ Erro ao solicitar permissão:", error);
      return false;
    }
  }

  async getRegistrationToken(userId: string): Promise<string | null> {
    try {
      if (!this.isSupported || !this.messaging) {
        console.log("📱 FCM não suportado");
        return null;
      }

      const permission = await this.requestPermission();
      if (!permission) {
        return null;
      }

      const vapidKey =
        "BMqzPGS8rC4Q8Qr4yJrVQGf9Y2O5xF8hU7vT6nB3kR2jL4mN9pQ1sA7eH5iW0dC6f";

      const token = await getToken(this.messaging, {
        vapidKey: vapidKey,
      });

      if (token) {
        console.log("🔑 Token FCM obtido:", token.substring(0, 20) + "...");
        this.currentToken = token;

        // Salvar token no Firestore
        await this.saveTokenToFirestore(token, userId);

        return token;
      } else {
        console.log("❌ Não foi possível obter token FCM");
        return null;
      }
    } catch (error) {
      console.error("❌ Erro ao obter token FCM:", error);
      return null;
    }
  }

  private async saveTokenToFirestore(token: string, userId: string) {
    try {
      const userTokenData: UserToken = {
        token,
        userId,
        deviceInfo: navigator.userAgent.substring(0, 100),
        lastUsed: new Date().toISOString(),
        isActive: true,
      };

      // Salvar na coleção user_tokens
      await setDoc(doc(db, "user_tokens", token), userTokenData);

      // Adicionar token à lista do usuário
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
        lastTokenUpdate: new Date().toISOString(),
      });

      console.log("💾 Token FCM salvo no Firestore");
    } catch (error) {
      console.error("❌ Erro ao salvar token no Firestore:", error);
    }
  }

  async removeToken(userId: string) {
    try {
      if (this.currentToken) {
        // Remover da coleção user_tokens
        await updateDoc(doc(db, "user_tokens", this.currentToken), {
          isActive: false,
          removedAt: new Date().toISOString(),
        });

        // Remover da lista do usuário
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          fcmTokens: arrayRemove(this.currentToken),
        });

        console.log("🗑️ Token FCM removido");
        this.currentToken = null;
      }
    } catch (error) {
      console.error("❌ Erro ao remover token:", error);
    }
  }

  async sendNotificationToUser(
    targetUserId: string,
    payload: NotificationPayload,
  ): Promise<boolean> {
    try {
      // Buscar tokens do usuário
      const userRef = doc(db, "users", targetUserId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log("❌ Usuário não encontrado:", targetUserId);
        return false;
      }

      const userData = userDoc.data();
      const fcmTokens = userData.fcmTokens || [];

      if (fcmTokens.length === 0) {
        console.log("📱 Usuário não tem tokens FCM:", targetUserId);
        return false;
      }

      // Criar payload para FCM
      const fcmPayload = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          type: payload.type,
          workId: payload.workId || "",
          maintenanceId: payload.maintenanceId || "",
          assignedUserId: payload.assignedUserId || "",
          createdBy: payload.createdBy || "",
          urgency: payload.urgency || "normal",
          timestamp: new Date().toISOString(),
        },
        tokens: fcmTokens,
      };

      // Aqui você enviaria para o servidor Firebase Functions ou backend
      // Como estamos numa PWA, vamos simular salvando na Firestore para outros dispositivos lerem
      await setDoc(doc(db, "notifications", `${targetUserId}_${Date.now()}`), {
        ...fcmPayload,
        targetUserId,
        createdAt: new Date().toISOString(),
        status: "pending",
      });

      console.log("📤 Notificação criada para:", targetUserId);
      return true;
    } catch (error) {
      console.error("❌ Erro ao enviar notificação:", error);
      return false;
    }
  }

  async sendWorkNotification(
    assignedUserIds: string[],
    workData: {
      clientName: string;
      workSheetNumber: string;
      address: string;
      type: string;
      createdBy: string;
      workId: string;
    },
  ) {
    try {
      console.log("📤 Enviando notificações de obra para:", assignedUserIds);

      for (const userId of assignedUserIds) {
        const payload: NotificationPayload = {
          title: "🏗️ Nova obra atribuída",
          body: `${workData.clientName} - ${workData.address}`,
          type: "work_assigned",
          workId: workData.workId,
          assignedUserId: userId,
          createdBy: workData.createdBy,
          urgency: "normal",
        };

        await this.sendNotificationToUser(userId, payload);
      }

      console.log("✅ Notificações de obra enviadas");
    } catch (error) {
      console.error("❌ Erro ao enviar notificações de obra:", error);
    }
  }

  async sendMaintenanceNotification(
    assignedUserIds: string[],
    maintenanceData: {
      clientName: string;
      poolLocation: string;
      type: string;
      createdBy: string;
      maintenanceId: string;
    },
  ) {
    try {
      console.log(
        "📤 Enviando notificações de manutenção para:",
        assignedUserIds,
      );

      for (const userId of assignedUserIds) {
        const payload: NotificationPayload = {
          title: "🏊‍♂️ Nova manutenção atribuída",
          body: `${maintenanceData.clientName} - ${maintenanceData.poolLocation}`,
          type: "maintenance_assigned",
          maintenanceId: maintenanceData.maintenanceId,
          assignedUserId: userId,
          createdBy: maintenanceData.createdBy,
          urgency: "normal",
        };

        await this.sendNotificationToUser(userId, payload);
      }

      console.log("✅ Notificações de manutenção enviadas");
    } catch (error) {
      console.error("❌ Erro ao enviar notificações de manutenção:", error);
    }
  }

  getNotificationStatus() {
    return {
      isSupported: this.isSupported,
      hasPermission: Notification.permission === "granted",
      hasToken: !!this.currentToken,
      permission: Notification.permission,
    };
  }
}

// Instância singleton
export const notificationService = new NotificationService();

// Hook React para usar notificações
export function useNotifications() {
  return notificationService;
}
