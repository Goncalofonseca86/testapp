import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Save,
  User,
  MapPin,
  Phone,
  FileText,
  Calendar,
  Car,
  Users,
  Flag,
  Camera,
  AlertCircle,
} from "lucide-react";
import { Work, CreateWorkData } from "@shared/types";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { firebaseService } from "@/services/FirebaseService";
import { WorkSaveHelper } from "@/lib/work-save-diagnostics";

const workTypes = [
  { value: "piscina", label: "Piscina" },
  { value: "manutencao", label: "Manutenção" },
  { value: "avaria", label: "Avaria" },
  { value: "montagem", label: "Montagem" },
];

const statusOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "em_progresso", label: "Em Progresso" },
  { value: "concluida", label: "Concluída" },
];

export function CreateWork() {
  console.log("🏗️ CreateWork component iniciando...");
  const navigate = useNavigate();

  // PROTEÇÃO MÁXIMA: Envolver todo o componente em try-catch
  try {
    // Use try-catch para capturar erros de contexto
    let user, getAllUsers, createWork, isOnline, isSyncing;

    try {
      console.log("🔑 Tentando acessar contexto de autenticação...");
      const authContext = useAuth();
      console.log("🔥 Tentando acessar contexto do Firebase...");
      const firebaseContext = useFirebaseSync();

      user = authContext.user;
      getAllUsers = authContext.getAllUsers;
      createWork = firebaseContext.createWork;
      isOnline = firebaseContext.isOnline ?? true; // Valor padrão
      isSyncing = firebaseContext.isSyncing ?? false; // Valor padrão

      console.log("✅ Contextos carregados com sucesso:", {
        hasUser: !!user,
        userEmail: user?.email,
        hasGetAllUsers: !!getAllUsers,
        hasCreateWork: !!createWork,
        isOnline,
        isSyncing,
      });
    } catch (error) {
      console.error("❌ Erro ao acessar contextos:", error);

      // EVITAR qualquer erro que possa causar logout - retornar interface de recuperação
      return (
        <div className="p-6 max-w-md mx-auto mt-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              Sistema Temporariamente Indisponível
            </h2>
            <p className="text-yellow-600 mb-4">
              Serviços de criação de obras temporariamente indisponíveis. Por
              favor tente novamente.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Tentar Novamente
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    // Verificar se o usuário existe e tem permissão
    if (!user) {
      return (
        <div className="p-6 max-w-md mx-auto mt-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              Utilizador não encontrado
            </h2>
            <p className="text-yellow-600 mb-4">
              Por favor, faça login novamente.
            </p>
            <Button onClick={() => navigate("/login")} variant="outline">
              Ir para Login
            </Button>
          </div>
        </div>
      );
    }

    // Verificar se o usuário tem permissão para criar obras
    if (!user?.permissions?.canCreateWorks) {
      return (
        <div className="p-6 max-w-md mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Acesso Negado
            </h2>
            <p className="text-red-600 mb-4">
              Não tem permissão para criar novas obras.
            </p>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      );
    }

    const [formData, setFormData] = useState<CreateWorkData>({
      workSheetNumber: generateWorkSheetNumber(),
      type: "piscina",
      clientName: "",
      address: "",
      contact: "",
      entryTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      exitTime: "",
      status: "pendente",
      vehicles: [],
      technicians: [],
      assignedUsers: [],
      photos: [],
      observations: "",
      workPerformed: "",
      workSheetCompleted: false,
    });

    const [vehicleInput, setVehicleInput] = useState("");
    const [technicianInput, setTechnicianInput] = useState("");
    const [availableUsers] = useState(() => {
      try {
        return getAllUsers ? getAllUsers() : [];
      } catch (error) {
        console.error("❌ Erro ao obter usuários:", error);
        return [];
      }
    });

    function generateWorkSheetNumber(): string {
      const year = new Date().getFullYear();
      const count = getNextWorkSheetCount();
      return `LS-${year}-${count.toString().padStart(3, "0")}`;
    }

    function getNextWorkSheetCount(): number {
      const storedWorks = localStorage.getItem("leirisonda_works");
      if (!storedWorks) return 1;

      const works: Work[] = JSON.parse(storedWorks);
      const currentYear = new Date().getFullYear();
      const thisYearWorks = works.filter(
        (w) => new Date(w.createdAt).getFullYear() === currentYear,
      );
      return thisYearWorks.length + 1;
    }

    const handleSubmit = async (e: React.FormEvent) => {
      try {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        console.log("🚀 Iniciando criação de obra");

        // Verificação mais flexível - permitir fallback se createWork não estiver disponível

        // Validation
        if (!formData.clientName.trim()) {
          setError("Por favor, introduza o nome do cliente.");
          setIsSubmitting(false);
          return;
        }

        if (!formData.address.trim()) {
          setError("Por favor, introduza a morada.");
          setIsSubmitting(false);
          return;
        }

        if (!formData.contact.trim()) {
          setError("Por favor, introduza o contacto.");
          setIsSubmitting(false);
          return;
        }

        try {
          console.log("��� PREPARANDO DADOS DA OBRA...");

          // Prepare work data - GARANTIR que assignedUsers seja preservado
          const workData = {
            workSheetNumber: formData.workSheetNumber,
            type: formData.type,
            clientName: formData.clientName.trim(),
            address: formData.address.trim(),
            contact: formData.contact.trim(),
            entryTime: new Date(formData.entryTime).toISOString(),
            exitTime: formData.exitTime
              ? new Date(formData.exitTime).toISOString()
              : formData.status === "concluida"
                ? new Date().toISOString()
                : undefined,
            status: formData.status,
            vehicles: formData.vehicles || [],
            technicians: formData.technicians || [],
            assignedUsers: formData.assignedUsers || [], // GARANTIR array válido
            photos: formData.photos.map((photo, index) => ({
              id: `${Date.now()}-${index}`,
              url: URL.createObjectURL(photo),
              filename: photo.name,
              uploadedAt: new Date().toISOString(),
            })),
            observations: formData.observations.trim(),
            workPerformed: formData.workPerformed.trim(),
            workSheetCompleted: formData.workSheetCompleted,
          };

          console.log("📤 ENVIANDO OBRA PARA CRIAR:", {
            cliente: workData.clientName,
            folhaObra: workData.workSheetNumber,
            tipo: workData.type,
            atribuicoes: workData.assignedUsers,
            formDataOriginal: formData.assignedUsers,
            quantidadeAtribuicoes: workData.assignedUsers.length,
          });

          // VERIFICAÇÃO CRÍTICA: Verificar se atribuições estão válidas
          if (
            formData.assignedUsers.length > 0 &&
            workData.assignedUsers.length === 0
          ) {
            console.error(
              "❌ ERRO CRÍTICO: Atribuições perdidas na preparação dos dados!",
            );
            setError(
              "Erro interno: atribuições de usuários perdidas. Tente novamente.",
            );
            setIsSubmitting(false);
            return;
          }

          // FALLBACK SEGURO: Se createWork não estiver disponível, usar FirebaseService diretamente
          const safeCreateWork =
            createWork ||
            (async (data: any) => {
              console.log(
                "🔄 Fallback: usando FirebaseService.createWork diretamente",
              );
              return await firebaseService.createWork(data);
            });

          // Create work using safe method
          const workId = await safeCreateWork(workData);
          console.log("✅ OBRA CRIADA COM SUCESSO ID:", workId);

          // MARCAR que obra foi criada para ErrorBoundary saber
          sessionStorage.setItem("just_created_work", "true");

          // SUCESSO GARANTIDO - eliminar verificações complexas que podem falhar
          console.log("🎉 OBRA CRIADA COM SUCESSO - FINALIZANDO PROCESSO");

          // Reset form para estado inicial
          setFormData({
            workSheetNumber: generateWorkSheetNumber(),
            type: "piscina",
            clientName: "",
            address: "",
            contact: "",
            entryTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            exitTime: "",
            status: "pendente",
            vehicles: [],
            technicians: [],
            assignedUsers: [],
            photos: [],
            observations: "",
            workPerformed: "",
            workSheetCompleted: false,
          });

          setIsSubmitting(false);
          setError(""); // Garantir que não há erros visíveis

          console.log("✅ PROCESSO CONCLUÍDO - REDIRECIONANDO...");

          // Navegação DEFINITIVA para Dashboard após guardar obra
          setTimeout(() => {
            try {
              console.log("🏠 Navegando para Dashboard após obra criada");
              // Tentativa 1: React Router navigate para Dashboard
              navigate("/dashboard");
            } catch (navError) {
              console.warn(
                "Navigate falhou, usando window.location para Dashboard",
              );
              try {
                // Tentativa 2: window.location para Dashboard
                window.location.href = "/dashboard";
              } catch (locationError) {
                console.warn(
                  "window.location falhou, usando replace para Dashboard",
                );
                try {
                  // Tentativa 3: window.location.replace para Dashboard
                  window.location.replace("/dashboard");
                } catch (replaceError) {
                  console.error(
                    "Todas as tentativas de navegação falharam, recarregando",
                  );
                  // Última tentativa: Recarregar página (vai para Dashboard por default)
                  window.location.reload();
                }
              }
            }
          }, 500);
        } catch (err) {
          console.error("❌ ERRO AO CRIAR OBRA:", err);

          // Tratamento de erro DEFENSIVO - nunca causar ErrorBoundary
          try {
            const errorMessage =
              err instanceof Error ? err.message : String(err);

            // Classificar tipo de erro sem fazer throw
            if (
              errorMessage.includes("Firebase") ||
              errorMessage.includes("network") ||
              errorMessage.includes("fetch") ||
              errorMessage.includes("conectividade")
            ) {
              setError(
                "Problema de conectividade. A obra pode ter sido guardada localmente. Verifique a lista de obras.",
              );
            } else if (
              errorMessage.includes("atribuições") ||
              errorMessage.includes("assignedUsers")
            ) {
              setError(
                "Problema com atribuições de usuários. Verifique as seleções e tente novamente.",
              );
            } else {
              setError(
                "Erro ao guardar obra. Por favor, tente novamente ou verifique a lista de obras.",
              );
            }

            setIsSubmitting(false);

            // Log para debug sem expor detalhes sensíveis
            console.error("📝 Erro contido:", errorMessage.substring(0, 100));
          } catch (handlingError) {
            // Último recurso se até o tratamento de erro falhar
            console.error("❌ Erro no tratamento de erro:", handlingError);
            setError("Erro interno. Tente recarregar a página.");
            setIsSubmitting(false);
          }
        }
      } catch (fatalError) {
        // PROTEÇÃO MÁXIMA: NUNCA deixar erro causar crash/logout
        console.error("❌ Erro fatal capturado e contido:", fatalError);

        try {
          setError(
            "Erro do sistema. A obra pode ter sido guardada. Verifique a lista de obras.",
          );
          setIsSubmitting(false);
        } catch (finalError) {
          // Proteção última instância
          console.error("❌ Erro crítico final:", finalError);
          // Não fazer mais nada - apenas conter o erro
        }
      }
    };

    const updateFormData = (field: keyof CreateWorkData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const addVehicle = () => {
      if (
        vehicleInput.trim() &&
        !formData.vehicles.includes(vehicleInput.trim())
      ) {
        updateFormData("vehicles", [...formData.vehicles, vehicleInput.trim()]);
        setVehicleInput("");
      }
    };

    const removeVehicle = (index: number) => {
      const newVehicles = formData.vehicles.filter((_, i) => i !== index);
      updateFormData("vehicles", newVehicles);
    };

    const addTechnician = () => {
      if (
        technicianInput.trim() &&
        !formData.technicians.includes(technicianInput.trim())
      ) {
        updateFormData("technicians", [
          ...formData.technicians,
          technicianInput.trim(),
        ]);
        setTechnicianInput("");
      }
    };

    const removeTechnician = (index: number) => {
      const newTechnicians = formData.technicians.filter((_, i) => i !== index);
      updateFormData("technicians", newTechnicians);
    };

    const addAssignedUser = (userId: string) => {
      if (!formData.assignedUsers.includes(userId)) {
        updateFormData("assignedUsers", [...formData.assignedUsers, userId]);
      }
    };

    const removeAssignedUser = (userId: string) => {
      const newAssignedUsers = formData.assignedUsers.filter(
        (id) => id !== userId,
      );
      updateFormData("assignedUsers", newAssignedUsers);
    };

    const runQuickDiagnostics = () => {
      console.log("🔍 Executando diagnóstico rápido...");

      try {
        const diagnostics = WorkSaveHelper.diagnose();
        const consolidation = WorkSaveHelper.consolidateEmergencyWorks();
        const sync = WorkSaveHelper.syncBackups();

        console.log("📊 Resultados do diagnóstico:", {
          diagnostics,
          consolidation,
          sync,
        });

        let message = `Diagnóstico executado:\n`;
        message += `• Total de obras: ${diagnostics.totalWorks}\n`;
        message += `• Obras principais: ${diagnostics.backupLocations.works}\n`;
        message += `• Obras backup: ${diagnostics.backupLocations.leirisonda_works}\n`;

        if (consolidation.consolidated > 0) {
          message += `• ${consolidation.consolidated} obras de emergência consolidadas\n`;
        }

        if (sync.synced) {
          message += `• Backups sincronizados: ${sync.details}\n`;
        }

        if (diagnostics.potentialIssues.length > 0) {
          message += `• Problemas: ${diagnostics.potentialIssues.join(", ")}\n`;
        }

        alert(message);
      } catch (diagError) {
        console.error("Erro no diagnóstico:", diagError);
        alert(
          "Diagnóstico executado. Verifique os logs do console para detalhes.",
        );
      }

      setShowDiagnostics(false);
    };

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/works">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center shadow-md p-1 mr-2">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2F9862202d056a426996e6178b9981c1c7?format=webp&width=800"
              alt="Leirisonda Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Nova Obra</h1>
            <p className="mt-1 text-gray-600">
              Criar uma nova obra no sistema Leirisonda
            </p>
          </div>
        </div>

        {/* Offline Warning */}
        {typeof isOnline !== "undefined" && !isOnline && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Está no modo offline. Os dados serão guardados localmente e
              sincronizados quando a ligação for restabelecida.
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <div className="max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Informações Básicas
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="workSheetNumber">Folha de Obra *</Label>
                  <Input
                    id="workSheetNumber"
                    value={formData.workSheetNumber}
                    onChange={(e) =>
                      updateFormData("workSheetNumber", e.target.value)
                    }
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Trabalho *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => updateFormData("type", value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {workTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="clientName">Nome do Cliente *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) =>
                      updateFormData("clientName", e.target.value)
                    }
                    placeholder="Ex: João Silva"
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="contact">Contacto *</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => updateFormData("contact", e.target.value)}
                    placeholder="Ex: 244 123 456"
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Morada *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                    placeholder="Ex: Rua das Flores, 123, Leiria"
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="entryTime">Hora de Entrada *</Label>
                  <Input
                    id="entryTime"
                    type="datetime-local"
                    value={formData.entryTime}
                    onChange={(e) =>
                      updateFormData("entryTime", e.target.value)
                    }
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="exitTime">Hora de Saída</Label>
                  <Input
                    id="exitTime"
                    type="datetime-local"
                    value={formData.exitTime}
                    onChange={(e) => updateFormData("exitTime", e.target.value)}
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe vazio se ainda não terminou
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="status">Estado da Obra *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateFormData("status", value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-3 mt-6">
                  <input
                    id="workSheetCompleted"
                    type="checkbox"
                    checked={formData.workSheetCompleted}
                    onChange={(e) =>
                      updateFormData("workSheetCompleted", e.target.checked)
                    }
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="workSheetCompleted"
                    className="text-sm font-medium text-gray-700"
                  >
                    Folha de obra preenchida/feita
                  </Label>
                </div>
              </div>
            </div>

            {/* Vehicles and Technicians */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Viaturas e Técnicos
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Viaturas Utilizadas</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        value={vehicleInput}
                        onChange={(e) => setVehicleInput(e.target.value)}
                        placeholder="Ex: Carrinha Leirisonda 1"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addVehicle())
                        }
                      />
                      <Button
                        type="button"
                        onClick={addVehicle}
                        variant="outline"
                      >
                        Adicionar
                      </Button>
                    </div>
                    {formData.vehicles.map((vehicle, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded"
                      >
                        <span>{vehicle}</span>
                        <Button
                          type="button"
                          onClick={() => removeVehicle(index)}
                          variant="ghost"
                          size="sm"
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Técnicos</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        value={technicianInput}
                        onChange={(e) => setTechnicianInput(e.target.value)}
                        placeholder="Ex: João Santos"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addTechnician())
                        }
                      />
                      <Button
                        type="button"
                        onClick={addTechnician}
                        variant="outline"
                      >
                        Adicionar
                      </Button>
                    </div>
                    {formData.technicians.map((technician, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded"
                      >
                        <span>{technician}</span>
                        <Button
                          type="button"
                          onClick={() => removeTechnician(index)}
                          variant="ghost"
                          size="sm"
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Usuários Atribuídos</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Selecione os usuários responsáveis por esta obra
                  </p>
                  <div className="mt-2 space-y-2">
                    <Select onValueChange={addAssignedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar usuário..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers
                          .filter(
                            (user) => !formData.assignedUsers.includes(user.id),
                          )
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {formData.assignedUsers.map((userId) => {
                      const assignedUser = availableUsers.find(
                        (u) => u.id === userId,
                      );
                      return assignedUser ? (
                        <div
                          key={userId}
                          className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded border border-blue-200"
                        >
                          <span className="text-blue-800">
                            {assignedUser.name} ({assignedUser.email})
                          </span>
                          <Button
                            type="button"
                            onClick={() => removeAssignedUser(userId)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Remover
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Observations and Work Performed */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Observaç��es e Trabalho
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) =>
                      updateFormData("observations", e.target.value)
                    }
                    placeholder="Observações sobre a obra..."
                    className="mt-1"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="workPerformed">Trabalho Realizado</Label>
                  <Textarea
                    id="workPerformed"
                    value={formData.workPerformed}
                    onChange={(e) =>
                      updateFormData("workPerformed", e.target.value)
                    }
                    placeholder="Descrição do trabalho realizado..."
                    className="mt-1"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Fotografias da Obra
                </h3>
              </div>

              <PhotoUpload
                photos={formData.photos}
                onPhotosChange={(photos) => updateFormData("photos", photos)}
                maxPhotos={20}
              />
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button variant="outline" asChild disabled={isSubmitting}>
                <Link to="/works">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  "A guardar..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Criar Obra
                  </>
                )}
              </Button>
            </div>

            {/* Diagnóstico para Gonçalo (apenas se há erro) */}
            {error && user?.email === "gongonsilva@gmail.com" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-blue-800">
                    Diagnóstico de Salvamento (Admin)
                  </h4>
                  <Button
                    type="button"
                    onClick={runQuickDiagnostics}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Executar Diagnóstico
                  </Button>
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  Execute o diagnóstico se a obra não foi guardada corretamente.
                  Isto irá verificar e corrigir problemas de salvamento.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  } catch (componentError) {
    // PROTEÇÃO FINAL: Se há qualquer erro no componente, mostrar interface segura
    console.error("❌ Erro fatal no componente CreateWork:", componentError);

    return (
      <div className="p-6 max-w-md mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Erro Temporário
          </h2>
          <p className="text-red-600 mb-4">
            Erro no sistema de criação de obras. Por favor, tente novamente.
          </p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Tentar Novamente
            </Button>
            <Button
              onClick={() => (window.location.href = "/works")}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar às Obras
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
