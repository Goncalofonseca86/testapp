import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Search, Plus, Filter, Eye } from "lucide-react";
import { Work } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { useAuth } from "@/components/AuthProvider";

const statusOptions = [
  { value: "all", label: "Todos os Estados" },
  { value: "pendente", label: "Pendentes" },
  { value: "em_progresso", label: "Em Progresso" },
  { value: "concluida", label: "Concluídas" },
];

const typeOptions = [
  { value: "all", label: "Todos os Tipos" },
  { value: "piscina", label: "Piscina" },
  { value: "manutencao", label: "Manutenção" },
  { value: "avaria", label: "Avaria" },
  { value: "montagem", label: "Montagem" },
];

const worksheetOptions = [
  { value: "all", label: "Todas as Folhas" },
  { value: "pending", label: "Por Fazer" },
  { value: "completed", label: "Feitas" },
];

export function WorksList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { works } = useFirebaseSync();
  const { user } = useAuth();
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all",
  );
  const [typeFilter, setTypeFilter] = useState<string>(
    searchParams.get("type") || "all",
  );
  const [worksheetFilter, setWorksheetFilter] = useState<string>(
    searchParams.get("worksheet") || "all",
  );
  const [assignedToFilter, setAssignedToFilter] = useState<string>(
    searchParams.get("assignedTo") || "",
  );

  // React to URL parameter changes
  useEffect(() => {
    const status = searchParams.get("status") || "all";
    const type = searchParams.get("type") || "all";
    const worksheet = searchParams.get("worksheet") || "all";
    const search = searchParams.get("search") || "";
    const assignedTo = searchParams.get("assignedTo") || "";

    setStatusFilter(status);
    setTypeFilter(type);
    setWorksheetFilter(worksheet);
    setSearchTerm(search);
    setAssignedToFilter(assignedTo);
  }, [searchParams]);

  useEffect(() => {
    console.log("🔍 WORKSLIST DEBUG:", {
      totalWorks: works?.length || 0,
      worksData: works?.slice(0, 3).map((w) => ({
        id: w.id,
        cliente: w.clientName,
        folha: w.workSheetNumber,
      })),
    });
    filterWorks();
    updateURL();
  }, [
    works,
    searchTerm,
    statusFilter,
    typeFilter,
    worksheetFilter,
    assignedToFilter,
  ]);

  const updateURL = () => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (typeFilter && typeFilter !== "all") {
      params.set("type", typeFilter);
    }
    if (worksheetFilter && worksheetFilter !== "all") {
      params.set("worksheet", worksheetFilter);
    }
    if (searchTerm) {
      params.set("search", searchTerm);
    }
    if (assignedToFilter) {
      params.set("assignedTo", assignedToFilter);
    }
    setSearchParams(params);
  };

  const filterWorks = () => {
    let filtered = [...(works || [])];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (work) =>
          work.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          work.workSheetNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          work.address.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by status
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((work) => work.status === statusFilter);
    }

    // Filter by type
    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter((work) => work.type === typeFilter);
    }

    // Filter by worksheet status
    if (worksheetFilter && worksheetFilter !== "all") {
      if (worksheetFilter === "pending") {
        filtered = filtered.filter((work) => !work.workSheetCompleted);
      } else if (worksheetFilter === "completed") {
        filtered = filtered.filter((work) => work.workSheetCompleted);
      }
    }

    // Filter by assigned user
    if (assignedToFilter) {
      filtered = filtered.filter(
        (work) =>
          work.assignedUsers && work.assignedUsers.includes(assignedToFilter),
      );
    }

    // Sort by most recent first
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    setFilteredWorks(filtered);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pendente":
        return { label: "Pendente", color: "text-red-600", bg: "bg-red-100" };
      case "em_progresso":
        return {
          label: "Em Progresso",
          color: "text-orange-600",
          bg: "bg-orange-100",
        };
      case "concluida":
        return {
          label: "Concluída",
          color: "text-green-600",
          bg: "bg-green-100",
        };
      default:
        return { label: status, color: "text-gray-600", bg: "bg-gray-100" };
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Obras</h1>
          <p className="mt-2 text-gray-600">
            {assignedToFilter
              ? "Obras atribuídas ao usuário selecionado"
              : "Visualizar e gerir todas as obras"}
          </p>
        </div>

        <div className="flex gap-2">
          {user?.permissions.canCreateWorks && (
            <Button asChild>
              <Link to="/create-work">
                <Plus className="w-4 h-4 mr-2" />
                Nova Obra
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Pesquisar por cliente, folha obra ou morada..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={worksheetFilter} onValueChange={setWorksheetFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por folha obra" />
            </SelectTrigger>
            <SelectContent>
              {worksheetOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Obras Encontradas ({filteredWorks.length})
          </h3>
        </div>

        {filteredWorks.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma obra encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {user?.permissions.canCreateWorks
                ? "Tente ajustar os filtros de pesquisa ou criar uma nova obra."
                : "Tente ajustar os filtros de pesquisa."}
            </p>
            {user?.permissions.canCreateWorks && (
              <Button asChild>
                <Link to="/create-work">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Nova Obra
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredWorks.map((work) => {
              const statusInfo = getStatusInfo(work.status);
              return (
                <div
                  key={work.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {work.clientName}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                          {getWorkTypeLabel(work.type)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            work.workSheetCompleted
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {work.workSheetCompleted
                            ? "Folha Feita"
                            : "Folha por Fazer"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Folha Obra:</span>{" "}
                          {work.workSheetNumber}
                        </div>
                        <div>
                          <span className="font-medium">Contacto:</span>{" "}
                          {work.contact}
                        </div>
                        <div>
                          <span className="font-medium">Entrada:</span>{" "}
                          {format(
                            new Date(work.entryTime),
                            "dd/MM/yyyy HH:mm",
                            {
                              locale: pt,
                            },
                          )}
                        </div>
                        {work.exitTime && (
                          <div>
                            <span className="font-medium">Saída:</span>{" "}
                            {format(
                              new Date(work.exitTime),
                              "dd/MM/yyyy HH:mm",
                              {
                                locale: pt,
                              },
                            )}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Técnicos:</span>{" "}
                          {work.technicians.join(", ") || "Não atribuídos"}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Morada:</span>{" "}
                        {work.address}
                      </p>

                      {work.assignedUsers && work.assignedUsers.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Atribuída a:</span>{" "}
                          {work.assignedUsers
                            .map((userId) => {
                              // Buscar nome do usuário pelos IDs
                              const assignedUser =
                                user?.role === "admin"
                                  ? [
                                      {
                                        id: "1",
                                        name: "Gonçalo Fonseca",
                                        email: "gongonsilva@gmail.com",
                                      },
                                      {
                                        id: "2",
                                        name: "Alexandre Fernandes",
                                        email: "alexkamaryta@gmail.com",
                                      },
                                    ].find(
                                      (u) =>
                                        u.id === userId ||
                                        userId.includes(u.email),
                                    )
                                  : null;
                              return assignedUser ? assignedUser.name : userId;
                            })
                            .join(", ")}
                        </p>
                      )}

                      {work.observations && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Observações:</span>{" "}
                          {work.observations}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/works/${work.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
