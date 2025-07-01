import React, { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Download, FileSpreadsheet, Calendar, CheckCircle } from "lucide-react";
import { Work } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";

export function ExportData() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // Load works from localStorage
      const storedWorks = localStorage.getItem("leirisonda_works");
      const works: Work[] = storedWorks ? JSON.parse(storedWorks) : [];

      if (works.length === 0) {
        alert("Não existem obras para exportar.");
        setIsExporting(false);
        return;
      }

      // Prepare data for Excel export
      const excelData = works.map((work, index) => ({
        Nº: index + 1,
        Cliente: work.client,
        Morada: work.address,
        Estado: getStatusLabel(work.status),
        "Data de Entrada": format(
          new Date(work.entryDate),
          "dd/MM/yyyy HH:mm",
          { locale: pt },
        ),
        "Data de Saída": work.exitDate
          ? format(new Date(work.exitDate), "dd/MM/yyyy HH:mm", {
              locale: pt,
            })
          : "",
        "Número de Fotografias": work.photos.length,
        "Data de Criação": format(
          new Date(work.createdAt),
          "dd/MM/yyyy HH:mm",
          { locale: pt },
        ),
        "Última Atualização": format(
          new Date(work.updatedAt),
          "dd/MM/yyyy HH:mm",
          { locale: pt },
        ),
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = [
        { wch: 5 }, // Nº
        { wch: 25 }, // Cliente
        { wch: 35 }, // Morada
        { wch: 12 }, // Estado
        { wch: 18 }, // Data de Entrada
        { wch: 18 }, // Data de Saída
        { wch: 15 }, // Número de Fotografias
        { wch: 18 }, // Data de Criação
        { wch: 18 }, // Última Atualização
      ];
      worksheet["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Obras");

      // Generate filename with current date
      const fileName = `leirisonda-obras-${format(
        new Date(),
        "yyyy-MM-dd",
      )}.xlsx`;

      // Export file
      XLSX.writeFile(workbook, fileName);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (error) {
      console.error("Export error:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "open":
        return "Aberta";
      case "in-progress":
        return "Em Curso";
      case "completed":
        return "Concluída";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Exportar Dados</h1>
        <p className="mt-2 text-muted-foreground">
          Exporte todos os dados das obras para ficheiro Excel
        </p>
      </div>

      {/* Export Card */}
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-leirisonda-blue-light rounded-full flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-8 h-8 text-leirisonda-blue" />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Exportar para Excel
              </h3>
              <p className="text-muted-foreground">
                Faça o download de todas as obras registadas no sistema num
                ficheiro Excel (.xlsx) com todas as informações detalhadas.
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 text-left">
              <h4 className="font-medium text-foreground mb-2">
                O ficheiro incluirá:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Nome do cliente</li>
                <li>• Morada completa</li>
                <li>• Estado atual da obra</li>
                <li>• Data e hora de entrada</li>
                <li>• Data e hora de saída (se aplicável)</li>
                <li>• Número total de fotografias</li>
                <li>• Datas de criação e última atualização</li>
              </ul>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isExporting ? (
                "A exportar..."
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar para Excel
                </>
              )}
            </Button>

            {exportSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Dados exportados com sucesso! O ficheiro foi descarregado para
                  a sua pasta de Downloads.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 bg-leirisonda-blue-light rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-leirisonda-blue mt-0.5" />
            <div>
              <h4 className="font-medium text-leirisonda-blue mb-1">
                Nome do Ficheiro
              </h4>
              <p className="text-sm text-leirisonda-blue/80">
                O ficheiro será nomeado automaticamente com a data atual:{" "}
                <code className="bg-white/50 px-1 py-0.5 rounded text-xs">
                  leirisonda-obras-{format(new Date(), "yyyy-MM-dd")}.xlsx
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
