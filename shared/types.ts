export interface UserPermissions {
  // Obras
  canViewWorks: boolean;
  canCreateWorks: boolean;
  canEditWorks: boolean;
  canDeleteWorks: boolean;

  // Manutenção
  canViewMaintenance: boolean;
  canCreateMaintenance: boolean;
  canEditMaintenance: boolean;
  canDeleteMaintenance: boolean;

  // Utilizadores (apenas admin)
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;

  // Relatórios
  canViewReports: boolean;
  canExportData: boolean;

  // Dashboard
  canViewDashboard: boolean;
  canViewStats: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  permissions: UserPermissions;
  createdAt: string;
}

export interface Work {
  id: string;
  workSheetNumber: string; // Folha obra Leirisonda
  type: "piscina" | "manutencao" | "avaria" | "montagem";
  clientName: string;
  address: string;
  contact: string;
  entryTime: string;
  exitTime?: string;
  status: "pendente" | "em_progresso" | "concluida";
  vehicles: string[]; // Viaturas utilizadas
  technicians: string[]; // Técnicos que efetuaram o trabalho
  assignedUsers: string[]; // IDs dos usuários a quem a obra foi atribuída
  photos: WorkPhoto[];
  observations: string;
  workPerformed: string; // Trabalho realizado
  workSheetCompleted: boolean; // Se a folha de obra foi preenchida/feita
  createdAt: string;
  updatedAt: string;
}

export interface WorkPhoto {
  id: string;
  url: string;
  filename: string;
  uploadedAt: string;
}

export interface PoolMaintenance {
  id: string;
  poolName: string;
  location: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  poolType: "outdoor" | "indoor" | "spa" | "olympic";
  waterCubicage: string; // Ex: "50m��" ou "50000L"
  lastMaintenanceDate?: string;
  interventions: MaintenanceIntervention[];
  status: "active" | "inactive" | "seasonal";
  photos: PoolPhoto[];
  observations: string;
  createdAt: string;
  updatedAt: string;
}

export interface PoolPhoto {
  id: string;
  url: string;
  filename: string;
  description: string;
  category: "general" | "equipment" | "issues" | "before" | "after";
  uploadedAt: string;
}

export interface MaintenanceIntervention {
  id: string;
  maintenanceId: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  technicians: string[];
  vehicles: string[];
  waterValues: {
    ph: number;
    salt: number;
    orp: number;
    temperature: number;
    chlorine: number;
    bromine: number;
    alkalinity: number;
    hardness: number;
    stabilizer: number;
  };
  chemicalProducts: {
    productName: string;
    quantity: number;
    unit: string; // kg, l, g, etc
  }[];
  workPerformed: {
    filtros: boolean;
    preFiltro: boolean;
    filtroAreiaVidro: boolean;
    enchimentoAutomatico: boolean;
    linhaAgua: boolean;
    limpezaFundo: boolean;
    limpezaParedes: boolean;
    limpezaSkimmers: boolean;
    verificacaoEquipamentos: boolean;
    outros: string;
  };
  problems: {
    description: string;
    severity: "low" | "medium" | "high";
    resolved: boolean;
  }[];
  nextMaintenanceDate?: string;
  photos: InterventionPhoto[];
  observations: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterventionPhoto {
  id: string;
  url: string;
  filename: string;
  description: string;
  uploadedAt: string;
}

export interface DashboardStats {
  totalWorks: number;
  pendingWorks: number;
  inProgressWorks: number;
  completedWorks: number;
  remainingWorkSheets: number;
  workSheetsPending: number; // Folhas de obra por fazer
}

export type WorkStatus = "pendente" | "em_progresso" | "concluida";

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface CreateWorkData {
  workSheetNumber: string;
  type: "piscina" | "manutencao" | "avaria" | "montagem";
  clientName: string;
  address: string;
  contact: string;
  entryTime: string;
  exitTime?: string;
  status: "pendente" | "em_progresso" | "concluida";
  vehicles: string[];
  technicians: string[];
  assignedUsers: string[];
  photos: File[];
  observations: string;
  workPerformed: string;
  workSheetCompleted: boolean;
}
