import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  Users,
  Calendar,
  Activity,
  BarChart3,
  Eye,
  Waves,
  Droplets,
  Building,
  Wrench,
  Search,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { Work, DashboardStats } from "@shared/types";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export function Dashboard() {
  console.log("🏠 Dashboard component iniciando...");

  // PROTEÇÃO MÁXIMA: Try-catch para contextos
  let user,
    navigate,
    works,
    maintenances,
    isOnline,
    isSyncing,
    lastSync,
    syncData;

  try {
    const authContext = useAuth();
    user = authContext.user;
    console.log("✅ Auth context carregado:", { hasUser: !!user });
  } catch (authError) {
    console.error("❌ Erro no auth context:", authError);
    user = null;
  }

  try {
    navigate = useNavigate();
    console.log("✅ Navigate hook carregado");
  } catch (navError) {
    console.error("❌ Erro no navigate hook:", navError);
    navigate = () => console.warn("Navigate não disponível");
  }

  try {
    const firebaseContext = useFirebaseSync();
    works = firebaseContext.works || [];
    maintenances = firebaseContext.maintenances || [];
    isOnline = firebaseContext.isOnline ?? true;
    isSyncing = firebaseContext.isSyncing ?? false;
    lastSync = firebaseContext.lastSync;
    syncData = firebaseContext.syncData || (() => Promise.resolve());
    console.log("✅ Firebase context carregado:", {
      worksCount: works.length,
      maintenancesCount: maintenances.length,
    });
  } catch (firebaseError) {
    console.error("❌ Erro no firebase context:", firebaseError);
    works = [];
    maintenances = [];
    isOnline = false;
    isSyncing = false;
    lastSync = undefined;
    syncData = () => Promise.resolve();
  }
  const [stats, setStats] = useState<DashboardStats>({
    totalWorks: 0,
    pendingWorks: 0,
    inProgressWorks: 0,
    completedWorks: 0,
    remainingWorkSheets: 0,
    workSheetsPending: 0,
  });
  const [recentWorks, setRecentWorks] = useState<Work[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Work[]>([]);

  const navigateToWorks = (status?: string) => {
    try {
      console.log("🔗 Navegando para works com status:", status);
      if (status) {
        navigate(`/works?status=${status}`);
      } else {
        navigate("/works");
      }
    } catch (navError) {
      console.error("❌ Erro na navegação para works:", navError);
      try {
        // Fallback para window.location
        const url = status ? `/works?status=${status}` : "/works";
        window.location.href = url;
      } catch (locationError) {
        console.error("❌ Erro no fallback de navegação:", locationError);
      }
    }
  };

  const navigateToWorksSheets = (type: "pending" | "completed") => {
    try {
      console.log("📋 Navegando para worksheets:", type);
      navigate(`/works?worksheet=${type}`);
    } catch (navError) {
      console.error("❌ Erro na navegação para worksheets:", navError);
      try {
        window.location.href = `/works?worksheet=${type}`;
      } catch (locationError) {
        console.error(
          "❌ Erro no fallback de navegação para worksheets:",
          locationError,
        );
      }
    }
  };

  useEffect(() => {
    try {
      console.log("📊 Carregando dados do dashboard...");
      loadDashboardData();

      // Limpar marcação de obra criada quando Dashboard carrega
      if (sessionStorage.getItem("just_created_work") === "true") {
        console.log("🧹 Limpando marcação de obra criada");
        sessionStorage.removeItem("just_created_work");
      }
    } catch (error) {
      console.error("❌ Erro ao carregar dados do dashboard:", error);
      // Não fazer throw - continuar sem quebrar
    }
  }, [works, maintenances]); // React to Firebase data changes

  useEffect(() => {
    if (searchTerm.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const performSearch = () => {
    try {
      console.log("🔍 Realizando pesquisa:", searchTerm);
      // Use Firebase synced data instead of localStorage directly
      const worksList = works || [];

      const filtered = worksList.filter(
        (work) =>
          work.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          work.workSheetNumber
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          work.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          work.contact?.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      setSearchResults(filtered.slice(0, 5)); // Limit to 5 results
    } catch (error) {
      console.error("❌ Erro na pesquisa:", error);
      setSearchResults([]);
    }
  };

  const loadDashboardData = () => {
    try {
      console.log("📊 Processando dados para dashboard...");
      // Use Firebase synced data instead of localStorage directly
      const worksList = works || [];

      // Calculate stats with error protection
      const totalWorks = worksList.length || 0;
      const pendingWorks =
        worksList.filter((w) => w?.status === "pendente").length || 0;
      const inProgressWorks =
        worksList.filter((w) => w?.status === "em_progresso").length || 0;
      const completedWorks =
        worksList.filter((w) => w?.status === "concluida").length || 0;

      // Calculate work sheets pending (not completed)
      const workSheetsPending =
        worksList.filter((w) => !w?.workSheetCompleted).length || 0;

      setStats({
        totalWorks,
        pendingWorks,
        inProgressWorks,
        completedWorks,
        remainingWorkSheets: 0, // Not used anymore
        workSheetsPending,
      });

      // Get recent works - priorizar obras atribuídas ao usuário logado
      const assignedWorks = worksList.filter(
        (work) =>
          work?.assignedUsers && work.assignedUsers.includes(user?.id || ""),
      );
      const otherWorks = worksList.filter(
        (work) =>
          !work?.assignedUsers || !work.assignedUsers.includes(user?.id || ""),
      );

      // Ordenar por data (mais recentes primeiro)
      const sortedAssignedWorks = assignedWorks.sort(
        (a, b) =>
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime(),
      );
      const sortedOtherWorks = otherWorks.sort(
        (a, b) =>
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime(),
      );

      // Combinar: obras atribuídas primeiro, depois outras (máximo 5 total)
      const recentWorksList = [
        ...sortedAssignedWorks,
        ...sortedOtherWorks,
      ].slice(0, 5);
      setRecentWorks(recentWorksList);

      console.log("✅ Dashboard data carregado:", {
        totalWorks,
        pendingWorks,
        inProgressWorks,
        completedWorks,
      });
    } catch (error) {
      console.error("❌ Erro ao processar dados do dashboard:", error);
      // Set safe defaults in case of error
      setStats({
        totalWorks: 0,
        pendingWorks: 0,
        inProgressWorks: 0,
        completedWorks: 0,
        remainingWorkSheets: 0,
        workSheetsPending: 0,
      });
      setRecentWorks([]);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pendente":
        return { label: "Pendente", className: "badge-pending" };
      case "em_progresso":
        return { label: "Em Progresso", className: "badge-progress" };
      case "concluida":
        return { label: "Concluída", className: "badge-completed" };
      default:
        return { label: status, className: "badge-pending" };
    }
  };

  const getWorkTypeLabel = (type: string) => {
    switch (type) {
      case "piscina":
        return "Piscina";
      case "manutencao":
        return "Manutenção";
      case "avaria":
        return "Avaria";
      case "montagem":
        return "Montagem";
      default:
        return type;
    }
  };

  const getWorkTypeIcon = (type: string) => {
    switch (type) {
      case "piscina":
        return Droplets;
      case "manutencao":
        return Wrench;
      case "avaria":
        return Activity;
      case "montagem":
        return Building;
      default:
        return FileText;
    }
  };

  const getNextMaintenanceDate = (maintenance: any) => {
    if (!maintenance.interventions || maintenance.interventions.length === 0) {
      return "A definir";
    }

    const lastIntervention = maintenance.interventions.sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];

    if (!lastIntervention?.nextMaintenanceDate) return "A definir";

    return format(
      new Date(lastIntervention.nextMaintenanceDate),
      "dd/MM/yyyy",
      { locale: pt },
    );
  };

  const getDaysUntilMaintenance = (maintenance: any) => {
    if (!maintenance.interventions || maintenance.interventions.length === 0) {
      return 999; // Far future for sorting
    }

    const lastIntervention = maintenance.interventions.sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];

    if (!lastIntervention?.nextMaintenanceDate) return 999;

    const today = new Date();
    const nextDate = new Date(lastIntervention.nextMaintenanceDate);
    const diffTime = nextDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUpcomingMaintenances = () => {
    if (!maintenances) return [];

    // Filter only active maintenances that have a next maintenance date
    const activeMaintances = maintenances.filter(
      (m: any) =>
        m.status === "active" && getNextMaintenanceDate(m) !== "A definir",
    );

    // Sort by days until maintenance (closest first, including overdue)
    return activeMaintances
      .sort((a: any, b: any) => {
        const daysA = getDaysUntilMaintenance(a);
        const daysB = getDaysUntilMaintenance(b);
        return daysA - daysB;
      })
      .slice(0, 5); // Show only next 5 maintenances
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-leirisonda-fade">
      {/* Classy & Simple Header */}
      <div className="relative bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-3xl border border-gray-200/50 shadow-lg backdrop-blur-sm p-8 mb-8 overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/40 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100/30 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-20 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl p-2">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2F9862202d056a426996e6178b9981c1c7?format=webp&width=800"
                  alt="Leirisonda Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-1"></div>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-light text-gray-900">
                Olá,{" "}
                <span className="font-semibold text-gray-800">
                  {user?.name}
                </span>
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(), "EEEE, dd 'de' MMMM", { locale: pt })}
                  </span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{format(new Date(), "HH:mm")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status indicator */}
          <div className="text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
              ></div>
              <span>{isOnline ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/works?status=pendente"
          className="stat-card-leirisonda stat-card-danger hover-leirisonda block"
        >
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-6 h-6 text-red-600" />
            <span className="text-2xl lg:text-3xl font-bold text-gray-900">
              {stats.pendingWorks}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Pendentes
          </h3>
          <p className="text-xs text-gray-600">Necessitam atenção</p>
        </Link>

        <Link
          to="/works?status=em_progresso"
          className="stat-card-leirisonda stat-card-warning hover-leirisonda block"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <span className="text-2xl lg:text-3xl font-bold text-gray-900">
              {stats.inProgressWorks}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Em Progresso
          </h3>
          <p className="text-xs text-gray-600">A decorrer</p>
        </Link>

        <Link
          to="/works?status=concluida"
          className="stat-card-leirisonda stat-card-success hover-leirisonda block"
        >
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-2xl lg:text-3xl font-bold text-gray-900">
              {stats.completedWorks}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Concluídas
          </h3>
          <p className="text-xs text-gray-600">Finalizadas</p>
        </Link>

        <Link
          to="/works?worksheet=pending"
          className="stat-card-leirisonda stat-card-danger hover-leirisonda block"
        >
          <div className="flex items-center justify-between mb-3">
            <FileText className="w-6 h-6 text-red-600" />
            <span className="text-2xl lg:text-3xl font-bold text-gray-900">
              {stats.workSheetsPending}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Folhas por Fazer
          </h3>
          <p className="text-xs text-gray-600">Por preencher</p>
        </Link>
      </div>

      {/* Obras Atribuídas */}
      {user &&
        (() => {
          const assignedWorks = works.filter(
            (work) =>
              work.assignedUsers && work.assignedUsers.includes(user.id),
          );

          // Debug log para Gonçalo
          if (user.email === "gongonsilva@gmail.com") {
            console.log(
              `🎯 Debug Dashboard - Obras Atribuídas para ${user.name}:`,
              {
                totalWorks: works.length,
                userID: user.id,
                assignedWorks: assignedWorks.length,
                worksWithAssignments: works.filter(
                  (w) => w.assignedUsers && w.assignedUsers.length > 0,
                ).length,
                assignedWorksList: assignedWorks.map((w) => ({
                  id: w.id,
                  cliente: w.clientName,
                  folhaObra: w.workSheetNumber,
                  atribuidas: w.assignedUsers,
                })),
              },
            );
          }

          return (
            assignedWorks.length > 0 && (
              <div className="w-full mb-6">
                <div className="card-leirisonda">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Suas Obras Atribuídas ({assignedWorks.length})
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      asChild
                      className="hover-leirisonda"
                    >
                      <Link to={`/works?assignedTo=${user.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Todas
                      </Link>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {assignedWorks
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .slice(0, 3)
                      .map((work) => {
                        const statusInfo = getStatusInfo(work.status);
                        return (
                          <Link
                            key={work.id}
                            to={`/works/${work.id}`}
                            className="block p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {work.workSheetNumber}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${statusInfo.className}`}
                                  >
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  {work.clientName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(
                                    new Date(work.createdAt),
                                    "dd/MM/yyyy",
                                    {
                                      locale: pt,
                                    },
                                  )}
                                </p>
                              </div>
                              <div className="text-blue-600">
                                <Activity className="w-4 h-4" />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              </div>
            )
          );
        })()}

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Recent Works */}
        <div className="w-full">
          <div className="card-leirisonda">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Todas as Obras Recentes
                </h3>
              </div>
              <Button variant="outline" asChild className="hover-leirisonda">
                <Link to="/works">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todas
                </Link>
              </Button>
            </div>

            {recentWorks.length === 0 ? (
              <div className="section-leirisonda text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma obra registada
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  {user?.permissions.canCreateWorks
                    ? "Comece por criar a sua primeira obra."
                    : "Não existem obras registadas no sistema."}
                </p>
                {user?.permissions.canCreateWorks && (
                  <button
                    className="btn-leirisonda"
                    onClick={() => navigate("/create-work")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Obra
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentWorks.map((work) => {
                  const statusInfo = getStatusInfo(work.status);
                  const WorkIcon = getWorkTypeIcon(work.type);
                  return (
                    <div
                      key={work.id}
                      className="section-leirisonda hover-leirisonda cursor-pointer"
                      onClick={() => navigate(`/works/${work.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <WorkIcon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {work.clientName}
                              </h4>
                              <span className={statusInfo.className}>
                                {statusInfo.label}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                {getWorkTypeLabel(work.type)}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-600">
                              <div className="truncate">
                                <span className="font-medium">Folha:</span>{" "}
                                {work.workSheetNumber}
                              </div>
                              <div>
                                <span className="font-medium">Data:</span>{" "}
                                {format(
                                  new Date(work.createdAt),
                                  "dd/MM/yyyy",
                                  {
                                    locale: pt,
                                  },
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manutenções Próximas */}
          <div className="card-leirisonda">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Waves className="w-4 h-4 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Manutenç��es Próximas
                </h3>
              </div>
              <Button variant="outline" asChild className="hover-leirisonda">
                <Link to="/pool-maintenance">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todas
                </Link>
              </Button>
            </div>

            {getUpcomingMaintenances().length === 0 ? (
              <div className="section-leirisonda text-center py-8">
                <Waves className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma manutenção agendada
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Não há manutenções de piscinas programadas para breve.
                </p>
                <button
                  className="btn-leirisonda-secondary"
                  onClick={() => navigate("/pool-maintenance")}
                >
                  <Waves className="w-4 h-4 mr-2" />
                  Ver Manutenções
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {getUpcomingMaintenances().map((maintenance) => {
                  const nextDate = getNextMaintenanceDate(maintenance);
                  const daysUntil = getDaysUntilMaintenance(maintenance);
                  const isOverdue = daysUntil < 0;
                  const isUrgent = daysUntil <= 7 && daysUntil >= 0;

                  return (
                    <div
                      key={maintenance.id}
                      className={`section-leirisonda hover-leirisonda cursor-pointer border-l-4 ${
                        isOverdue
                          ? "border-red-500"
                          : isUrgent
                            ? "border-orange-500"
                            : "border-teal-500"
                      }`}
                      onClick={() => navigate(`/maintenance/${maintenance.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                              isOverdue
                                ? "bg-red-100"
                                : isUrgent
                                  ? "bg-orange-100"
                                  : "bg-teal-100"
                            }`}
                          >
                            <Waves
                              className={`w-4 h-4 ${
                                isOverdue
                                  ? "text-red-600"
                                  : isUrgent
                                    ? "text-orange-600"
                                    : "text-teal-600"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {maintenance.poolName}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isOverdue
                                    ? "bg-red-100 text-red-800 border border-red-200"
                                    : isUrgent
                                      ? "bg-orange-100 text-orange-800 border border-orange-200"
                                      : "bg-teal-100 text-teal-800 border border-teal-200"
                                }`}
                              >
                                {isOverdue
                                  ? "Em atraso"
                                  : isUrgent
                                    ? "Urgente"
                                    : "Agendada"}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">
                                  {maintenance.location}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span className="font-medium">
                                  {nextDate === "A definir"
                                    ? nextDate
                                    : isOverdue
                                      ? `${Math.abs(daysUntil)} dias atraso`
                                      : daysUntil === 0
                                        ? "Hoje"
                                        : daysUntil === 1
                                          ? "Amanhã"
                                          : `Em ${daysUntil} dias`}
                                </span>
                              </div>
                            </div>
                            {nextDate !== "A definir" && (
                              <div className="text-xs text-gray-500 mt-1">
                                Próxima: {nextDate}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6 w-full">
          {/* Quick Actions */}
          <div className="card-leirisonda">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ações Rápidas
              </h3>
            </div>
            <div className="space-y-3">
              {user?.permissions.canCreateWorks && (
                <Button
                  variant="outline"
                  className="w-full justify-start hover-leirisonda h-auto py-3"
                  asChild
                >
                  <Link to="/create-work">
                    <Plus className="w-4 h-4 mr-3" />
                    Nova Obra
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start hover-leirisonda h-auto py-3"
                asChild
              >
                <Link to="/pool-maintenance">
                  <Droplets className="w-4 h-4 mr-3" />
                  Manutenção Piscinas
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover-leirisonda h-auto py-3"
                asChild
              >
                <Link to="/works">
                  <FileText className="w-4 h-4 mr-3" />
                  Todas as Obras
                </Link>
              </Button>
              {user?.role === "admin" && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start hover-leirisonda h-auto py-3"
                    asChild
                  >
                    <Link to="/create-user">
                      <Users className="w-4 h-4 mr-3" />
                      Novo Utilizador
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start hover-leirisonda h-auto py-3 border-blue-200 bg-blue-50 hover:bg-blue-100"
                    asChild
                  >
                    <Link to="/sync-diagnostic">
                      <RefreshCw className="w-4 h-4 mr-3 text-blue-600" />
                      <span className="text-blue-700">
                        Diagnóstico de Sincronização
                      </span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Search Works */}
          <div className="card-leirisonda">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Pesquisar Obras
              </h3>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cliente, folha obra, morada..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-leirisonda text-sm"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((work) => {
                    const statusInfo = getStatusInfo(work.status);
                    const WorkIcon = getWorkTypeIcon(work.type);
                    return (
                      <div
                        key={work.id}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/works/${work.id}`)}
                      >
                        <div className="flex items-center space-x-2">
                          <WorkIcon className="w-4 h-4 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {work.clientName}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.className}`}
                              >
                                {statusInfo.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {work.workSheetNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {searchTerm && searchResults.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Nenhuma obra encontrada
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
