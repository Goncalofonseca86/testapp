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

        // Tentar carregar utilizador armazenado com tratamento defensivo
        try {
          const stored = localStorage.getItem("leirisonda_user");
          if (stored && mounted) {
            const parsedUser = JSON.parse(stored);

            // Validar se o objeto tem as propriedades essenciais
            if (parsedUser && parsedUser.email && parsedUser.name) {
              console.log("👤 UTILIZADOR CARREGADO:", parsedUser.email);
              setUser(parsedUser);
            } else {
              console.warn("⚠️ Dados de utilizador inválidos, a limpar...");
              localStorage.removeItem("leirisonda_user");
            }
          }
        } catch (parseError) {
          console.error(
            "❌ Erro ao fazer parse de utilizador, a limpar dados:",
            parseError,
          );
          try {
            localStorage.removeItem("leirisonda_user");
          } catch (clearError) {
            console.error("❌ Erro ao limpar dados de utilizador:", clearError);
          }
        }
      } catch (error) {
        console.error("❌ Erro na inicialização auth:", error);
        // Não quebrar, continuar com user = null
        // Tentar limpar dados corrompidos
        try {
          localStorage.removeItem("leirisonda_user");
          localStorage.removeItem("leirisonda_last_user");
        } catch (clearError) {
          console.error("❌ Erro ao limpar dados após falha:", clearError);
        }
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

        localStorage.setItem("leirisonda_user", JSON.stringify(loginUser));
        localStorage.setItem("leirisonda_last_user", globalUser.email); // Guardar último utilizador
        setUser(loginUser);
        console.log(`✅ ${globalUser.name.toUpperCase()} LOGIN SUCESSO`);
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
            localStorage.setItem(
              "leirisonda_user",
              JSON.stringify(dynamicUser),
            );
            localStorage.setItem("leirisonda_last_user", dynamicUser.email); // Guardar último utilizador
            setUser(dynamicUser);
            console.log(
              `✅ UTILIZADOR DINÂMICO ${dynamicUser.name.toUpperCase()} LOGIN SUCESSO`,
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
