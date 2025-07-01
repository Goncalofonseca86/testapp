import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Waves,
  Save,
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Droplets,
  Camera,
  AlertCircle,
} from "lucide-react";
import { PoolMaintenance } from "@shared/types";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PoolPhotoUpload } from "@/components/PoolPhotoUpload";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";

export function CreateMaintenance() {
  const navigate = useNavigate();
  const { createMaintenance, isOnline, isSyncing } = useFirebaseSync();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    poolName: "",
    location: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    poolType: "outdoor" as const,
    waterCubicage: "",
    status: "active" as const,
    observations: "",
  });

  const [photos, setPhotos] = useState<any[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.poolName.trim()) {
        throw new Error("Nome da piscina é obrigatório");
      }
      if (!formData.clientName.trim()) {
        throw new Error("Nome do cliente é obrigatório");
      }
      if (!formData.location.trim()) {
        throw new Error("Localização é obrigatória");
      }

      // Process photos to convert File objects to proper format
      const processedPhotos = photos.map((photo) => ({
        id: photo.id,
        url: photo.url,
        filename: photo.filename,
        description: photo.description,
        category: photo.category,
        uploadedAt: photo.uploadedAt,
      }));

      // Prepare maintenance data
      const maintenanceData = {
        poolName: formData.poolName.trim(),
        location: formData.location.trim(),
        clientName: formData.clientName.trim(),
        clientPhone: formData.clientPhone.trim(),
        clientEmail: formData.clientEmail.trim(),
        poolType: formData.poolType,
        waterCubicage: formData.waterCubicage.trim(),
        interventions: [],
        status: formData.status,
        photos: processedPhotos,
        observations: formData.observations.trim(),
      };

      // Create maintenance using Firebase sync
      const maintenanceId = await createMaintenance(maintenanceData);
      console.log("✅ Manutenção criada com sucesso:", maintenanceId);

      navigate("/pool-maintenance");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/pool-maintenance")}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center shadow-md p-1">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2F9862202d056a426996e6178b9981c1c7?format=webp&width=800"
            alt="Leirisonda Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Waves className="mr-3 h-8 w-8 text-blue-600" />
            Registrar Nova Piscina
          </h1>
          <p className="text-gray-600 mt-1">
            Adiciona uma nova piscina ao sistema de manutenção
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Waves className="mr-2 h-5 w-5 text-blue-600" />
            Informações da Piscina
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="poolName" className="text-sm font-medium">
                Nome da Piscina *
              </Label>
              <Input
                id="poolName"
                type="text"
                placeholder="Ex: Piscina Villa Mar"
                value={formData.poolName}
                onChange={(e) => handleInputChange("poolName", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-sm font-medium">
                Localização *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  type="text"
                  placeholder="Morada completa"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="poolType" className="text-sm font-medium">
                Tipo de Piscina
              </Label>
              <Select
                value={formData.poolType}
                onValueChange={(value) => handleInputChange("poolType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outdoor">Exterior</SelectItem>
                  <SelectItem value="indoor">Interior</SelectItem>
                  <SelectItem value="spa">Spa</SelectItem>
                  <SelectItem value="olympic">Olímpica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="waterCubicage" className="text-sm font-medium">
                Cubicagem de Água
              </Label>
              <div className="relative">
                <Droplets className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="waterCubicage"
                  type="text"
                  placeholder="Ex: 50m³"
                  value={formData.waterCubicage}
                  onChange={(e) =>
                    handleInputChange("waterCubicage", e.target.value)
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium">
                Estado
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                  <SelectItem value="seasonal">Sazonal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <User className="mr-2 h-5 w-5 text-blue-600" />
            Informações do Cliente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="clientName" className="text-sm font-medium">
                Nome do Cliente *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="clientName"
                  type="text"
                  placeholder="Nome completo"
                  value={formData.clientName}
                  onChange={(e) =>
                    handleInputChange("clientName", e.target.value)
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clientPhone" className="text-sm font-medium">
                Telefone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="clientPhone"
                  type="tel"
                  placeholder="910 000 000"
                  value={formData.clientPhone}
                  onChange={(e) =>
                    handleInputChange("clientPhone", e.target.value)
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="clientEmail" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    handleInputChange("clientEmail", e.target.value)
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Observaç��es Gerais
          </h2>

          <Textarea
            placeholder="Notas adicionais sobre a piscina, equipamentos, acesso, etc..."
            value={formData.observations}
            onChange={(e) => handleInputChange("observations", e.target.value)}
            rows={4}
          />
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Camera className="mr-2 h-5 w-5 text-blue-600" />
            Fotografias da Piscina
          </h2>

          <PoolPhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={20}
            type="pool"
          />
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/pool-maintenance")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="btn-primary">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "A guardar..." : "Guardar Piscina"}
          </Button>
        </div>
      </form>
    </div>
  );
}
