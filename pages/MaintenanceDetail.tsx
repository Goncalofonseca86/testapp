import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Waves,
  ArrowLeft,
  Plus,
  Edit,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  Activity,
  AlertCircle,
  Thermometer,
  Droplets,
  Eye,
  Trash2,
} from "lucide-react";
import { PoolMaintenance, MaintenanceIntervention } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MaintenanceReport } from "@/components/MaintenanceReport";
import { PhotoGallery } from "@/components/PhotoGallery";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";

export function MaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { maintenances, deleteMaintenance } = useFirebaseSync();
  const [maintenance, setMaintenance] = useState<PoolMaintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMaintenance();
  }, [id, maintenances]);

  const loadMaintenance = () => {
    try {
      if (!id) return;

      // Use dados do Firebase sync em primeiro lugar
      const found = maintenances.find((m) => m.id === id);
      if (found) {
        // Ensure photos array exists
        if (!found.photos) {
          found.photos = [];
        }
        // Ensure interventions have photos
        found.interventions = found.interventions.map((intervention) => ({
          ...intervention,
          photos: intervention.photos || [],
        }));
        setMaintenance(found);
      } else {
        // Fallback para localStorage se não encontrar no Firebase
        const stored = localStorage.getItem("pool_maintenances");
        if (stored) {
          const localMaintenances: PoolMaintenance[] = JSON.parse(stored);
          const localFound = localMaintenances.find((m) => m.id === id);
          if (localFound) {
            // Ensure photos array exists
            if (!localFound.photos) {
              localFound.photos = [];
            }
            // Ensure interventions have photos
            localFound.interventions = localFound.interventions.map(
              (intervention) => ({
                ...intervention,
                photos: intervention.photos || [],
              }),
            );
            setMaintenance(localFound);
          } else {
            setError("Piscina não encontrada");
          }
        } else {
          setError("Nenhuma piscina encontrada");
        }
      }
    } catch (err) {
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      seasonal: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };

    const labels = {
      active: "Ativa",
      inactive: "Inativa",
      seasonal: "Sazonal",
    };

    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded-full border ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPoolTypeLabel = (type: string) => {
    const labels = {
      outdoor: "Exterior",
      indoor: "Interior",
      spa: "Spa",
      olympic: "Olímpica",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const sortedInterventions = maintenance?.interventions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const getWaterQualityColor = (intervention: MaintenanceIntervention) => {
    const ph = intervention.waterValues.ph;
    const chlorine = intervention.waterValues.chlorine;

    // Valores ideais: pH entre 7.0-7.4, Cloro entre 1.0-2.0
    if (ph >= 7.0 && ph <= 7.4 && chlorine >= 1.0 && chlorine <= 2.0) {
      return "text-green-600";
    } else if (
      (ph >= 6.8 && ph <= 7.6 && chlorine >= 0.8 && chlorine <= 2.5) ||
      ph === 0 ||
      chlorine === 0
    ) {
      return "text-yellow-600";
    } else {
      return "text-red-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">A carregar...</span>
      </div>
    );
  }

  if (error || !maintenance) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Erro ao carregar
        </h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => navigate("/pool-maintenance")}>
          Voltar à Lista
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="outline"
            onClick={() => navigate("/pool-maintenance")}
            className="p-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
              <Waves className="mr-3 h-6 lg:h-8 w-6 lg:w-8 text-blue-600 shrink-0" />
              <span className="truncate">{maintenance.poolName}</span>
            </h1>
            <p className="text-gray-600 mt-1 text-sm lg:text-base">
              Detalhes da piscina e histórico de intervenções
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:shrink-0">
          <div className="w-full sm:w-auto">
            <MaintenanceReport maintenance={maintenance} />
          </div>

          <Link
            to={`/maintenance/${maintenance.id}/new-intervention`}
            className="flex-1 sm:flex-none"
          >
            <Button className="btn-primary w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Intervenção</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Pool Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Informações da Piscina
            </h2>
            {getStatusBadge(maintenance.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Localização</div>
                <div className="flex items-center text-gray-900">
                  <MapPin className="mr-2 h-4 w-4" />
                  {maintenance.location}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Tipo e Cubicagem</div>
                <div className="flex items-center text-gray-900">
                  <Waves className="mr-2 h-4 w-4" />
                  {getPoolTypeLabel(maintenance.poolType)} •{" "}
                  {maintenance.waterCubicage || "Não especificado"}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Cliente</div>
                <div className="flex items-center text-gray-900">
                  <User className="mr-2 h-4 w-4" />
                  {maintenance.clientName}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Contacto</div>
                <div className="space-y-1">
                  {maintenance.clientPhone && (
                    <div className="flex items-center text-gray-900">
                      <Phone className="mr-2 h-4 w-4" />
                      {maintenance.clientPhone}
                    </div>
                  )}
                  {maintenance.clientEmail && (
                    <div className="flex items-center text-gray-900">
                      <Mail className="mr-2 h-4 w-4" />
                      {maintenance.clientEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {maintenance.observations && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 mb-2">
                Observações Gerais
              </div>
              <p className="text-gray-900">{maintenance.observations}</p>
            </div>
          )}
        </div>

        {/* Pool Photos */}
        {maintenance.photos && maintenance.photos.length > 0 && (
          <div className="lg:col-span-3 glass-card p-6">
            <PhotoGallery
              photos={maintenance.photos}
              title="Fotografias da Piscina"
              type="pool"
            />
          </div>
        )}

        {/* Quick Stats */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estatísticas
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Intervenções</span>
              <span className="font-semibold text-gray-900">
                {maintenance.interventions.length}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Problemas Ativos</span>
              <span className="font-semibold text-red-600">
                {
                  maintenance.interventions
                    .flatMap((i) => i.problems)
                    .filter((p) => !p.resolved).length
                }
              </span>
            </div>

            {sortedInterventions && sortedInterventions.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Última Intervenção</span>
                  <span className="font-semibold text-gray-900">
                    {format(
                      new Date(sortedInterventions[0].date),
                      "dd/MM/yyyy",
                      { locale: pt },
                    )}
                  </span>
                </div>

                {sortedInterventions[0].nextMaintenanceDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Próxima Manutenção</span>
                    <span className="font-semibold text-blue-600">
                      {format(
                        new Date(sortedInterventions[0].nextMaintenanceDate),
                        "dd/MM/yyyy",
                        { locale: pt },
                      )}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interventions History */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Activity className="mr-2 h-5 w-5 text-blue-600" />
            Histórico de Intervenções
          </h2>
        </div>

        {sortedInterventions && sortedInterventions.length > 0 ? (
          <div className="space-y-4">
            {sortedInterventions.map((intervention) => (
              <div
                key={intervention.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="font-medium text-gray-900">
                        {format(new Date(intervention.date), "dd/MM/yyyy", {
                          locale: pt,
                        })}
                      </span>
                      <span className="text-sm text-gray-600">
                        {intervention.timeStart} - {intervention.timeEnd}
                      </span>
                      <span
                        className={`text-sm ${getWaterQualityColor(intervention)}`}
                      >
                        pH: {intervention.waterValues.ph || "N/A"} • Cl:{" "}
                        {intervention.waterValues.chlorine || "N/A"} • ORP:{" "}
                        {intervention.waterValues.orp || "N/A"} • Sal:{" "}
                        {intervention.waterValues.salt || "N/A"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Técnicos: {intervention.technicians.join(", ") || "N/A"}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <div className="hidden sm:block">
                      <MaintenanceReport
                        maintenance={maintenance}
                        intervention={intervention}
                      />
                    </div>
                    <Link to={`/intervention/${intervention.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to={`/intervention/${intervention.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Trabalho Realizado:</span>
                    <div className="mt-1">
                      {Object.entries(intervention.workPerformed)
                        .filter(([key, value]) => value && key !== "outros")
                        .map(([key]) => key)
                        .join(", ") || "Nenhum"}
                      {intervention.workPerformed.outros && (
                        <div className="text-gray-600">
                          + {intervention.workPerformed.outros}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500">Produtos Químicos:</span>
                    <div className="mt-1">
                      {intervention.chemicalProducts.length > 0
                        ? intervention.chemicalProducts
                            .map(
                              (p) =>
                                `${p.productName} (${p.quantity}${p.unit})`,
                            )
                            .join(", ")
                        : "Nenhum"}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500">Problemas:</span>
                    <div className="mt-1">
                      {intervention.problems.length > 0
                        ? intervention.problems.map((p, i) => (
                            <div
                              key={i}
                              className={`text-xs ${
                                p.resolved ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {p.description} {p.resolved ? "✓" : "⚠️"}
                            </div>
                          ))
                        : "Nenhum"}
                    </div>
                  </div>
                </div>

                {intervention.observations && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-500 text-sm">Observações:</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {intervention.observations}
                    </p>
                  </div>
                )}

                {intervention.photos && intervention.photos.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <PhotoGallery
                      photos={intervention.photos}
                      title={`Fotos da Intervenção`}
                      type="intervention"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma intervenção registrada
            </h3>
            <p className="text-gray-600 mb-6">
              Registre a primeira intervenção nesta piscina.
            </p>
            <Link to={`/maintenance/${maintenance.id}/new-intervention`}>
              <Button className="btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                Primeira Intervenção
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
