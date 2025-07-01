import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Waves,
  Plus,
  Eye,
  ArrowLeft,
  Building2,
  Wrench,
  Calendar,
  User,
  MapPin,
  Activity,
} from "lucide-react";
import { PoolMaintenance } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewMaintenanceSelector() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [pools, setPools] = useState<PoolMaintenance[]>([]);

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = () => {
    try {
      const stored = localStorage.getItem("pool_maintenances");
      if (stored) {
        setPools(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading pools:", error);
    }
  };

  const filteredPools = pools.filter(
    (pool) =>
      pool.poolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        className={`px-2 py-1 text-xs font-medium rounded-full border ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="p-2">
            <Link to="/maintenance">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Waves className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Nova Manutenção
              </h1>
              <p className="text-gray-600 text-sm">
                Escolha uma opção para continuar
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/create-maintenance">
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Nova Piscina</h3>
                  <p className="text-sm text-gray-600">
                    Registrar nova piscina no sistema
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Nova Intervenção
                </h3>
                <p className="text-sm text-gray-600">
                  Selecione uma piscina abaixo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search for existing pools */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Seleccionar Piscina para Nova Intervenção
          </h3>

          <Input
            type="text"
            placeholder="Pesquisar piscina..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredPools.map((pool) => (
              <Link
                key={pool.id}
                to={`/maintenance/${pool.id}/new-intervention`}
                className="block"
              >
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">
                      {pool.poolName}
                    </h4>
                    {getStatusBadge(pool.status)}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {pool.clientName}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {pool.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {pool.interventions.length} intervenções
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Intervenção
                    </Button>
                  </div>
                </div>
              </Link>
            ))}

            {filteredPools.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Waves className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma piscina encontrada</p>
                {searchTerm && (
                  <p className="text-sm">Tente ajustar os termos de pesquisa</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
