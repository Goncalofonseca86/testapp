import React, { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  FileText,
  Download,
  Mail,
  MessageCircle,
  Copy,
  Droplets,
  User,
  MapPin,
  Clock,
  Calendar,
  Thermometer,
  Beaker,
  Settings,
  Camera,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  Info,
  Eye,
  Phone,
  Mail as MailIcon,
  Home,
  Waves,
} from "lucide-react";
import { PoolMaintenance, MaintenanceIntervention } from "@shared/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PDFGenerator } from "@/lib/pdf-generator";

interface MaintenanceReportProps {
  maintenance: PoolMaintenance;
  intervention?: MaintenanceIntervention;
  onClose?: () => void;
}

export function MaintenanceReport({
  maintenance,
  intervention,
  onClose,
}: MaintenanceReportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Define work labels at component level to be accessible everywhere
  const workLabels = {
    filtros: "Limpeza de Filtros",
    preFiltero: "Pré-filtro",
    filtroAreiaVidro: "Filtro Areia/Vidro",
    enchimentoAutomatico: "Enchimento Automático",
    linhaAgua: "Linha de Água",
    limpezaFundo: "Limpeza do Fundo",
    limpezaParedes: "Limpeza das Paredes",
    limpezaSkimmers: "Limpeza dos Skimmers",
    verificacaoEquipamentos: "Verificação de Equipamentos",
    aspiracao: "Aspiração",
    escovagem: "Escovagem",
    limpezaFiltros: "Limpeza de Filtros",
    tratamentoAlgas: "Tratamento de Algas",
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

  const getWaterQualityStatus = (waterValues: any) => {
    const ph = waterValues.ph;
    const chlorine = waterValues.chlorine;
    if (ph >= 7.0 && ph <= 7.4 && chlorine >= 1.0 && chlorine <= 2.0) {
      return {
        label: "Excelente",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      };
    } else if (ph >= 6.8 && ph <= 7.6 && chlorine >= 0.8 && chlorine <= 2.5) {
      return {
        label: "Aceitável",
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertTriangle,
      };
    }
    return {
      label: "Requer Atenção",
      color: "bg-red-100 text-red-800",
      icon: AlertTriangle,
    };
  };

  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(`2000-01-01 ${start}`);
    const endTime = new Date(`2000-01-01 ${end}`);
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  const getProductPurpose = (productName: string) => {
    const purposes: Record<string, string> = {
      cloro: "Desinfeção da água",
      "ph+": "Aumentar pH",
      "ph-": "Diminuir pH",
      algicida: "Prevenç��o de algas",
      floculante: "Clarificação da água",
      cal: "Ajuste de alcalinidade",
      sal: "Eletrólise salina",
      estabilizador: "Proteção do cloro",
      clarificante: "Limpeza da água",
      choque: "Tratamento choque",
    };

    for (const [key, purpose] of Object.entries(purposes)) {
      if (productName.toLowerCase().includes(key)) {
        return purpose;
      }
    }
    return "Tratamento geral";
  };

  const createInterventionContent = () => {
    if (!intervention) return "";

    // Enhanced content with timestamp to force refresh
    const timestamp = new Date().toISOString();

    return `
      <!-- Cliente Section -->
      <div class="section-title">Cliente</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Nome</div>
          <div class="info-value">${maintenance.clientName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Telefone</div>
          <div class="info-value">${maintenance.clientPhone || "N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${maintenance.clientEmail || "N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Endereço</div>
          <div class="info-value">${maintenance.address}</div>
        </div>
      </div>

      <!-- Dados gerais -->
      <div class="section-title">Dados gerais</div>
      <div class="section-content">
        <div style="margin-bottom: 10px;">
          <strong>Identificação da piscina</strong><br>
          ${maintenance.poolName}
        </div>
        <div style="display: flex; gap: 20px; margin-bottom: 10px;">
          <div style="flex: 1;">
            <div style="font-size: 10px; color: #666;">Tipo de piscina</div>
            <div>${getPoolTypeLabel(maintenance.poolType)}</div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 10px; color: #666;">Volume</div>
            <div>${maintenance.waterCubicage || "N/A"} m³</div>
          </div>
        </div>
        <div style="margin-bottom: 10px;">
          <strong>Responsável pelo serviço</strong><br>
          ${intervention.technicians.join(", ")}
        </div>
      </div>

      <!-- Checklist -->
      <div class="section-title">Checklist</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40%;">Item</th>
            <th style="width: 30%;">Estado</th>
            <th style="width: 30%;">Observações</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Estado geral do equipamento</td>
            <td>Conforme</td>
            <td>Piscina apresenta boas condições de uso</td>
          </tr>
          <tr>
            <td>Sistema de circulação</td>
            <td>${intervention.workPerformed.filtros ? "Conforme" : "Verificado"}</td>
            <td></td>
          </tr>
          <tr>
            <td>Filtros</td>
            <td>${intervention.workPerformed.limpezaFiltros ? "Conforme" : "Verificado"}</td>
            <td></td>
          </tr>
          <tr>
            <td>Bombas</td>
            <td>Conforme</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <!-- Produtos químicos -->
      <div class="section-title">Produtos químicos</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 50%;">Produto</th>
            <th style="width: 25%;">Estado</th>
            <th style="width: 25%;">Observações</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nível de cloro</td>
            <td>Conforme</td>
            <td></td>
          </tr>
          <tr>
            <td>pH</td>
            <td>${intervention.waterValues.ph ? (intervention.waterValues.ph >= 7.0 && intervention.waterValues.ph <= 7.4 ? "Conforme" : "Não conforme") : "N/A"}</td>
            <td>${intervention.waterValues.ph ? (intervention.waterValues.ph >= 7.0 && intervention.waterValues.ph <= 7.4 ? "" : `pH acima de 7.6`) : ""}</td>
          </tr>
          <tr>
            <td>Alcalinidade total</td>
            <td>Conforme</td>
            <td></td>
          </tr>
          <tr>
            <td>Dureza cálcica</td>
            <td>N/A</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <!-- Serviços -->
      <div class="section-title">Serviços</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 70%;">Serviço</th>
            <th style="width: 30%;">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Limpeza das bordas e áreas adjacentes</td>
            <td>${intervention.workPerformed.linhaAgua ? "Conforme" : "Conforme"}</td>
          </tr>
          <tr>
            <td>Remoção de sujeiras da superfície</td>
            <td>Conforme</td>
          </tr>
          <tr>
            <td>Limpeza do tanque e paredes</td>
            <td>${intervention.workPerformed.limpezaParedes ? "Conforme" : "Conforme"}</td>
          </tr>
          <tr>
            <td>Decantação</td>
            <td>Conforme</td>
          </tr>
        </tbody>
      </table>

      <!-- Outros serviços realizados -->
      <div class="section-title">Outros serviços realizados</div>
      <div class="section-content">
        ${intervention.workPerformed.outros || intervention.observations || "Foi realizado serviço de limpeza e polimento nas escadas"}
      </div>

      <!-- Observações -->
      <div class="section-title">Observações</div>
      <div class="section-content" style="min-height: 40px;">
        ${intervention.observations || ""}
      </div>


    `;
  };

  const createMaintenanceContent = () => {
    const sortedInterventions = [...(maintenance.interventions || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const totalInterventions = sortedInterventions.length;
    const last30Days = sortedInterventions.filter(
      (i) => new Date(i.date).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).length;

    const pendingProblems = sortedInterventions
      .flatMap((i) => i.problems || [])
      .filter((p) => !p.resolved);

    return `
      <!-- Pool Information -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">🏊‍♂️ Informações da Piscina</div>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-card">
              <div class="label">Nome</div>
              <div class="value">${maintenance.poolName}</div>
            </div>
            <div class="info-card">
              <div class="label">Cliente</div>
              <div class="value">${maintenance.clientName}</div>
            </div>
            <div class="info-card">
              <div class="label">Contacto</div>
              <div class="value">${maintenance.clientPhone || "N/A"}</div>
            </div>
            <div class="info-card">
              <div class="label">Email</div>
              <div class="value">${maintenance.clientEmail || "N/A"}</div>
            </div>
            <div class="info-card">
              <div class="label">Morada</div>
              <div class="value">${maintenance.address}</div>
            </div>
            <div class="info-card">
              <div class="label">Tipo</div>
              <div class="value">${getPoolTypeLabel(maintenance.poolType)}</div>
            </div>
            <div class="info-card">
              <div class="label">Volume</div>
              <div class="value">${maintenance.waterCubicage || "N/A"} m³</div>
            </div>
            <div class="info-card">
              <div class="label">Estado</div>
              <div class="value">${maintenance.status === "ativa" ? "Ativa" : "Inativa"}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">📊 Estatísticas</div>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-card">
              <div class="label">Total Intervenções</div>
              <div class="value">${totalInterventions}</div>
            </div>
            <div class="info-card">
              <div class="label">Últimos 30 Dias</div>
              <div class="value">${last30Days}</div>
            </div>
            <div class="info-card">
              <div class="label">Problemas Pendentes</div>
              <div class="value">${pendingProblems.length}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Interventions -->
      ${
        sortedInterventions.length > 0
          ? `
      <div class="section">
        <div class="section-header">
          <div class="section-title">📅 Últimas Intervenções</div>
        </div>
        <div class="section-content">
          ${sortedInterventions
            .slice(0, 5)
            .map(
              (intervention, index) => `
            <div style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #0ea5e9;">
              <strong>${format(new Date(intervention.date), "dd/MM/yyyy", { locale: pt })}</strong> - ${intervention.timeStart} às ${intervention.timeEnd}<br>
              <small>Técnicos: ${intervention.technicians.join(", ")}</small><br>
              <small>pH: ${intervention.waterValues.ph || "N/A"} • Cloro: ${intervention.waterValues.chlorine || "N/A"} • ORP: ${intervention.waterValues.orp || "N/A"} • Sal: ${intervention.waterValues.salt || "N/A"}</small>
              ${intervention.observations ? `<br><small><em>Obs: ${intervention.observations}</em></small>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>`
          : ""
      }

      <!-- Pending Problems -->
      ${
        pendingProblems.length > 0
          ? `
      <div class="section">
        <div class="section-header">
          <div class="section-title">⚠️ Problemas Pendentes</div>
        </div>
        <div class="section-content">
          ${pendingProblems
            .map(
              (problem) => `
            <div style="margin-bottom: 10px; padding: 10px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
              ❌ ${problem.description}
              ${problem.priority ? `<br><small>Prioridade: ${problem.priority}</small>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>`
          : ""
      }
    `;
  };

  const generatePDFReport = async (shareMethod?: string) => {
    setIsGenerating(true);

    try {
      // Force fresh content generation with current timestamp
      const currentTimestamp = new Date().toISOString();
      console.log(`📋 Gerando relatório atualizado em: ${currentTimestamp}`);

      const content = intervention
        ? createInterventionContent()
        : createMaintenanceContent();

      const pdfData = {
        title: intervention
          ? `Relatório de Intervenção Atualizado - ${maintenance.poolName}`
          : `Relatório de Manutenção Completo - ${maintenance.poolName}`,
        subtitle: intervention
          ? `Intervenção de ${format(new Date(intervention.date), "dd/MM/yyyy", { locale: pt })} • Atualizado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}`
          : `Relatório geral da piscina • Atualizado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}`,
        date: intervention
          ? format(new Date(intervention.date), "dd/MM/yyyy", { locale: pt })
          : new Date().toLocaleDateString("pt-PT"),
        additionalInfo: `Cliente: ${maintenance.clientName} • Tipo: ${getPoolTypeLabel(maintenance.poolType)} • Volume: ${maintenance.waterCubicage || "N/A"} m³ • Versão: ${format(new Date(), "yyyyMMdd-HHmm", { locale: pt })}`,
      };

      const htmlContent = PDFGenerator.createModernReportHTML({
        type: "maintenance",
        title: pdfData.title,
        subtitle: pdfData.subtitle,
        date: pdfData.date,
        content: content,
        additionalInfo: pdfData.additionalInfo,
      });

      const filename = `${intervention ? "intervencao" : "manutencao"}_${maintenance.poolName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd-HHmmss", { locale: pt })}.pdf`;

      console.log(`📥 Fazendo download: ${filename}`);
      await PDFGenerator.downloadPDF(htmlContent, {
        title: pdfData.title,
        filename: filename,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        "Erro ao gerar PDF: " +
          (error instanceof Error ? error.message : "Erro desconhecido"),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const renderInterventionPreview = () => {
    if (!intervention) return null;

    const qualityStatus = getWaterQualityStatus(intervention.waterValues);
    const QualityIcon = qualityStatus.icon;

    return (
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Droplets className="h-6 w-6" />
                  {maintenance.poolName}
                </h2>
                <p className="text-blue-100 mt-1">
                  Intervenção de{" "}
                  {format(
                    new Date(intervention.date),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: pt },
                  )}
                </p>
              </div>
              <Badge
                className={`${qualityStatus.color} flex items-center gap-1`}
              >
                <QualityIcon className="h-4 w-4" />
                {qualityStatus.label}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Content cards - simplified for preview */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Resumo da Intervenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Data:</span>{" "}
                {format(new Date(intervention.date), "dd/MM/yyyy", {
                  locale: pt,
                })}
              </div>
              <div>
                <span className="font-medium">Duração:</span>{" "}
                {calculateDuration(
                  intervention.timeStart,
                  intervention.timeEnd,
                )}
              </div>
              <div>
                <span className="font-medium">Técnicos:</span>{" "}
                {intervention.technicians.join(", ")}
              </div>
              <div>
                <span className="font-medium">Estado Água:</span>{" "}
                {qualityStatus.label}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="font-medium">pH:</span>{" "}
                {intervention.waterValues.ph || "N/A"}
              </div>
              <div>
                <span className="font-medium">Cloro:</span>{" "}
                {intervention.waterValues.chlorine || "N/A"} ppm
              </div>
              <div>
                <span className="font-medium">ORP:</span>{" "}
                {intervention.waterValues.orp || "N/A"} mv
              </div>
              <div>
                <span className="font-medium">Sal:</span>{" "}
                {intervention.waterValues.salt || "N/A"} gr/lt
              </div>
              <div>
                <span className="font-medium">Temp:</span>{" "}
                {intervention.waterValues.temperature || "N/A"}°C
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMaintenancePreview = () => {
    const sortedInterventions = [...(maintenance.interventions || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return (
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Waves className="h-6 w-6" />
                  {maintenance.poolName}
                </h2>
                <p className="text-indigo-100 mt-1">
                  Relatório Geral de Manutenção
                </p>
              </div>
              <Badge className="bg-white text-indigo-600">
                <Activity className="h-4 w-4 mr-1" />
                {sortedInterventions.length} Intervenções
              </Badge>
            </div>
          </div>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Cliente:</span>{" "}
                {maintenance.clientName}
              </div>
              <div>
                <span className="font-medium">Tipo:</span>{" "}
                {getPoolTypeLabel(maintenance.poolType)}
              </div>
              <div>
                <span className="font-medium">Volume:</span>{" "}
                {maintenance.waterCubicage || "N/A"} m³
              </div>
              <div>
                <span className="font-medium">Total Intervenções:</span>{" "}
                {sortedInterventions.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border-0"
        >
          <FileText className="mr-2 h-4 w-4" />
          Relatório PDF Completo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Droplets className="mr-2 h-6 w-6 text-blue-600" />
            Relatório de {intervention ? "Intervenção" : "Manutenção"} -{" "}
            {maintenance.poolName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          {intervention
            ? renderInterventionPreview()
            : renderMaintenancePreview()}

          {/* Actions */}
          <div className="flex justify-center">
            <Button
              onClick={() => generatePDFReport("download")}
              disabled={isGenerating}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? "A gerar PDF..." : "Descarregar PDF Completo"}
            </Button>
          </div>

          {isGenerating && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">
                Gerando PDF com todas as informações...
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
