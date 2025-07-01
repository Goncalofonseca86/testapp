import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  let authContext;
  try {
    authContext = useAuth();

    // Verificar se o contexto foi inicializado corretamente
    if (!authContext || typeof authContext.login !== "function") {
      throw new Error("AuthContext not properly initialized");
    }
  } catch (error) {
    console.error("❌ Erro ao acessar AuthContext:", error);

    // Se falhar múltiplas vezes, tentar recarregar a página
    const errorCount = parseInt(
      sessionStorage.getItem("login_auth_errors") || "0",
    );
    sessionStorage.setItem("login_auth_errors", String(errorCount + 1));

    if (errorCount >= 3) {
      console.warn("⚠️ Múltiplos erros de AuthContext, a recarregar...");
      sessionStorage.removeItem("login_auth_errors");
      setTimeout(() => window.location.reload(), 1000);
    }

    // Fallback seguro para evitar crash
    authContext = {
      user: null,
      login: async () => false,
      logout: () => {},
      isLoading: false,
      isInitialized: false,
      getAllUsers: () => [],
    };
  }

  const { user, login, isLoading, isInitialized } = authContext;

  // Aguardar inicialização se necessário
  if (!isInitialized && isLoading !== false) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, rgb(97, 165, 214) 0%, rgb(0, 119, 132) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          color: "white",
          fontSize: "18px",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(255, 255, 255, 0.3)",
              borderTop: "4px solid white",
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 1s linear infinite",
            }}
          />
          A inicializar sistema...
        </div>
      </div>
    );
  }

  // Se já está logado, redireciona
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      setIsSubmitting(false);
      return;
    }

    try {
      const success = await login(email, password);

      if (!success) {
        setError("Email ou palavra-passe incorretos.");
      }
    } catch (err) {
      setError("Erro ao iniciar sessão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgb(97, 165, 214) 0%, rgb(0, 119, 132) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Open Sans, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "white",
          borderRadius: "16px",
          boxShadow:
            "0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #2563eb, #0891b2)",
            padding: "32px",
            textAlign: "center",
            color: "white",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              background: "white",
              borderRadius: "20px",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=webp&width=800"
              alt="Leirisonda Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              color: "white",
            }}
          >
            Leirisonda
          </h1>
          <p
            style={{
              margin: 0,
              opacity: 0.9,
            }}
          >
            Sistema de Gestão de Obras
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email de acesso"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "12px 16px",
                  fontSize: "16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  outline: "none",
                  boxSizing: "border-box",
                  background: isSubmitting ? "#f9fafb" : "white",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Palavra-passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Palavra-passe"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    height: "48px",
                    padding: "12px 48px 12px 16px",
                    fontSize: "16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    outline: "none",
                    boxSizing: "border-box",
                    background: isSubmitting ? "#f9fafb" : "white",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6b7280",
                    fontSize: "18px",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#dc2626",
                  fontSize: "14px",
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                height: "48px",
                background: isSubmitting ? "#9ca3af" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "500",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isSubmitting ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid transparent",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  A entrar...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: "14px",
        }}
      >
        © 2025 Leirisonda - Sistema Avançado de Gestão de Obras
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
