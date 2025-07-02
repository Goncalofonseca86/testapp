import React, { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { Work } from "@shared/types";
import { Bell, User, Clock, MapPin } from "lucide-react";

export function WorkNotifications() {
  const { user } = useAuth();
  const { works } = useFirebaseSync();
  const { toast } = useToast();

  // Ref para guardar as obras já processadas para notificações
  const processedWorks = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!user || !works || works.length === 0) {
      return;
    }

    // Na primeira carga, marcar todas as obras existentes como processadas
    if (isInitialLoad.current) {
      works.forEach((work) => {
        processedWorks.current.add(work.id);
      });
      isInitialLoad.current = false;
      console.log(`📱 Inicial: ${works.length} obras marcadas como conhecidas`);
      return;
    }

    // Verificar se há novas obras criadas por outros utilizadores
    const newWorks = works.filter((work) => {
      // Só processar obras que não foram processadas antes
      if (processedWorks.current.has(work.id)) {
        return false;
      }

      // Só notificar sobre obras criadas por outros utilizadores
      if (work.createdBy === user.id || work.createdBy === user.email) {
        return false;
      }

      // Verificar se a obra foi criada recentemente (últimos 5 minutos)
      const workDate = new Date(work.createdAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - workDate.getTime()) / (1000 * 60);

      return diffMinutes <= 5; // Só obras dos últimos 5 minutos
    });

    if (newWorks.length > 0) {
      console.log(
        `🔔 ${newWorks.length} novas obras detectadas para notificação`,
      );

      newWorks.forEach((work) => {
        // Marcar como processada
        processedWorks.current.add(work.id);

        // Determinar quem criou a obra
        let creatorName = "Outro utilizador";
        if (work.createdBy) {
          // Tentar identificar o criador
          if (
            work.createdBy === "admin_goncalo" ||
            work.createdBy === "gongonsilva@gmail.com"
          ) {
            creatorName = "Gonçalo";
          } else if (
            work.createdBy === "user_alexandre" ||
            work.createdBy === "alexkamaryta@gmail.com"
          ) {
            creatorName = "Alexandre";
          }
        }

        // Mostrar notificação toast
        toast({
          title: (
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>Nova obra criada!</span>
            </div>
          ),
          description: (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-gray-500" />
                <span className="font-medium">{work.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600 truncate">{work.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-gray-500">Por {creatorName}</span>
              </div>
              <div className="text-xs text-blue-600 font-medium">
                {work.workSheetNumber}
              </div>
            </div>
          ),
          duration: 8000, // 8 segundos
        });

        console.log(
          `🔔 Notificação enviada para obra: ${work.clientName} (${work.workSheetNumber})`,
        );
      });
    }
  }, [works, user, toast]);

  // Listener para eventos de storage (cross-tab)
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === "leirisonda_last_sync_event" && event.newValue) {
        try {
          const syncEvent = JSON.parse(event.newValue);

          if (syncEvent.type === "new_work_created" && user) {
            console.log(
              "🔔 Evento de nova obra detectado via storage:",
              syncEvent,
            );

            // Só notificar se não foi o próprio utilizador que criou
            const currentUserIds = [user.id, user.email];
            if (!currentUserIds.includes(syncEvent.createdBy)) {
              // Verificar se já foi notificado
              if (!processedWorks.current.has(syncEvent.workId)) {
                processedWorks.current.add(syncEvent.workId);

                // Notificação simples para obras criadas em outras abas
                toast({
                  title: (
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-green-600" />
                      <span>Nova obra sincronizada!</span>
                    </div>
                  ),
                  description: (
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{syncEvent.clientName}</div>
                      <div className="text-gray-500">
                        Criada em outro dispositivo
                      </div>
                    </div>
                  ),
                  duration: 5000,
                });
              }
            }
          }
        } catch (error) {
          console.warn("Erro ao processar evento de storage:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, [user, toast]);

  // Listener para eventos customizados (same-tab)
  useEffect(() => {
    const handleNewWorkEvent = (event: CustomEvent) => {
      if (user) {
        console.log("🔔 Evento de nova obra detectado:", event.detail);

        const eventData = event.detail;
        const currentUserIds = [user.id, user.email];

        // Só notificar se não foi o próprio utilizador que criou
        if (!currentUserIds.includes(eventData.createdBy)) {
          // Verificar se já foi notificado
          if (!processedWorks.current.has(eventData.workId)) {
            processedWorks.current.add(eventData.workId);

            toast({
              title: (
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-600" />
                  <span>Nova obra em tempo real!</span>
                </div>
              ),
              description: (
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{eventData.clientName}</div>
                  <div className="text-gray-500">Criada agora mesmo</div>
                </div>
              ),
              duration: 6000,
            });
          }
        }
      }
    };

    window.addEventListener(
      "leirisonda_new_work",
      handleNewWorkEvent as EventListener,
    );
    return () =>
      window.removeEventListener(
        "leirisonda_new_work",
        handleNewWorkEvent as EventListener,
      );
  }, [user, toast]);

  // Este componente não renderiza nada - apenas gere notificações
  return null;
}
