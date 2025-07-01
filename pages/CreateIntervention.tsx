import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Waves,
  Save,
  ArrowLeft,
  Clock,
  Users,
  Truck,
  Thermometer,
  Droplets,
  Plus,
  Minus,
  AlertTriangle,
  Camera,
  AlertCircle,
} from "lucide-react";
import { PoolMaintenance, MaintenanceIntervention } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

export function CreateIntervention() {
  const { maintenanceId } = useParams<{ maintenanceId: string }>();
  const navigate = useNavigate();
  const { updateMaintenance, maintenances, isOnline, isSyncing } =
    useFirebaseSync();
  const [maintenance, setMaintenance] = useState<PoolMaintenance | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    timeStart: format(new Date(), "HH:mm"),
    timeEnd: "",
    technicians: [""],
    vehicles: [""],
    waterValues: {
      ph: 0,
      salt: 0,
      orp: 0,
      temperature: 0,
      chlorine: 0,
      bromine: 0,
      alkalinity: 0,
      hardness: 0,
      stabilizer: 0,
    },
    chemicalProducts: [{ productName: "", quantity: 0, unit: "kg" }],
    workPerformed: {
      filtros: false,
      preFiltro: false,
      filtroAreiaVidro: false,
      enchimentoAutomatico: false,
      linhaAgua: false,
      limpezaFundo: false,
      limpezaParedes: false,
      limpezaSkimmers: false,
      verificacaoEquipamentos: false,
      outros: "",
    },
    problems: [{ description: "", severity: "low" as const, resolved: false }],
    nextMaintenanceDate: "",
    observations: "",
  });

  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    loadMaintenance();
    // Auto-generate end time (1 hour later)
    if (formData.timeStart) {
      const [hours, minutes] = formData.timeStart.split(":");
      const endTime = new Date();
      endTime.setHours(parseInt(hours) + 1, parseInt(minutes));
      setFormData((prev) => ({
        ...prev,
        timeEnd: format(endTime, "HH:mm"),
      }));
    }
  }, [maintenanceId, maintenances]); // React to changes in maintenances data

  const loadMaintenance = () => {
    try {
      // Use dados do Firebase sync em primeiro lugar
      const found = maintenances.find((m) => m.id === maintenanceId);
      if (found) {
        setMaintenance(found);
      } else {
        // Fallback para localStorage apenas se não encontrar no Firebase
        const stored = localStorage.getItem("pool_maintenances");
        if (stored) {
          const localMaintenances: PoolMaintenance[] = JSON.parse(stored);
          const localFound = localMaintenances.find(
            (m) => m.id === maintenanceId,
          );
          if (localFound) {
            setMaintenance(localFound);
          } else {
            setError("Piscina não encontrada");
          }
        } else {
          setError("Piscina não encontrada");
        }
      }
    } catch (err) {
      setError("Erro ao carregar dados");
    }
  };

  const handleInputChange = (field: string, value: any, nested?: string) => {
    setFormData((prev) => {
      if (nested) {
        return {
          ...prev,
          [nested]: {
            ...prev[nested as keyof typeof prev],
            [field]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleArrayChange = (
    field: "technicians" | "vehicles",
    index: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field: "technicians" | "vehicles") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayItem = (
    field: "technicians" | "vehicles",
    index: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleChemicalProductChange = (
    index: number,
    field: string,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      chemicalProducts: prev.chemicalProducts.map((product, i) =>
        i === index ? { ...product, [field]: value } : product,
      ),
    }));
  };

  const addChemicalProduct = () => {
    setFormData((prev) => ({
      ...prev,
      chemicalProducts: [
        ...prev.chemicalProducts,
        { productName: "", quantity: 0, unit: "kg" },
      ],
    }));
  };

  const removeChemicalProduct = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      chemicalProducts: prev.chemicalProducts.filter((_, i) => i !== index),
    }));
  };

  const handleProblemChange = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      problems: prev.problems.map((problem, i) =>
        i === index ? { ...problem, [field]: value } : problem,
      ),
    }));
  };

  const addProblem = () => {
    setFormData((prev) => ({
      ...prev,
      problems: [
        ...prev.problems,
        { description: "", severity: "low" as const, resolved: false },
      ],
    }));
  };

  const removeProblem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      problems: prev.problems.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!maintenance) {
        throw new Error("Piscina não encontrada");
      }

      // Validation
      if (!formData.timeStart || !formData.timeEnd) {
        throw new Error("Hora de início e fim são obrigatórias");
      }

      const filteredTechnicians = formData.technicians.filter(
        (t) => t.trim() !== "",
      );
      const filteredVehicles = formData.vehicles.filter((v) => v.trim() !== "");

      if (filteredTechnicians.length === 0) {
        throw new Error("Pelo menos um técnico é obrigatório");
      }

      const newIntervention: MaintenanceIntervention = {
        id: crypto.randomUUID(),
        maintenanceId: maintenance.id,
        date: formData.date,
        timeStart: formData.timeStart,
        timeEnd: formData.timeEnd,
        technicians: filteredTechnicians,
        vehicles: filteredVehicles,
        waterValues: formData.waterValues,
        chemicalProducts: formData.chemicalProducts.filter(
          (p) => p.productName.trim() !== "",
        ),
        workPerformed: formData.workPerformed,
        problems: formData.problems.filter((p) => p.description.trim() !== ""),
        nextMaintenanceDate: formData.nextMaintenanceDate || undefined,
        photos: photos.map((photo) => ({
          id: photo.id,
          url: photo.url,
          filename: photo.filename,
          description: photo.description,
          uploadedAt: photo.uploadedAt,
        })),
        observations: formData.observations.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update maintenance with new intervention using Firebase sync
      const updatedMaintenance: PoolMaintenance = {
        ...maintenance,
        interventions: [...maintenance.interventions, newIntervention],
        lastMaintenanceDate: formData.date,
        updatedAt: new Date().toISOString(),
      };

      // Debug logs para verificar criação da intervenção
      console.log("🔍 DEBUG: Dados da nova intervenção:", newIntervention);
      console.log("🔍 DEBUG: Manutenção antes da atualização:", maintenance);
      console.log("🔍 DEBUG: Manutenção atualizada:", updatedMaintenance);
      console.log(
        "🔍 DEBUG: Total de intervenções após adição:",
        updatedMaintenance.interventions.length,
      );

      // Use Firebase sync to update maintenance with automatic sync
      // Passa a manutenção completa para garantir que todas as intervenções sejam salvas
      await updateMaintenance(maintenance.id, updatedMaintenance);
      console.log(
        "✅ Intervenção criada e sincronizada automaticamente:",
        newIntervention.id,
      );

      // Verificar se foi realmente salva
      setTimeout(() => {
        const savedMaintenances = JSON.parse(
          localStorage.getItem("pool_maintenances") || "[]",
        );
        const savedMaintenance = savedMaintenances.find(
          (m: any) => m.id === maintenance.id,
        );
        console.log(
          "🔍 DEBUG: Verificação localStorage após salvamento:",
          savedMaintenance,
        );
        if (savedMaintenance) {
          console.log(
            "🔍 DEBUG: Intervenções salvas no localStorage:",
            savedMaintenance.interventions.length,
          );
        }
      }, 1000);

      navigate(`/maintenance/${maintenance.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!maintenance) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">A carregar...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/maintenance/${maintenance.id}`)}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Waves className="mr-3 h-8 w-8 text-blue-600" />
            Nova Intervenção
          </h1>
          <p className="text-gray-600 mt-1">
            {maintenance.poolName} • {maintenance.location}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-blue-600" />
            Informações Básicas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="date">Data da Intervenção *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="timeStart">Hora de Início *</Label>
              <Input
                id="timeStart"
                type="time"
                value={formData.timeStart}
                onChange={(e) => handleInputChange("timeStart", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="timeEnd">Hora de Fim *</Label>
              <Input
                id="timeEnd"
                type="time"
                value={formData.timeEnd}
                onChange={(e) => handleInputChange("timeEnd", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Team & Vehicles */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Users className="mr-2 h-5 w-5 text-blue-600" />
            Equipa e Viaturas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="flex items-center justify-between">
                Técnicos *
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("technicians")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Label>
              <div className="space-y-2">
                {formData.technicians.map((technician, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Nome do técnico"
                      value={technician}
                      onChange={(e) =>
                        handleArrayChange("technicians", index, e.target.value)
                      }
                    />
                    {formData.technicians.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem("technicians", index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center justify-between">
                Viaturas
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem("vehicles")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Label>
              <div className="space-y-2">
                {formData.vehicles.map((vehicle, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Matrícula ou identificação"
                      value={vehicle}
                      onChange={(e) =>
                        handleArrayChange("vehicles", index, e.target.value)
                      }
                    />
                    {formData.vehicles.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem("vehicles", index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Water Values */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Thermometer className="mr-2 h-5 w-5 text-blue-600" />
            Valores da Água
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="ph">pH</Label>
              <Input
                id="ph"
                type="number"
                step="0.1"
                placeholder="7.2"
                value={formData.waterValues.ph || ""}
                onChange={(e) =>
                  handleInputChange(
                    "ph",
                    parseFloat(e.target.value) || 0,
                    "waterValues",
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="chlorine">Cloro (ppm)</Label>
              <Input
                id="chlorine"
                type="number"
                step="0.1"
                placeholder="1.5"
                value={formData.waterValues.chlorine || ""}
                onChange={(e) =>
                  handleInputChange(
                    "chlorine",
                    parseFloat(e.target.value) || 0,
                    "waterValues",
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="temperature">Temperatura (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                placeholder="25"
                value={formData.waterValues.temperature || ""}
                onChange={(e) =>
                  handleInputChange(
                    "temperature",
                    parseFloat(e.target.value) || 0,
                    "waterValues",
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="salt">Sal (gr/lt)</Label>
              <Input
                id="salt"
                type="number"
                step="0.1"
                placeholder="3.2"
                value={formData.waterValues.salt || ""}
                onChange={(e) =>
                  handleInputChange(
                    "salt",
                    parseFloat(e.target.value) || 0,
                    "waterValues",
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="orp">ORP (mv)</Label>
              <Input
                id="orp"
                type="number"
                min="0"
                max="1000"
                placeholder="650"
                value={formData.waterValues.orp || ""}
                onChange={(e) =>
                  handleInputChange(
                    "orp",
                    parseInt(e.target.value) || 0,
                    "waterValues",
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="bromine">Bromo (ppm)</Label>
              <Input
                id="bromine"
                type="number"
                step="0.1"
                placeholder="2.5"
                value={formData.waterValues.bromine || ""}
                onChange={(e) =>
                  handleInputChange(
                    "bromine",
                    parseFloat(e.target.value) || 0,
                    "waterValues",
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="alkalinity">Alcalinidade</Label>
              <Input
                id="alkalinity"
                type="number"
                placeholder="120"
                value={formData.waterValues.alkalinity || ""}
                onChange={(e) =>
                  handleInputChange(
                    "alkalinity",
                    parseInt(e.target.value) || 0,
                    "waterValues",
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="hardness">Dureza</Label>
              <Input
                id="hardness"
                type="number"
                placeholder="200"
                value={formData.waterValues.hardness || ""}
                onChange={(e) =>
                  handleInputChange(
                    "hardness",
                    parseInt(e.target.value) || 0,
                    "waterValues",
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="stabilizer">Estabilizador</Label>
              <Input
                id="stabilizer"
                type="number"
                placeholder="50"
                value={formData.waterValues.stabilizer || ""}
                onChange={(e) =>
                  handleInputChange(
                    "stabilizer",
                    parseInt(e.target.value) || 0,
                    "waterValues",
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Chemical Products */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center justify-between">
            <span className="flex items-center">
              <Droplets className="mr-2 h-5 w-5 text-blue-600" />
              Produtos Químicos Utilizados
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addChemicalProduct}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </h2>

          <div className="space-y-4">
            {formData.chemicalProducts.map((product, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg"
              >
                <div className="md:col-span-2">
                  <Label>Nome do Produto</Label>
                  <Input
                    placeholder="Ex: Cloro líquido"
                    value={product.productName}
                    onChange={(e) =>
                      handleChemicalProductChange(
                        index,
                        "productName",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={product.quantity || ""}
                    onChange={(e) =>
                      handleChemicalProductChange(
                        index,
                        "quantity",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Unidade</Label>
                    <Select
                      value={product.unit}
                      onValueChange={(value) =>
                        handleChemicalProductChange(index, "unit", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="unid">unid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.chemicalProducts.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeChemicalProduct(index)}
                      className="mt-6"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Performed */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Trabalho Realizado
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(formData.workPerformed)
              .filter(([key]) => key !== "outros")
              .map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value as boolean}
                    onCheckedChange={(checked) =>
                      handleInputChange(key, checked, "workPerformed")
                    }
                  />
                  <Label htmlFor={key} className="text-sm">
                    {key.charAt(0).toUpperCase() +
                      key.slice(1).replace(/([A-Z])/g, " $1")}
                  </Label>
                </div>
              ))}
          </div>

          <div className="mt-6">
            <Label htmlFor="outros">Outros trabalhos</Label>
            <Textarea
              id="outros"
              placeholder="Descreve outros trabalhos realizados..."
              value={formData.workPerformed.outros}
              onChange={(e) =>
                handleInputChange("outros", e.target.value, "workPerformed")
              }
              rows={3}
            />
          </div>
        </div>

        {/* Problems */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center justify-between">
            <span className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
              Problemas Encontrados
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProblem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Problema
            </Button>
          </h2>

          <div className="space-y-4">
            {formData.problems.map((problem, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg"
              >
                <div className="md:col-span-2">
                  <Label>Descrição do Problema</Label>
                  <Textarea
                    placeholder="Descreve o problema encontrado..."
                    value={problem.description}
                    onChange={(e) =>
                      handleProblemChange(index, "description", e.target.value)
                    }
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Gravidade</Label>
                  <Select
                    value={problem.severity}
                    onValueChange={(value) =>
                      handleProblemChange(index, "severity", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`resolved-${index}`}
                        checked={problem.resolved}
                        onCheckedChange={(checked) =>
                          handleProblemChange(index, "resolved", checked)
                        }
                      />
                      <Label htmlFor={`resolved-${index}`} className="text-sm">
                        Resolvido
                      </Label>
                    </div>
                  </div>

                  {formData.problems.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeProblem(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Informações Adicionais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="nextMaintenanceDate">Próxima Manutenção</Label>
              <Input
                id="nextMaintenanceDate"
                type="date"
                value={formData.nextMaintenanceDate}
                onChange={(e) =>
                  handleInputChange("nextMaintenanceDate", e.target.value)
                }
              />
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              placeholder="Observações gerais sobre a intervenção..."
              value={formData.observations}
              onChange={(e) =>
                handleInputChange("observations", e.target.value)
              }
              rows={4}
            />
          </div>
        </div>

        {/* Photos */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Camera className="mr-2 h-5 w-5 text-blue-600" />
            Fotografias da Intervenção
          </h2>

          <PoolPhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={15}
            type="intervention"
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
            onClick={() => navigate(`/maintenance/${maintenance.id}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="btn-primary">
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "A guardar..." : "Guardar Intervenção"}
          </Button>
        </div>
      </form>
    </div>
  );
}
