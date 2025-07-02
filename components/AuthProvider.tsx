import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@shared/types";
import { firebaseService } from "@/services/FirebaseService";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isInitialized: boolean;
  getAllUsers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Utilizadores globais predefinidos que devem estar em todos os dispositivos
  const globalUsers = {
    "gongonsilva@gmail.com": {
      id: "admin_goncalo",
      email: "gongonsilva@gmail.com",
      name: "Gonçalo Fonseca",
      role: "admin" as const,
      password: "19867gsf",
      permissions: {
        canViewWorks: true,
        canCreateWorks: true,
        canEditWorks: true,
        canDeleteWorks: true,
        canViewMaintenance: true,
        canCreateMaintenance: true,
        canEditMaintenance: true,
        canDeleteMaintenance: true,
        canViewUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canViewReports: true,
        canExportData: true,
        canViewDashboard: true,
        canViewStats: true,
      },
    },
    "alexkamaryta@gmail.com": {
      id: "user_alexandre",
      email: "alexkamaryta@gmail.com",
      name: "Alexandre Fernandes",
      role: "user" as const,
      password: "69alexandre",
      permissions: {
        canViewWorks: true,
        canCreateWorks: false,
        canEditWorks: true,
        canDeleteWorks: false,
        canViewMaintenance: true,
        canCreateMaintenance: false,
        canEditMaintenance: true,
        canDeleteMaintenance: false,
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canViewReports: true,
        canExportData: false,
        canViewDashboard: true,
        canViewStats: true,
      },
    },
  };

  // Carrega utilizador do localStorage na inicialização
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (!mounted) return;

        console.log("🚀 AUTH INIT - Garantindo utilizadores globais...");

        // Verificar se localStorage está disponível antes de usar
        if (typeof Storage === "undefined") {
          console.warn("⚠️ localStorage não disponível, usando fallback");
          if (mounted) {
            setIsInitialized(true);
          }
          return;
        }

        ensureGlobalUsers();

        if (!mounted) return;

        // MÚLTIPLAS TENTATIVAS DE RECUPERAÇÃO DE SESSÃO
        let recoveredUser = null;

        // Tentativa 1: localStorage principal
        try {
          const stored = localStorage.getItem("leirisonda_user");
          if (stored) {
            const parsedUser = JSON.parse(stored);
            if (parsedUser && parsedUser.email && parsedUser.name) {
              console.log(
                "👤 UTILIZADOR CARREGADO (principal):",
                parsedUser.email,
              );
              recoveredUser = parsedUser;
            }
          }
        } catch (parseError) {
          console.warn("⚠️ Erro parse principal, tentando backup...");
        }

        // Tentativa 2: Backup de último utilizador
        if (!recoveredUser) {
          try {
            const lastUserEmail = localStorage.getItem("leirisonda_last_user");
            if (lastUserEmail) {
              console.log(
                "🔄 Tentando recuperar último utilizador:",
                lastUserEmail,
              );

              // Verificar se é utilizador global
              const globalUser = Object.values(globalUsers).find(
                (u) => u.email.toLowerCase() === lastUserEmail.toLowerCase(),
              );

              if (globalUser) {
                const loginUser: User = {
                  id: globalUser.id,
                  email: globalUser.email,
                  name: globalUser.name,
                  role: globalUser.role,
                  permissions: globalUser.permissions,
                  createdAt: new Date().toISOString(),
                };
                recoveredUser = loginUser;
                console.log(
                  "✅ Utilizador global recuperado:",
                  globalUser.name,
                );
              }
            }
          } catch (backupError) {
            console.warn("⚠️ Erro ao recuperar backup:", backupError);
          }
        }

        // Tentativa 3: Verificar se há obra acabada de criar (manter sessão)
        if (!recoveredUser) {
          try {
            const justCreatedWork = sessionStorage.getItem("just_created_work");
            const sessionUser = sessionStorage.getItem("temp_user_session");
            const workCreatedTimestamp = localStorage.getItem(
              "work_created_timestamp",
            );

            if (justCreatedWork === "true" || workCreatedTimestamp) {
              console.log(
                "🏗️ Detectada criação de obra recente, tentando recuperar sessão...",
              );

              // Primeira opção: SessionStorage
              if (sessionUser) {
                const tempUser = JSON.parse(sessionUser);
                if (tempUser && tempUser.email && tempUser.name) {
                  console.log(
                    "🛡️ Recuperando sessão via sessionStorage:",
                    tempUser.email,
                  );
                  recoveredUser = tempUser;
                }
              }

              // Segunda opção: Backup por ID de usuário
              if (!recoveredUser) {
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && key.startsWith("user_backup_")) {
                    try {
                      const backupUser = JSON.parse(
                        localStorage.getItem(key) || "",
                      );
                      if (backupUser && backupUser.email && backupUser.name) {
                        console.log(
                          "🛡️ Recuperando sessão via backup:",
                          backupUser.email,
                        );
                        recoveredUser = backupUser;
                        break;
                      }
                    } catch (error) {
                      console.warn("Erro ao processar backup:", key);
                    }
                  }
                }
              }

              // Terceira opção: Último usuário conhecido
              if (!recoveredUser) {
                const lastUserEmail = localStorage.getItem(
                  "leirisonda_last_user",
                );
                if (lastUserEmail) {
                  const globalUser = Object.values(globalUsers).find(
                    (u) =>
                      u.email.toLowerCase() === lastUserEmail.toLowerCase(),
                  );
                  if (globalUser) {
                    const loginUser: User = {
                      id: globalUser.id,
                      email: globalUser.email,
                      name: globalUser.name,
                      role: globalUser.role,
                      permissions: globalUser.permissions,
                      createdAt: new Date().toISOString(),
                    };
                    recoveredUser = loginUser;
                    console.log(
                      "🛡️ Recuperando sessão via último usuário:",
                      globalUser.name,
                    );
                  }
                }
              }
            }
          } catch (sessionError) {
            console.warn("⚠️ Erro ao recuperar sessão pós-obra:", sessionError);
          }
        }

        // Aplicar utilizador recuperado
        if (recoveredUser && mounted) {
          setUser(recoveredUser);

          // Garantir que está salvo corretamente
          localStorage.setItem(
            "leirisonda_user",
            JSON.stringify(recoveredUser),
          );
          sessionStorage.setItem(
            "temp_user_session",
            JSON.stringify(recoveredUser),
          );

          console.log("✅ SESSÃO RECUPERADA COM SUCESSO:", recoveredUser.email);
        } else if (mounted) {
          console.log("📝 Nenhuma sessão válida encontrada");
        }
      } catch (error) {
        console.error("❌ Erro na inicialização auth:", error);
        // Não quebrar, continuar com user = null
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    // Adicionar delay mínimo para garantir que DOM está pronto
    const timer = setTimeout(initializeAuth, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Garante que utilizadores globais estão presentes em todos os dispositivos
  const ensureGlobalUsers = () => {
    try {
      console.log("🔄 Verificando utilizadores globais...");

      // Verificar se localStorage está disponível
      if (typeof Storage === "undefined") {
        console.warn("⚠️ localStorage não disponível");
        return;
      }

      // Busca utilizadores existentes com fallback seguro
      let existingUsers = [];
      try {
        const storedUsers = localStorage.getItem("users");
        existingUsers = storedUsers ? JSON.parse(storedUsers) : [];
        if (!Array.isArray(existingUsers)) {
          existingUsers = [];
        }
      } catch (parseError) {
        console.warn("⚠️ Erro ao parse de users, reinicializando:", parseError);
        existingUsers = [];
      }

      let modified = false;

      // Verifica cada utilizador global
      Object.values(globalUsers).forEach((globalUser) => {
        const existingUser = existingUsers.find(
          (u: User) => u.email === globalUser.email,
        );

        if (!existingUser) {
          console.log(`➕ Adicionando utilizador global: ${globalUser.name}`);
          const newUser: User = {
            ...globalUser,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          delete (newUser as any).password; // Remove password do objeto user
          existingUsers.push(newUser);
          modified = true;

          // Armazenar password com múltiplas chaves
          const passwordKeys = [
            `password_${globalUser.id}`,
            `password_${globalUser.email}`,
            `password_${globalUser.email.toLowerCase()}`,
            `password_${globalUser.email.trim().toLowerCase()}`,
          ];

          passwordKeys.forEach((key) => {
            localStorage.setItem(key, globalUser.password);
          });

          console.log(
            `✅ Utilizador global ${globalUser.name} criado com password: ${globalUser.password}`,
          );
        } else {
          console.log(`✓ Utilizador global ${globalUser.name} já existe`);

          // Garante que as passwords estão presentes
          const passwordKeys = [
            `password_${globalUser.id}`,
            `password_${globalUser.email}`,
            `password_${globalUser.email.toLowerCase()}`,
            `password_${globalUser.email.trim().toLowerCase()}`,
          ];

          let hasPassword = false;
          passwordKeys.forEach((key) => {
            if (localStorage.getItem(key)) {
              hasPassword = true;
            }
          });

          if (!hasPassword) {
            console.log(`🔑 Restaurando password para ${globalUser.name}`);
            passwordKeys.forEach((key) => {
              localStorage.setItem(key, globalUser.password);
            });
          }
        }
      });

      if (modified) {
        localStorage.setItem("users", JSON.stringify(existingUsers));
        console.log("✅ Utilizadores globais sincronizados");
      }
    } catch (error) {
      console.error("❌ Erro ao garantir utilizadores globais:", error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("🔐 TENTATIVA LOGIN:", { email, password });
    setIsLoading(true);

    try {
      // Normalizar email
      const normalizedEmail = email.trim().toLowerCase();

      // Verificar utilizadores globais primeiro
      const globalUser = Object.values(globalUsers).find(
        (u) => u.email.toLowerCase() === normalizedEmail,
      );

      if (globalUser && globalUser.password === password) {
        const loginUser: User = {
          id: globalUser.id,
          email: globalUser.email,
          name: globalUser.name,
          role: globalUser.role,
          permissions: globalUser.permissions,
          createdAt: new Date().toISOString(),
        };

        // MÚLTIPLOS BACKUPS DE SESSÃO PARA ROBUSTEZ
        localStorage.setItem("leirisonda_user", JSON.stringify(loginUser));
        localStorage.setItem("leirisonda_last_user", globalUser.email);
        sessionStorage.setItem("temp_user_session", JSON.stringify(loginUser));
        localStorage.setItem(
          "user_backup_" + globalUser.id,
          JSON.stringify(loginUser),
        );

        // Backup adicional com timestamp
        localStorage.setItem("session_timestamp", new Date().toISOString());

        setUser(loginUser);
        console.log(
          `✅ ${globalUser.name.toUpperCase()} LOGIN SUCESSO COM BACKUP MÚLTIPLO`,
        );
        setIsLoading(false);
        return true;
      }

      // Verificar utilizadores criados dinamicamente
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const dynamicUser = users.find(
        (u: User) => u.email.toLowerCase() === normalizedEmail,
      );

      if (dynamicUser) {
        // Verificar password com múltiplas chaves
        const passwordKeys = [
          `password_${dynamicUser.id}`,
          `password_${dynamicUser.email}`,
          `password_${dynamicUser.email.toLowerCase()}`,
          `password_${dynamicUser.email.trim().toLowerCase()}`,
        ];

        for (const key of passwordKeys) {
          const storedPassword = localStorage.getItem(key);
          if (storedPassword === password) {
            // MÚLTIPLOS BACKUPS DE SESSÃO PARA ROBUSTEZ
            localStorage.setItem(
              "leirisonda_user",
              JSON.stringify(dynamicUser),
            );
            localStorage.setItem("leirisonda_last_user", dynamicUser.email);
            sessionStorage.setItem(
              "temp_user_session",
              JSON.stringify(dynamicUser),
            );
            localStorage.setItem(
              "user_backup_" + dynamicUser.id,
              JSON.stringify(dynamicUser),
            );

            // Backup adicional com timestamp
            localStorage.setItem("session_timestamp", new Date().toISOString());

            setUser(dynamicUser);
            console.log(
              `✅ UTILIZADOR DINÂMICO ${dynamicUser.name.toUpperCase()} LOGIN SUCESSO COM BACKUP MÚLTIPLO`,
            );
            setIsLoading(false);
            return true;
          }
        }
      }

      console.log("❌ CREDENCIAIS INVÁLIDAS");
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("❌ ERRO LOGIN:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("leirisonda_user");
    setUser(null);
    console.log("👋 LOGOUT");
  };

  const getAllUsers = (): User[] => {
    try {
      // Obter usuários globais predefinidos
      const globalUsersList = Object.values(globalUsers).map((globalUser) => ({
        id: globalUser.id,
        email: globalUser.email,
        name: globalUser.name,
        role: globalUser.role,
        permissions: globalUser.permissions,
        createdAt: new Date().toISOString(),
      }));

      // Obter usuários criados dinamicamente
      const dynamicUsers = JSON.parse(localStorage.getItem("users") || "[]");

      // Combinar e remover duplicatas
      const allUsers = [...globalUsersList];

      dynamicUsers.forEach((dynamicUser: User) => {
        const exists = allUsers.find(
          (user) => user.email === dynamicUser.email,
        );
        if (!exists) {
          allUsers.push(dynamicUser);
        }
      });

      return allUsers;
    } catch (error) {
      console.error("❌ Erro ao obter usuários:", error);
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, isInitialized, getAllUsers }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  try {
    const context = useContext(AuthContext);
    if (!context) {
      console.warn("⚠️ useAuth called outside AuthProvider - using fallback");
      // Return fallback context to prevent crashes
      return {
        user: null,
        login: async () => false,
        logout: () => {},
        isLoading: false,
        isInitialized: false,
        getAllUsers: () => [],
      };
    }
    return context;
  } catch (error) {
    console.error("❌ Error in useAuth:", error);
    // Return safe fallback
    return {
      user: null,
      login: async () => false,
      logout: () => {},
      isLoading: false,
      isInitialized: false,
      getAllUsers: () => [],
    };
  }
}
