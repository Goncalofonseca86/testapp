import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Save,
  User,
  MapPin,
  Calendar,
  Flag,
  AlertCircle,
  Wifi,
  WifiOff,
  Users,
} from "lucide-react";
import { Work } from "@shared/types";
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
import { WorkReport } from "@/components/WorkReport";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";
import { useAuth } from "@/components/AuthProvider";

const statusOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "em_progresso", label: "Em Progresso" },
  { value: "concluida", label: "Concluída" },
];

export function EditWork() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Use try-catch para capturar erros de contexto
  let firebaseContext, authContext;
  try {
    firebaseContext = useFirebaseSync();
    authContext = useAuth();
  } catch (error) {
    console.error("❌ Erro ao acessar contextos:", error);
    return (
      <div className="p-6 max-w-md mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Erro de Contexto
          </h2>
          <p className="text-red-600 mb-4">
            Erro ao carregar contextos da aplicação. Tente recarregar a página.
          </p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Recarregar Página
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

  const { works, updateWork, isOnline, isSyncing } = firebaseContext;
  const { getAllUsers } = authContext;

  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newPhotos, setNewPhotos] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    clientName: "",
    address: "",
    contact: "",
    entryTime: "",
    exitTime: "",
    status: "pendente" as "pendente" | "em_progresso" | "concluida",
    observations: "",
    workPerformed: "",
    workSheetCompleted: false,
    assignedUsers: [] as string[], // Add assigned users
  });

  const [vehicleInput, setVehicleInput] = useState("");
  const [technicianInput, setTechnicianInput] = useState("");
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [technicians, setTechnicians] = useState<string[]>([]);

  // Get available users for assignment
  const availableUsers = getAllUsers ? getAllUsers() : [];

  useEffect(() => {
    loadWork();
  }, [id, works]);

  const loadWork = () => {
    if (!id) return;

    // Use dados do Firebase sync em primeiro lugar
    const foundWork = works.find((w) => w.id === id);
    if (foundWork) {
      setWork(foundWork);
      setFormData({
        clientName: foundWork.clientName,
        address: foundWork.address,
        contact: foundWork.contact,
        entryTime: format(new Date(foundWork.entryTime), "yyyy-MM-dd'T'HH:mm"),
        exitTime: foundWork.exitTime
          ? format(new Date(foundWork.exitTime), "yyyy-MM-dd'T'HH:mm")
          : "",
        status: foundWork.status,
        observations: foundWork.observations,
        workPerformed: foundWork.workPerformed,
        workSheetCompleted: foundWork.workSheetCompleted || false,
        assignedUsers: foundWork.assignedUsers || [], // Include assigned users
      });
      setVehicles(foundWork.vehicles);
      setTechnicians(foundWork.technicians);
    } else {
      // Fallback para localStorage se não encontrar no Firebase
      const storedWorks = localStorage.getItem("leirisonda_works");
      if (storedWorks) {
        const localWorks: Work[] = JSON.parse(storedWorks);
        const localWork = localWorks.find((w) => w.id === id);
        if (localWork) {
          setWork(localWork);
          setFormData({
            clientName: localWork.clientName,
            address: localWork.address,
            contact: localWork.contact,
            entryTime: format(
              new Date(localWork.entryTime),
              "yyyy-MM-dd'T'HH:mm",
            ),
            exitTime: localWork.exitTime
              ? format(new Date(localWork.exitTime), "yyyy-MM-dd'T'HH:mm")
              : "",
            status: localWork.status,
            observations: localWork.observations,
            workPerformed: localWork.workPerformed,
            workSheetCompleted: localWork.workSheetCompleted || false,
            assignedUsers: localWork.assignedUsers || [], // Include assigned users
          });
          setVehicles(localWork.vehicles);
          setTechnicians(localWork.technicians);
        }
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!work) return;

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
      // Create updated work
      const updatedWork: Work = {
        ...work,
        clientName: formData.clientName.trim(),
        address: formData.address.trim(),
        contact: formData.contact.trim(),
        entryTime: new Date(formData.entryTime).toISOString(),
        exitTime: formData.exitTime
          ? new Date(formData.exitTime).toISOString()
          : formData.status === "concluida" && !work.exitTime
            ? new Date().toISOString()
            : work.exitTime,
        status: formData.status,
        vehicles: vehicles,
        technicians: technicians,
        assignedUsers: formData.assignedUsers, // Include assigned users
        photos: [
          ...work.photos,
          ...newPhotos.map((photo, index) => ({
            id: `${Date.now()}-${index}`,
            url: URL.createObjectURL(photo),
            filename: photo.name,
            uploadedAt: new Date().toISOString(),
          })),
        ],
        observations: formData.observations.trim(),
        workPerformed: formData.workPerformed.trim(),
        workSheetCompleted: formData.workSheetCompleted,
        updatedAt: new Date().toISOString(),
      };

      // Use Firebase sync to update work with automatic sync
      await updateWork(work.id, updatedWork);
      console.log(
        "✅ Obra atualizada e sincronizada automaticamente:",
        work.id,
      );

      // Navigate back to work detail
      navigate(`/works/${work.id}`);
    } catch (err) {
      setError("Erro ao atualizar a obra. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addVehicle = () => {
    if (vehicleInput.trim() && !vehicles.includes(vehicleInput.trim())) {
      setVehicles([...vehicles, vehicleInput.trim()]);
      setVehicleInput("");
    }
  };

  const removeVehicle = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const addTechnician = () => {
    if (
      technicianInput.trim() &&
      !technicians.includes(technicianInput.trim())
    ) {
      setTechnicians([...technicians, technicianInput.trim()]);
      setTechnicianInput("");
    }
  };

  const removeTechnician = (index: number) => {
    setTechnicians(technicians.filter((_, i) => i !== index));
  };

  // User assignment functions
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Obra não encontrada
        </h3>
        <p className="text-gray-600 mb-4">
          A obra que procura pode ter sido removida ou não existe.
        </p>
        <Button asChild>
          <Link to="/works">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à Lista
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link to={`/works/${work.id}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Obra</h1>
          <p className="mt-1 text-gray-600">Atualize as informações da obra</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Informações Básicas
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="clientName">Nome do Cliente *</Label>
                <Input
                  id="clientName"
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => updateFormData("clientName", e.target.value)}
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
                  type="text"
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
                  onChange={(e) => updateFormData("entryTime", e.target.value)}
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

              <div>
                <Label htmlFor="status">Estado da Obra *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(
                    value: "pendente" | "em_progresso" | "concluida",
                  ) => updateFormData("status", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="mt-1">
                    <Flag className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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

          {/* Vehicles, Technicians, and User Assignment */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Viaturas, Técnicos e Atribuições
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
                        e.key === "Enter" && (e.preventDefault(), addVehicle())
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
                  {vehicles.map((vehicle, index) => (
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
                  {technicians.map((technician, index) => (
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

              <div className="md:col-span-2">
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
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Observações e Trabalho
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

          {/* Current Photos */}
          {work.photos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Fotografias Existentes ({work.photos.length})
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {work.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                  >
                    <img
                      src={photo.url}
                      alt={`Fotografia ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Photos Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Adicionar Novas Fotografias
              </h3>
            </div>

            <PhotoUpload
              photos={newPhotos}
              onPhotosChange={setNewPhotos}
              maxPhotos={20 - work.photos.length}
            />

            {work.photos.length >= 20 && (
              <p className="text-sm text-gray-500 mt-2">
                Limite máximo de 20 fotografias por obra atingido.
              </p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <WorkReport work={work} />
            </div>

            <div className="flex gap-4">
              <Button variant="outline" asChild disabled={isSubmitting}>
                <Link to={`/works/${work.id}`}>Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  "A guardar..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
