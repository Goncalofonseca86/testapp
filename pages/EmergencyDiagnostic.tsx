import React, { useState, useEffect } from "react";

export function EmergencyDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<any>({});

  useEffect(() => {
    const runDiagnostics = () => {
      try {
        const results = {
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,

          // DOM checks
          domReady: document.readyState,
          rootElement: !!document.getElementById("root"),

          // Storage checks
          localStorageAvailable: typeof Storage !== "undefined",
          sessionStorageAvailable: typeof sessionStorage !== "undefined",

          // React checks
          reactAvailable: typeof React !== "undefined",
          reactDOMAvailable: typeof ReactDOM !== "undefined",

          // Local storage contents
          leirisondaUser: localStorage.getItem("leirisonda_user"),
          users: localStorage.getItem("users"),

          // Context checks
          contextError: null,

          // Network
          online: navigator.onLine,

          // Performance
          memoryUsage: (performance as any).memory
            ? {
                used: Math.round(
                  (performance as any).memory.usedJSHeapSize / 1024 / 1024,
                ),
                total: Math.round(
                  (performance as any).memory.totalJSHeapSize / 1024 / 1024,
                ),
                limit: Math.round(
                  (performance as any).memory.jsHeapSizeLimit / 1024 / 1024,
                ),
              }
            : "N/A",
        };

        // Test localStorage read/write
        try {
          localStorage.setItem("test_key", "test_value");
          const testRead = localStorage.getItem("test_key");
          localStorage.removeItem("test_key");
          results.localStorageReadWrite = testRead === "test_value";
        } catch (error) {
          results.localStorageReadWrite = false;
          results.localStorageError = String(error);
        }

        setDiagnostics(results);
      } catch (error) {
        setDiagnostics({
          error: String(error),
          stack: error instanceof Error ? error.stack : "No stack available",
        });
      }
    };

    runDiagnostics();
  }, []);

  const clearAllData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      alert("Dados limpos! A recarregar...");
      window.location.reload();
    } catch (error) {
      alert("Erro ao limpar dados: " + String(error));
    }
  };

  const reinstallUsers = () => {
    try {
      // Remove existing users
      localStorage.removeItem("users");
      localStorage.removeItem("leirisonda_user");

      // Remove all password keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("password_")) {
          localStorage.removeItem(key);
        }
      });

      // Add default users manually
      const users = [
        {
          id: "admin_goncalo",
          email: "gongonsilva@gmail.com",
          name: "Gonçalo Fonseca",
          role: "admin",
          permissions: {
            canViewWorks: true,
            canCreateWorks: true,
            canEditWorks: true,
            canDeleteWorks: true,
            canViewMaintenance: true,
            canCreateMaintenance: true,
            canEditMaintenance: true,
            canDeleteMaintenance: true,
            canViewUsers: true,
            canCreateUsers: true,
            canEditUsers: true,
            canDeleteUsers: true,
            canViewReports: true,
            canExportData: true,
            canViewDashboard: true,
            canViewStats: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "user_alexandre",
          email: "alexkamaryta@gmail.com",
          name: "Alexandre Fernandes",
          role: "user",
          permissions: {
            canViewWorks: true,
            canCreateWorks: false,
            canEditWorks: true,
            canDeleteWorks: false,
            canViewMaintenance: true,
            canCreateMaintenance: false,
            canEditMaintenance: true,
            canDeleteMaintenance: false,
            canViewUsers: false,
            canCreateUsers: false,
            canEditUsers: false,
            canDeleteUsers: false,
            canViewReports: true,
            canExportData: false,
            canViewDashboard: true,
            canViewStats: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      localStorage.setItem("users", JSON.stringify(users));

      // Set passwords
      localStorage.setItem("password_admin_goncalo", "19867gsf");
      localStorage.setItem("password_gongonsilva@gmail.com", "19867gsf");
      localStorage.setItem("password_user_alexandre", "69alexandre");
      localStorage.setItem("password_alexkamaryta@gmail.com", "69alexandre");

      alert("Utilizadores reinstalados! A recarregar...");
      window.location.reload();
    } catch (error) {
      alert("Erro ao reinstalar utilizadores: " + String(error));
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "monospace",
        background: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#b30229" }}>
        🔧 Diagnóstico de Emergência - Leirisonda
      </h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => (window.location.href = "/login")}
          style={{
            marginRight: "10px",
            padding: "10px 20px",
            background: "#007784",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Ir para Login
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginRight: "10px",
            padding: "10px 20px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Recarregar Página
        </button>
        <button
          onClick={reinstallUsers}
          style={{
            marginRight: "10px",
            padding: "10px 20px",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Reinstalar Utilizadores
        </button>
        <button
          onClick={clearAllData}
          style={{
            padding: "10px 20px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Limpar Todos os Dados
        </button>
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h2>Resultados do Diagnóstico:</h2>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: "500px",
            overflow: "auto",
          }}
        >
          {JSON.stringify(diagnostics, null, 2)}
        </pre>
      </div>

      <div
        style={{
          marginTop: "20px",
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h2>Instruções de Recuperação:</h2>
        <ol>
          <li>
            <strong>Primeiro:</strong> Clique "Reinstalar Utilizadores" para
            garantir que Gonçalo e Alexandre existem
          </li>
          <li>
            <strong>Segundo:</strong> Clique "Ir para Login" e tente fazer login
            com gongonsilva@gmail.com / 19867gsf
          </li>
          <li>
            <strong>Se não funcionar:</strong> Clique "Limpar Todos os Dados" e
            reinicie a aplicação
          </li>
          <li>
            <strong>Último recurso:</strong> Feche o browser completamente e
            abra novamente
          </li>
        </ol>
      </div>
    </div>
  );
}
