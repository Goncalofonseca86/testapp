import React, { useState, useEffect } from "react";
import { Bell, BellRing, BellOff, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/components/AuthProvider";
import { notificationService } from "@/lib/notifications";

export function NotificationSetup() {
  const { user } = useAuth();
  const [notificationStatus, setNotificationStatus] = useState({
    isSupported: false,
    hasPermission: false,
    hasToken: false,
    permission: "default" as NotificationPermission,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    // Verificar status das notificações
    const status = notificationService.getNotificationStatus();
    setNotificationStatus(status);

    // Mostrar setup se notificações são suportadas mas não configuradas
    if (status.isSupported && !status.hasPermission && user) {
      const hasShownSetup = localStorage.getItem(
        `notification_setup_shown_${user.id}`,
      );
      if (!hasShownSetup) {
        setShowSetup(true);
      }
    }

    // Se já tem permissão, configurar automaticamente
    if (
      status.isSupported &&
      status.hasPermission &&
      !status.hasToken &&
      user
    ) {
      handleEnableNotifications();
    }
  }, [user]);

  const handleEnableNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const token = await notificationService.getRegistrationToken(user.id);

      if (token) {
        console.log("✅ Notificações configuradas com sucesso");
        setSetupComplete(true);
        setShowSetup(false);

        // Marcar como configurado
        localStorage.setItem(`notification_setup_complete_${user.id}`, "true");
        localStorage.setItem(`notification_setup_shown_${user.id}`, "true");

        // Atualizar status
        const newStatus = notificationService.getNotificationStatus();
        setNotificationStatus(newStatus);
      } else {
        throw new Error("Não foi possível obter token de notificação");
      }
    } catch (error) {
      console.error("❌ Erro ao configurar notificações:", error);
      alert(
        "Erro ao configurar notificações. Verifique as permissões do browser.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissSetup = () => {
    if (user) {
      localStorage.setItem(`notification_setup_shown_${user.id}`, "true");
    }
    setShowSetup(false);
  };

  const handleTestNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🔔 Teste Leirisonda", {
        body: "As suas notificações estão a funcionar correctamente!",
        icon: "https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=png&width=192",
        badge:
          "https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=png&width=72",
        tag: "test",
        requireInteraction: false,
      });
    }
  };

  // Não mostrar se não é suportado ou se usuário não está logado
  if (!notificationStatus.isSupported || !user) {
    return null;
  }

  // Setup completo - mostrar apenas se completou agora
  if (setupComplete) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <Check className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <span>
              ✅ Notificações configuradas com sucesso! Será notificado sobre
              novas obras atribuídas.
            </span>
            <Button
              onClick={handleTestNotification}
              variant="outline"
              size="sm"
              className="ml-4 border-green-300 text-green-700 hover:bg-green-100"
            >
              Testar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Setup inicial
  if (showSetup) {
    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BellRing className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-900">
                Activar Notificações Push
              </CardTitle>
              <CardDescription className="text-blue-700">
                Receba notificações instantâneas quando lhe forem atribuídas
                novas obras
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="text-sm text-blue-700">
              <p className="mb-2">
                🔔 <strong>Benefícios das notificações:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Receba alertas instantâneos de novas obras</li>
                <li>Seja notificado quando obras lhe forem atribuídas</li>
                <li>Mantenha-se actualizado mesmo com a app fechada</li>
                <li>Melhore a coordenação da equipa</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <BellRing className="w-4 h-4 mr-2" />
                {isLoading ? "A configurar..." : "Activar Notificações"}
              </Button>

              <Button
                onClick={handleDismissSetup}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <X className="w-4 h-4 mr-2" />
                Mais tarde
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Status indicator - apenas se já tem permissão
  if (notificationStatus.hasPermission) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          {notificationStatus.hasToken ? (
            <>
              <Bell className="w-4 h-4 text-green-600" />
              <span className="text-green-700">Notificações activas</span>
              <Button
                onClick={handleTestNotification}
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700 h-6 px-2"
              >
                Testar
              </Button>
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-700">
                Notificações com problemas
              </span>
              <Button
                onClick={handleEnableNotifications}
                variant="ghost"
                size="sm"
                className="text-yellow-600 hover:text-yellow-700 h-6 px-2"
                disabled={isLoading}
              >
                {isLoading ? "A reparar..." : "Reparar"}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
