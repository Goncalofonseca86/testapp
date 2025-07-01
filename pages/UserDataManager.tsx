import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export function UserDataManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  // Only admin Gonçalo can access this page
  if (!user || user.email !== "gongonsilva@gmail.com") {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acesso Negado
          </h3>
          <p className="text-gray-600 mb-4">
            Esta página é exclusiva para o administrador principal.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  const exportUsers = () => {
    try {
      const users = localStorage.getItem("users");
      const passwords: { [key: string]: string } = {};

      if (users) {
        const parsedUsers = JSON.parse(users);

        // Collect all passwords
        parsedUsers.forEach((user: any) => {
          const password = localStorage.getItem(`password_${user.id}`);
          if (password) {
            passwords[user.id] = password;
          }
        });

        const exportData = {
          users: parsedUsers,
          passwords: passwords,
          exportDate: new Date().toISOString(),
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `leirisonda-users-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setMessage("Dados dos utilizadores exportados com sucesso!");
        setMessageType("success");
      } else {
        setMessage("Não existem utilizadores para exportar.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Erro ao exportar dados dos utilizadores.");
      setMessageType("error");
    }
  };

  const importUsers = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);

        if (importData.users && importData.passwords) {
          // Import users
          localStorage.setItem("users", JSON.stringify(importData.users));

          // Import passwords
          Object.entries(importData.passwords).forEach(([userId, password]) => {
            localStorage.setItem(`password_${userId}`, password as string);
          });

          setMessage(
            `${importData.users.length} utilizadores importados com sucesso!`,
          );
          setMessageType("success");
        } else {
          setMessage("Formato de ficheiro inválido.");
          setMessageType("error");
        }
      } catch (error) {
        setMessage("Erro ao importar dados. Verifique o ficheiro.");
        setMessageType("error");
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (
      confirm(
        "Tem a certeza que quer apagar todos os dados dos utilizadores? Esta ação não pode ser desfeita.",
      )
    ) {
      const users = localStorage.getItem("users");
      if (users) {
        const parsedUsers = JSON.parse(users);
        parsedUsers.forEach((user: any) => {
          localStorage.removeItem(`password_${user.id}`);
        });
      }
      localStorage.removeItem("users");

      setMessage("Todos os dados dos utilizadores foram apagados.");
      setMessageType("success");
    }
  };

  const getCurrentStats = () => {
    const users = localStorage.getItem("users");
    return users ? JSON.parse(users).length : 0;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestão de Dados
            </h1>
            <p className="text-gray-600 mt-2">
              Exporte e importe dados dos utilizadores entre dispositivos
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Voltar
          </Button>
        </div>

        {message && (
          <Alert variant={messageType === "error" ? "destructive" : "default"}>
            {messageType === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Status */}
          <div className="card-leirisonda p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Estado Atual</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Utilizadores registados neste dispositivo:{" "}
              <strong>{getCurrentStats()}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Os dados dos utilizadores ficam guardados no dispositivo. Para
              usar noutros dispositivos, exporte e importe os dados.
            </p>
          </div>

          {/* Export Data */}
          <div className="card-leirisonda p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Download className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold">Exportar Dados</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Descarregue um ficheiro com todos os utilizadores e palavras-passe
              para usar noutros dispositivos.
            </p>
            <Button onClick={exportUsers} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Exportar Utilizadores
            </Button>
          </div>

          {/* Import Data */}
          <div className="card-leirisonda p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Importar Dados</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Carregue um ficheiro de dados exportado para restaurar os
              utilizadores neste dispositivo.
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importUsers}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button className="w-full" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Ficheiro
              </Button>
            </div>
          </div>

          {/* Clear Data */}
          <div className="card-leirisonda p-6 border-red-200">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-700">
                Zona de Perigo
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Apagar permanentemente todos os dados dos utilizadores deste
              dispositivo.
            </p>
            <Button
              onClick={clearAllData}
              variant="destructive"
              className="w-full"
            >
              Apagar Todos os Dados
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
