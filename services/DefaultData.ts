import { User, Work, PoolMaintenance, UserPermissions } from "@shared/types";

const defaultAdminPermissions: UserPermissions = {
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
};

const defaultUserPermissions: UserPermissions = {
  canViewWorks: true,
  canCreateWorks: false,
  canEditWorks: false,
  canDeleteWorks: false,
  canViewMaintenance: true,
  canCreateMaintenance: false,
  canEditMaintenance: false,
  canDeleteMaintenance: false,
  canViewUsers: false,
  canCreateUsers: false,
  canEditUsers: false,
  canDeleteUsers: false,
  canViewReports: false,
  canExportData: false,
  canViewDashboard: true,
  canViewStats: true,
};

export class DefaultDataService {
  static initializeDefaultUsers(): void {
    const existingUsers = localStorage.getItem("users");

    if (!existingUsers || JSON.parse(existingUsers).length === 0) {
      console.log("🔧 Initializing default users...");

      const defaultUsers: User[] = [
        {
          id: "admin_goncalo",
          email: "gongonsilva@gmail.com",
          name: "Gonçalo Fonseca",
          role: "admin",
          permissions: defaultAdminPermissions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "user_alexandre",
          email: "alexkamaryta@gmail.com",
          name: "Alexandre Fernandes",
          role: "user",
          permissions: {
            ...defaultUserPermissions,
            canEditWorks: true,
            canEditMaintenance: true,
            canViewReports: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      localStorage.setItem("users", JSON.stringify(defaultUsers));

      // Store passwords for default users with multiple keys for compatibility
      defaultUsers.forEach((user) => {
        let password = "";
        switch (user.email) {
          case "gongonsilva@gmail.com":
            password = "19867gsf";
            break;
          case "alexkamaryta@gmail.com":
            password = "69alexandre";
            break;
        }

        if (password) {
          // Multiple keys to ensure compatibility
          const passwordKeys = [
            `password_${user.id}`,
            `password_${user.email}`,
            `password_${user.email.toLowerCase()}`,
            `password_${user.email.trim().toLowerCase()}`,
          ];

          passwordKeys.forEach((key) => {
            localStorage.setItem(key, password);
          });

          console.log(`✅ Password stored for ${user.name}: ${password}`);
        }
      });

      console.log("✅ Default users and passwords created successfully");
    }
  }

  static initializeDefaultWorks(): void {
    const existingWorks = localStorage.getItem("works");

    if (!existingWorks || JSON.parse(existingWorks).length === 0) {
      console.log("🔧 Initializing sample works...");

      const sampleWorks: Work[] = [
        {
          id: crypto.randomUUID(),
          title: "Piscina Villa Marina",
          location: "Vieira de Leiria",
          date: new Date().toISOString(),
          startTime: "09:00",
          endTime: "17:00",
          clientName: "Maria Silva",
          clientPhone: "910123456",
          clientEmail: "maria@email.com",
          type: "piscina",
          status: "completed",
          priority: "medium",
          description:
            "Construção de piscina exterior 8x4m com sistema de filtração completo",
          technicians: ["João Santos", "Pedro Costa"],
          vehicles: ["LC-12-34"],
          materials: "Betão, azulejos, sistema filtração",
          budget: 25000,
          finalCost: 24500,
          photos: [],
          observations: "Obra concluída com sucesso. Cliente muito satisfeito.",
          workPerformed:
            "Escavação, betonagem, revestimento, instalação sistema filtração, enchimento e testes",
          workSheetCompleted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      localStorage.setItem("works", JSON.stringify(sampleWorks));
      console.log("✅ Sample works created successfully");
    }
  }

  static initializeDefaultMaintenances(): void {
    const existingMaintenances = localStorage.getItem("pool_maintenances");

    if (
      !existingMaintenances ||
      JSON.parse(existingMaintenances).length === 0
    ) {
      console.log("🔧 Initializing sample maintenances...");

      const sampleMaintenances: PoolMaintenance[] = [
        {
          id: crypto.randomUUID(),
          poolName: "Piscina Magnolia",
          location: "Vieira de Leiria",
          clientName: "MICHEL Duarte",
          clientPhone: "913456789",
          clientEmail: "michel@email.com",
          poolType: "outdoor",
          waterCubicage: "48m³",
          status: "active",
          photos: [],
          interventions: [
            {
              id: crypto.randomUUID(),
              maintenanceId: "",
              date: new Date().toISOString(),
              timeStart: "09:00",
              timeEnd: "11:00",
              technicians: ["Técnico Leirisonda"],
              vehicles: ["LC-45-67"],
              waterValues: {
                ph: 7.2,
                salt: 3200,
                temperature: 24,
                chlorine: 1.5,
                bromine: 0,
                alkalinity: 120,
                hardness: 250,
                stabilizer: 50,
              },
              chemicalProducts: [
                {
                  productName: "Cloro líquido",
                  quantity: 2,
                  unit: "l",
                },
              ],
              workPerformed: {
                filtros: true,
                preFiltro: true,
                filtroAreiaVidro: false,
                enchimentoAutomatico: false,
                linhaAgua: true,
                limpezaFundo: true,
                limpezaParedes: true,
                limpezaSkimmers: true,
                verificacaoEquipamentos: true,
                outros: "Verificação bomba e sistema automático",
              },
              problems: [],
              nextMaintenanceDate: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              photos: [],
              observations:
                "Manutenção completa realizada. Qualidade da água excelente.",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          observations: "Piscina em excelente estado. Manutenção regular.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Set maintenance ID in interventions
      sampleMaintenances[0].interventions[0].maintenanceId =
        sampleMaintenances[0].id;

      localStorage.setItem(
        "pool_maintenances",
        JSON.stringify(sampleMaintenances),
      );
      console.log("✅ Sample maintenances created successfully");
    }
  }

  static initializeAllDefaults(): void {
    console.log("🚀 Initializing default data for Leirisonda system...");

    this.initializeDefaultUsers();
    this.initializeDefaultWorks();
    this.initializeDefaultMaintenances();

    console.log("✅ All default data initialized successfully");
    console.log("📋 Available users:");
    console.log("• gongonsilva@gmail.com / 19867gsf (Admin)");
    console.log("• alexkamaryta@gmail.com / 69alexandre (User)");
  }

  static forceCleanUserSystem(): void {
    console.log("🧹 Forçando limpeza completa do sistema de utilizadores...");

    // Remove todos os dados de utilizadores
    localStorage.removeItem("users");
    localStorage.removeItem("leirisonda_user");

    // Remove todas as passwords antigas
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (key.startsWith("password_")) {
        localStorage.removeItem(key);
      }
    });

    // Força criação dos 2 utilizadores corretos
    const correctUsers: User[] = [
      {
        id: "admin_goncalo",
        email: "gongonsilva@gmail.com",
        name: "Gonçalo Fonseca",
        role: "admin",
        permissions: defaultAdminPermissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user_alexandre",
        email: "alexkamaryta@gmail.com",
        name: "Alexandre Fernandes",
        role: "user",
        permissions: {
          ...defaultUserPermissions,
          canEditWorks: true,
          canEditMaintenance: true,
          canViewReports: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    localStorage.setItem("users", JSON.stringify(correctUsers));

    // Armazenar passwords com todas as chaves possíveis
    correctUsers.forEach((user) => {
      let password = "";
      switch (user.email) {
        case "gongonsilva@gmail.com":
          password = "19867gsf";
          break;
        case "alexkamaryta@gmail.com":
          password = "69alexandre";
          break;
      }

      if (password) {
        // Múltiplas chaves para garantir compatibilidade
        const passwordKeys = [
          `password_${user.id}`,
          `password_${user.email}`,
          `password_${user.email.toLowerCase()}`,
          `password_${user.email.trim().toLowerCase()}`,
        ];

        passwordKeys.forEach((key) => {
          localStorage.setItem(key, password);
        });

        console.log(`✅ Password definida para ${user.name}: ${password}`);
      }
    });

    console.log("✅ Sistema de utilizadores limpo e reconfigurado!");
    console.log("📋 Utilizadores disponíveis:");
    console.log("• gongonsilva@gmail.com / 19867gsf (Admin)");
    console.log(
      "• alexkamaryta@gmail.com / 69alexandre (User com permissões estendidas)",
    );
  }

  static resetAllData(): void {
    if (confirm("⚠️ ATENÇÃO: Isto vai apagar todos os dados! Continuar?")) {
      localStorage.removeItem("users");
      localStorage.removeItem("works");
      localStorage.removeItem("pool_maintenances");
      localStorage.removeItem("leirisonda_backups");

      console.log("🗑️ All data reset");

      // Re-initialize defaults
      this.initializeAllDefaults();

      alert("✅ Sistema reiniciado com dados de exemplo!");
      window.location.reload();
    }
  }
}

// Force clean and initialize correct users
console.log("🧹 FORÇA: Limpando sistema de utilizadores...");
DefaultDataService.forceCleanUserSystem();
DefaultDataService.initializeAllDefaults();
