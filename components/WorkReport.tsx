import React, { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  FileText,
  Share,
  Download,
  Mail,
  MessageCircle,
  Copy,
  Printer,
  Construction,
  User,
  MapPin,
  Clock,
  Calendar,
  Car,
  Users,
  Camera,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Activity,
  Zap,
  Shield,
  Target,
  Award,
  Info,
  Eye,
  Phone,
  Mail as MailIcon,
  Home,
  Building,
  Wrench,
  Settings,
} from "lucide-react";
import { Work } from "@shared/types";
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

interface WorkReportProps {
  work: Work;
  onClose?: () => void;
}

export function WorkReport({ work, onClose }: WorkReportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const getStatusLabel = (status: string) => {
    const labels = {
      pendente: "Pendente",
      em_progresso: "Em Progresso",
      concluida: "Concluída",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pendente":
        return {
          label: "Pendente",
          color: "bg-red-100 text-red-800",
          icon: Clock,
        };
      case "em_progresso":
        return {
          label: "Em Progresso",
          color: "bg-orange-100 text-orange-800",
          icon: Activity,
        };
      case "concluida":
        return {
          label: "Concluída",
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
        };
      default:
        return {
          label: status,
          color: "bg-gray-100 text-gray-800",
          icon: Info,
        };
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      piscina: "Piscina",
      manutencao: "Manutenção",
      avaria: "Avaria",
      montagem: "Montagem",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "piscina":
        return Building;
      case "manutencao":
        return Wrench;
      case "avaria":
        return AlertTriangle;
      case "montagem":
        return Settings;
      default:
        return Construction;
    }
  };

  const calculateWorkDuration = () => {
    if (!work.entryTime || !work.exitTime) return "N/A";

    try {
      const entry = new Date(work.entryTime);
      const exit = new Date(work.exitTime);
      const diff = exit.getTime() - entry.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}min`;
    } catch {
      return "N/A";
    }
  };

  // Helper function to process and include photos in PDF
  const createPhotoGallery = (photos: any[], title: string) => {
    if (!photos || photos.length === 0) return "";

    const photosHTML = photos
      .map(
        (photo, index) => `
        <div class="photo-item">
          <img src="${photo.url}" alt="${title} ${index + 1}" class="photo-img" crossorigin="anonymous" />
          <div class="photo-caption">${title} ${index + 1}</div>
        </div>
      `,
      )
      .join("");

    return `
      <div class="pdf-section">
        <div class="pdf-section-header">
          <div class="pdf-section-title">📸 ${title}</div>
        </div>
        <div class="pdf-section-content">
          <div class="pdf-photo-gallery">
            ${photosHTML}
          </div>
        </div>
      </div>

      <!-- Enhanced Work Summary -->
      <div class="pdf-card pdf-card-final-summary">
        <div class="pdf-card-header">
          <h3 class="pdf-card-title">📋 Resumo Final Detalhado</h3>
        </div>
        <div class="pdf-card-content">
          <div class="pdf-summary-grid">
            <div class="pdf-summary-item">
              <div class="pdf-summary-icon">📅</div>
              <div class="pdf-summary-details">
                <div class="pdf-summary-label">Data de Criação</div>
                <div class="pdf-summary-value">${format(new Date(work.createdAt), "dd/MM/yyyy", { locale: pt })}</div>
              </div>
            </div>
            <div class="pdf-summary-item">
              <div class="pdf-summary-icon">🏗️</div>
              <div class="pdf-summary-details">
                <div class="pdf-summary-label">Folha de Obra</div>
                <div class="pdf-summary-value">${work.workSheetNumber}</div>
              </div>
            </div>
            <div class="pdf-summary-item">
              <div class="pdf-summary-icon">📊</div>
              <div class="pdf-summary-details">
                <div class="pdf-summary-label">Folha Concluída</div>
                <div class="pdf-summary-value ${work.workSheetCompleted ? "text-green-600" : "text-red-600"}">${work.workSheetCompleted ? "✅ Sim" : "❌ Não"}</div>
              </div>
            </div>
            <div class="pdf-summary-item">
              <div class="pdf-summary-icon">📱</div>
              <div class="pdf-summary-details">
                <div class="pdf-summary-label">Contacto</div>
                <div class="pdf-summary-value">${work.contact}</div>
              </div>
            </div>
            <div class="pdf-summary-item">
              <div class="pdf-summary-icon">📄</div>
              <div class="pdf-summary-details">
                <div class="pdf-summary-label">Relatório Gerado</div>
                <div class="pdf-summary-value">${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}</div>
              </div>
            </div>
            <div class="pdf-summary-item">
              <div class="pdf-summary-icon">🔢</div>
              <div class="pdf-summary-details">
                <div class="pdf-summary-label">Versão</div>
                <div class="pdf-summary-value">v${format(new Date(), "yyyyMMdd.HHmm", { locale: pt })}</div>
              </div>
            </div>
          </div>

          <!-- Additional Summary Info -->
          <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #dc2626;">
            <h4 style="margin-bottom: 10px; color: #dc2626;">ℹ️ Informação Adicional</h4>
            <p style="margin: 5px 0;"><strong>Morada:</strong> ${work.address}</p>
            ${work.workPerformed ? `<p style="margin: 5px 0;"><strong>Trabalho realizado:</strong> Detalhado na secção anterior</p>` : '<p style="margin: 5px 0;"><strong>Trabalho realizado:</strong> Não especificado</p>'}
            ${work.observations ? `<p style="margin: 5px 0;"><strong>Observações:</strong> Incluídas no relatório</p>` : '<p style="margin: 5px 0;"><strong>Observações:</strong> Nenhuma observação registada</p>'}
            <p style="margin: 5px 0;"><strong>Fotos:</strong> ${work.photos ? work.photos.length : 0} fotos anexadas</p>
          </div>
        </div>
      </div>
    `;
  };

  const createWorkContent = () => {
    const workDuration = calculateWorkDuration();
    const statusInfo = getStatusInfo(work.status);
    const TypeIcon = getTypeIcon(work.type);

    return `
      <!-- Work Information -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">🏗️ Informações da Obra</div>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-card">
              <div class="label">Folha de Obra</div>
              <div class="value">${work.workSheetNumber}</div>
            </div>
            <div class="info-card">
              <div class="label">Tipo de Trabalho</div>
              <div class="value">${getTypeLabel(work.type)}</div>
            </div>
            <div class="info-card">
              <div class="label">Estado</div>
              <div class="value">${statusInfo.label}</div>
            </div>
            <div class="info-card">
              <div class="label">Data de Criação</div>
              <div class="value">${format(new Date(work.createdAt), "dd/MM/yyyy", { locale: pt })}</div>
            </div>
            <div class="info-card">
              <div class="label">Folha Obra</div>
              <div class="value">${work.workSheetCompleted ? "✅ Concluída" : "❌ Pendente"}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Client Information -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">👤 Informações do Cliente</div>
        </div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-card">
              <div class="label">Nome</div>
              <div class="value">${work.clientName}</div>
            </div>
            <div class="info-card">
              <div class="label">Contacto</div>
              <div class="value">${work.contact}</div>
            </div>
            <div class="info-card">
              <div class="label">Morada</div>
              <div class="value">${work.address}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timing Information Card -->
      <div class="pdf-card pdf-card-timing">
        <div class="pdf-card-header">
          <h3 class="pdf-card-title">⏰ Informações de Tempo</h3>
        </div>
        <div class="pdf-card-content">
          <div class="pdf-info-grid">
            <div class="pdf-info-item">
              <span class="pdf-info-label">Entrada:</span>
              <span class="pdf-info-value">${work.entryTime ? format(new Date(work.entryTime), "dd/MM/yyyy HH:mm", { locale: pt }) : "N/A"}</span>
            </div>
            <div class="pdf-info-item">
              <span class="pdf-info-label">Saída:</span>
              <span class="pdf-info-value">${work.exitTime ? format(new Date(work.exitTime), "dd/MM/yyyy HH:mm", { locale: pt }) : "N/A"}</span>
            </div>
            <div class="pdf-info-item">
              <span class="pdf-info-label">Duração:</span>
              <span class="pdf-info-value pdf-duration">${workDuration}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Team Information Card -->
      ${
        work.technicians && work.technicians.length > 0
          ? `
      <div class="pdf-card pdf-card-team">
        <div class="pdf-card-header">
          <h3 class="pdf-card-title">👥 Equipa de Trabalho</h3>
        </div>
        <div class="pdf-card-content">
          <div class="pdf-team-section">
            <h4 class="pdf-subsection-title">🔧 Técnicos</h4>
            <div class="pdf-team-list">
              ${work.technicians
                .map(
                  (tech) => `
                <div class="pdf-team-member">
                  <span class="pdf-team-icon">👨‍🔧</span>
                  <span class="pdf-team-name">${tech}</span>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>

          ${
            work.vehicles && work.vehicles.length > 0
              ? `
          <div class="pdf-team-section">
            <h4 class="pdf-subsection-title">🚐 Viaturas</h4>
            <div class="pdf-team-list">
              ${work.vehicles
                .map(
                  (vehicle) => `
                <div class="pdf-team-member">
                  <span class="pdf-team-icon">🚐</span>
                  <span class="pdf-team-name">${vehicle}</span>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>`
              : ""
          }
        </div>
      </div>`
          : ""
      }

      <!-- Work Performed Card -->
      ${
        work.workPerformed
          ? `
      <div class="pdf-card pdf-card-work">
        <div class="pdf-card-header">
          <h3 class="pdf-card-title">🔨 Trabalho Realizado</h3>
        </div>
        <div class="pdf-card-content">
          <div class="pdf-work-content">${work.workPerformed}</div>
        </div>
      </div>`
          : ""
      }

      <!-- Observations Card -->
      ${
        work.observations
          ? `
      <div class="pdf-card pdf-card-observations">
        <div class="pdf-card-header">
          <h3 class="pdf-card-title">📝 Observações</h3>
        </div>
        <div class="pdf-card-content">
          <div class="pdf-observations-content">${work.observations}</div>
        </div>
      </div>`
          : ""
      }

      <!-- Photos Section -->
      ${work.photos && work.photos.length > 0 ? createPhotoGallery(work.photos, "Fotos da Obra") : ""}

      <!-- Summary Card -->
      <div class="pdf-card pdf-card-summary">
        <div class="pdf-card-header">
          <h3 class="pdf-card-title">📊 Resumo da Obra</h3>
        </div>
        <div class="pdf-card-content">
          <div class="pdf-summary-grid">
            <div class="pdf-summary-item">
              <div class="pdf-summary-icon">🏗️</div>
              <div class="pdf-summary-details">
                <div class="pdf-summary-label">Tipo de Obra</div>
                <div class="pdf-summary-value">${getTypeLabel(work.type)}</div>
              </div>
            </div>
            <div class="pdf-summary-item">
              <div class="pdf-summary-icon">⏱️</div>
              <div class="pdf-summary-details">
                <div class="pdf-summary-label">Duração</div>
                <div class="pdf-summary-value">${workDuration}</div>
              </div>
            </div>
            <div class="pdf-summary-item">
              <div class="pdf-summary-icon">👥</div>
              <div class="pdf-summary-details">
                <div class="pdf-summary-label">Técnicos</div>
                <div class="pdf-summary-value">${work.technicians ? work.technicians.length : 0}</div>
              </div>
            </div>
            <div class="pdf-summary-item">
              <div class="pdf-summary-icon">📋</div>
              <div class="pdf-summary-details">
                <div class="pdf-summary-label">Estado</div>
                <div class="pdf-summary-value ${statusInfo.color.replace(/text-/, "color-").replace(/bg-/, "bg-")}">${statusInfo.label}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const generatePDFReport = async (shareMethod?: string, retryCount = 0) => {
    setIsGenerating(true);

    try {
      // Force fresh content generation
      const currentTimestamp = new Date().toISOString();
      console.log(
        `🔨 Gerando relatório de obra atualizado em: ${currentTimestamp}`,
      );

      const content = createWorkContent();

      const pdfData = {
        title: `Relatório de Obra Atualizado - ${work.clientName}`,
        subtitle: `Folha de Obra: ${work.workSheetNumber} • Atualizado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}`,
        date: format(new Date(work.createdAt), "dd/MM/yyyy", { locale: pt }),
        additionalInfo: `Tipo: ${getTypeLabel(work.type)} • Estado: ${getStatusInfo(work.status).label} • Versão: ${format(new Date(), "yyyyMMdd-HHmm", { locale: pt })}`,
      };

      const modernPDFStyles = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #ffffff;
          }

          .pdf-header-modern {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 32px;
            margin-bottom: 24px;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .pdf-main-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .pdf-subtitle {
            font-size: 18px;
            font-weight: 500;
            opacity: 0.9;
            margin-bottom: 8px;
          }

          .pdf-date {
            font-size: 14px;
            opacity: 0.8;
          }

          .pdf-ref-number {
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 8px;
          }

          .pdf-status-badge {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
          }

          .pdf-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 24px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
          }

          .pdf-card-header {
            background: #f8fafc;
            padding: 20px 24px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .pdf-card-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
          }

          .pdf-card-content {
            padding: 24px;
          }

          .pdf-card-primary .pdf-card-header { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); }
          .pdf-card-secondary .pdf-card-header { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
          .pdf-card-timing .pdf-card-header { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }
          .pdf-card-team .pdf-card-header { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
          .pdf-card-work .pdf-card-header { background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); }
          .pdf-card-observations .pdf-card-header { background: linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%); }
          .pdf-card-summary .pdf-card-header { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }

          .pdf-info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .pdf-info-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
          }

          .pdf-info-item-full {
            grid-column: 1 / -1;
          }

          .pdf-info-label {
            font-weight: 600;
            color: #6b7280;
            min-width: 120px;
          }

          .pdf-info-value {
            font-weight: 500;
            color: #1f2937;
            text-align: right;
          }

          .pdf-status-pendente {
            color: #dc2626;
            font-weight: 600;
          }

          .pdf-status-em_progresso {
            color: #ea580c;
            font-weight: 600;
          }

          .pdf-status-concluida {
            color: #059669;
            font-weight: 600;
          }

          .pdf-status-completed {
            color: #059669;
            font-weight: 600;
          }

          .pdf-status-pending {
            color: #dc2626;
            font-weight: 600;
          }

          .pdf-duration {
            color: #0ea5e9;
            font-weight: 600;
          }

          .pdf-team-section {
            margin-bottom: 20px;
          }

          .pdf-subsection-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }

          .pdf-team-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .pdf-team-member {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #f8fafc;
            border-radius: 6px;
            font-size: 13px;
          }

          .pdf-team-icon {
            font-size: 16px;
          }

          .pdf-team-name {
            font-weight: 500;
            color: #1f2937;
          }

          .pdf-work-content {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 16px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
            white-space: pre-wrap;
          }

          .pdf-observations-content {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.6;
            color: #374151;
            white-space: pre-wrap;
          }

          .pdf-photo-gallery {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }

          .pdf-photo-item {
            text-align: center;
          }

          .pdf-photo-img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
          }

          .pdf-photo-caption {
            font-size: 11px;
            color: #6b7280;
            margin-top: 8px;
          }

          .pdf-summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .pdf-summary-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }

          .pdf-summary-icon {
            font-size: 24px;
            flex-shrink: 0;
          }

          .pdf-summary-details {
            flex: 1;
          }

          .pdf-summary-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
          }

          .pdf-summary-value {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          }

          /* Color utilities */
          .bg-red-100 { background-color: #fee2e2; }
          .color-red-800 { color: #991b1b; }
          .bg-orange-100 { background-color: #ffedd5; }
          .color-orange-800 { color: #9a3412; }
          .bg-green-100 { background-color: #dcfce7; }
          .color-green-800 { color: #166534; }
          .bg-gray-100 { background-color: #f3f4f6; }
          .color-gray-800 { color: #1f2937; }

          @media print {
            .pdf-card { page-break-inside: avoid; }
            .pdf-team-section { page-break-inside: avoid; }
          }
        </style>
      `;

      const htmlContent = PDFGenerator.createModernReportHTML({
        type: "work",
        title: pdfData.title,
        subtitle: pdfData.subtitle,
        date: pdfData.date,
        content: content,
        additionalInfo: pdfData.additionalInfo,
      });

      const filename = `obra_${work.workSheetNumber.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd-HHmmss", { locale: pt })}.pdf`;
      console.log(`📥 Fazendo download da obra: ${filename}`);

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

  const renderWorkPreview = () => {
    const statusInfo = getStatusInfo(work.status);
    const StatusIcon = statusInfo.icon;
    const TypeIcon = getTypeIcon(work.type);
    const workDuration = calculateWorkDuration();

    return (
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TypeIcon className="h-6 w-6" />
                  {work.clientName}
                </h2>
                <p className="text-red-100 mt-1">
                  Folha de Obra: {work.workSheetNumber}
                </p>
              </div>
              <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                <StatusIcon className="h-4 w-4" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Work Info Card */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Construction className="h-5 w-5" />
              Informações da Obra
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Tipo de Trabalho</p>
                  <p className="font-semibold">{getTypeLabel(work.type)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Data de Criação</p>
                  <p className="font-semibold">
                    {format(new Date(work.createdAt), "dd/MM/yyyy", {
                      locale: pt,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-semibold">{work.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Contacto</p>
                  <p className="font-semibold">{work.contact}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Morada</p>
                  <p className="font-semibold">{work.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timing Card */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Informações de Tempo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Entrada</p>
                  <p className="font-semibold">
                    {work.entryTime
                      ? format(new Date(work.entryTime), "dd/MM/yyyy HH:mm", {
                          locale: pt,
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Saída</p>
                  <p className="font-semibold">
                    {work.exitTime
                      ? format(new Date(work.exitTime), "dd/MM/yyyy HH:mm", {
                          locale: pt,
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Duração</p>
                  <p className="font-semibold text-blue-600">{workDuration}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Information */}
        {(work.technicians && work.technicians.length > 0) ||
        (work.vehicles && work.vehicles.length > 0) ? (
          <Card>
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipa de Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {work.technicians && work.technicians.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                      <Users className="h-4 w-4 text-blue-500" />
                      Técnicos ({work.technicians.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {work.technicians.map((technician, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"
                        >
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">
                            {technician}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {work.vehicles && work.vehicles.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                      <Car className="h-4 w-4 text-green-500" />
                      Viaturas ({work.vehicles.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {work.vehicles.map((vehicle, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-green-50 rounded-lg"
                        >
                          <Car className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">{vehicle}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Work Performed */}
        {work.workPerformed && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Trabalho Realizado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {work.workPerformed}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        {work.photos && work.photos.length > 0 && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Fotos da Obra ({work.photos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {work.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.url}
                      alt={`Obra ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Observations */}
        {work.observations && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {work.observations}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumo da Obra
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <TypeIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Tipo</div>
                <div className="font-bold text-sm">
                  {getTypeLabel(work.type)}
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Duração</div>
                <div className="font-bold text-sm">{workDuration}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Técnicos</div>
                <div className="font-bold text-lg">
                  {work.technicians ? work.technicians.length : 0}
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Folha Obra</div>
                <div
                  className={`font-bold text-sm ${work.workSheetCompleted ? "text-green-600" : "text-red-600"}`}
                >
                  {work.workSheetCompleted ? "Concluída" : "Pendente"}
                </div>
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
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 border-0"
        >
          <FileText className="mr-2 h-4 w-4" />
          Relatório PDF Completo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Construction className="mr-2 h-6 w-6 text-red-600" />
            Relatório de Obra - {work.clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Preview */}
          <div className="lg:col-span-3">{renderWorkPreview()}</div>

          {/* Sidebar Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Informações do Relatório
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Folha de Obra
                    </p>
                    <p className="font-semibold">{work.workSheetNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cliente</p>
                    <p className="font-semibold">{work.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Tipo de Trabalho
                    </p>
                    <p className="font-semibold">{getTypeLabel(work.type)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Estado</p>
                    <Badge className={getStatusInfo(work.status).color}>
                      {getStatusInfo(work.status).label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gerar & Partilhar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => generatePDFReport("download")}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isGenerating ? "A gerar..." : "Descarregar PDF"}
                  </Button>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => generatePDFReport("email")}
                      disabled={isGenerating}
                      variant="outline"
                      size="sm"
                    >
                      <Mail className="mr-1 h-3 w-3" />
                      Email
                    </Button>
                    <Button
                      onClick={() => generatePDFReport("whatsapp")}
                      disabled={isGenerating}
                      variant="outline"
                      size="sm"
                    >
                      <MessageCircle className="mr-1 h-3 w-3" />
                      WhatsApp
                    </Button>
                  </div>

                  <Button
                    onClick={() => generatePDFReport("copy")}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Copiar Link
                  </Button>
                </CardContent>
              </Card>

              {isGenerating && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          Gerando PDF...
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Incluindo todas as fotos e informações detalhadas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
