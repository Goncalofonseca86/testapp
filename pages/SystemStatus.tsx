import React from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "react-router-dom";

export function SystemStatus() {
  const { user } = useAuth();
  const [checks, setChecks] = React.useState({
    localStorage: false,
    firebase: false,
    routing: false,
    auth: false,
  });

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    runSystemChecks();
  }, []);

  const runSystemChecks = async () => {
    setLoading(true);
    const newChecks = { ...checks };

    // Check localStorage
    try {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      newChecks.localStorage = true;
    } catch {
      newChecks.localStorage = false;
    }

    // Check Firebase
    try {
      const { auth, db } = await import("@/lib/firebase");
      newChecks.firebase = !!(auth && db);
    } catch {
      newChecks.firebase = false;
    }

    // Check routing
    newChecks.routing = !!window.location;

    // Check auth context
    try {
      const { useAuth } = await import("@/components/AuthProvider");
      newChecks.auth = true;
    } catch {
      newChecks.auth = false;
    }

    setChecks(newChecks);
    setLoading(false);
  };

  const getIcon = (status: boolean) => {
    if (loading)
      return <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />;
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatus = (status: boolean) => {
    if (loading) return "Verificando...";
    return status ? "✅ OK" : "❌ Erro";
  };

  const allSystemsOk = Object.values(checks).every(Boolean) && !loading;

  // Only admin Gonçalo can access this page
  if (!user || user.email !== "gongonsilva@gmail.com") {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">
              Esta página é exclusiva para o administrador principal.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <AlertCircle className="w-6 h-6 mr-2" />
            Status do Sistema
          </h1>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Armazenamento Local</span>
              <div className="flex items-center gap-2">
                {getIcon(checks.localStorage)}
                <span className="text-sm">
                  {getStatus(checks.localStorage)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Firebase</span>
              <div className="flex items-center gap-2">
                {getIcon(checks.firebase)}
                <span className="text-sm">{getStatus(checks.firebase)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Sistema de Routing</span>
              <div className="flex items-center gap-2">
                {getIcon(checks.routing)}
                <span className="text-sm">{getStatus(checks.routing)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Sistema de Autenticação</span>
              <div className="flex items-center gap-2">
                {getIcon(checks.auth)}
                <span className="text-sm">{getStatus(checks.auth)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg">
            {allSystemsOk ? (
              <div className="bg-green-50 text-green-800 p-3 rounded flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Todos os sistemas estão funcionais
              </div>
            ) : (
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {loading
                  ? "Verificando sistemas..."
                  : "Alguns sistemas apresentam problemas"}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={runSystemChecks}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Verificar Novamente"}
            </button>

            <button
              onClick={() => (window.location.href = "/login")}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Ir para Login
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Recarregar Página
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-500 space-y-1">
            <div>Versão: {import.meta.env.VITE_APP_VERSION || "1.0.0"}</div>
            <div>Ambiente: {import.meta.env.NODE_ENV}</div>
            <div>Hora: {new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
