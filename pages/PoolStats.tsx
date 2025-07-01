import React from "react";
import { Droplets, Thermometer, Wrench, AlertTriangle } from "lucide-react";
import { PoolStatCard } from "@/components/StatCard";

export function PoolStats() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Estatísticas de Piscinas
        </h1>
        <p className="mt-2 text-muted-foreground">
          Monitorização e dados técnicos das piscinas
        </p>
      </div>

      {/* Pool Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PoolStatCard
          title="Piscinas Ativas"
          value={24}
          icon={Droplets}
          status="ok"
        />

        <PoolStatCard
          title="pH Médio da Semana"
          value="7.2"
          unit="pH"
          icon={Thermometer}
          status="ok"
        />

        <PoolStatCard
          title="Manutenções Programadas"
          value={8}
          icon={Wrench}
          status="warning"
        />

        <PoolStatCard
          title="Equipamentos com Alerta"
          value={3}
          icon={AlertTriangle}
          status="critical"
        />
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Water Quality */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Qualidade da Água
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Cloro Residual</p>
                  <p className="text-sm text-green-700">
                    Última verificação: hoje
                  </p>
                </div>
              </div>
              <div className="text-xl font-bold text-green-900">1.2 ppm</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Thermometer className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Alcalinidade</p>
                  <p className="text-sm text-green-700">
                    Última verificação: hoje
                  </p>
                </div>
              </div>
              <div className="text-xl font-bold text-green-900">95 ppm</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-orange-900">Dureza Cálcica</p>
                  <p className="text-sm text-orange-700">Requer atenção</p>
                </div>
              </div>
              <div className="text-xl font-bold text-orange-900">280 ppm</div>
            </div>
          </div>
        </div>

        {/* Equipment Status */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Estado dos Equipamentos
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">
                    Bombas de Filtração
                  </p>
                  <p className="text-sm text-green-700">
                    18 unidades operacionais
                  </p>
                </div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-orange-900">
                    Sistemas de Dosagem
                  </p>
                  <p className="text-sm text-orange-700">
                    2 unidades com alerta
                  </p>
                </div>
              </div>
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-900">Aquecedores</p>
                  <p className="text-sm text-red-700">1 unidade crítica</p>
                </div>
              </div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Sistemas UV</p>
                  <p className="text-sm text-green-700">
                    12 unidades operacionais
                  </p>
                </div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Maintenance */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Manutenções Recentes
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-leirisonda-blue-light rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-leirisonda-blue" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Substituição de filtro - Piscina Municipal
                </p>
                <p className="text-sm text-muted-foreground">
                  Técnico: João Silva • 15/01/2024
                </p>
              </div>
            </div>
            <div className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
              Concluída
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Calibração pH - Hotel Azul
                </p>
                <p className="text-sm text-muted-foreground">
                  Técnico: Maria Santos • 14/01/2024
                </p>
              </div>
            </div>
            <div className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
              Em Curso
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-leirisonda-blue-light rounded-lg flex items-center justify-center">
                <Droplets className="w-4 h-4 text-leirisonda-blue" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Limpeza geral - Clube de Ténis
                </p>
                <p className="text-sm text-muted-foreground">
                  Técnico: António Costa • 13/01/2024
                </p>
              </div>
            </div>
            <div className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
              Concluída
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
