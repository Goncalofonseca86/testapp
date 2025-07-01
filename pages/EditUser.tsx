import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";

export function EditUser() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { users, updateUser: updateUserWithSync } = useFirebaseSync();
  const [user, setUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!currentUser || currentUser.email !== "gongonsilva@gmail.com") {
      navigate("/dashboard");
      return;
    }

    if (users.length > 0 && id) {
      const foundUser = users.find((u: any) => u.id === id);
      if (foundUser) {
        setUser(foundUser);
        setPermissions(foundUser.permissions || {});
      } else {
        setError("Utilizador não encontrado");
      }
    }
  }, [id, currentUser, navigate, users]);

  const handlePermissionChange = (permission: string, value: boolean) => {
    setPermissions((prev: any) => ({
      ...prev,
      [permission]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (user) {
        console.log("🔄 Updating user with Firebase sync:", user.id);

        // Update user with Firebase sync
        await updateUserWithSync(user.id, {
          permissions: permissions,
          updatedAt: new Date().toISOString(),
        });

        setSuccess(
          "Utilizador atualizado com sucesso! Dados sincronizados automaticamente.",
        );
        console.log("✅ User updated successfully with Firebase sync");

        setTimeout(() => {
          navigate("/users");
        }, 1500);
      }
    } catch (err) {
      console.error("❌ Error updating user:", err);
      setError("Erro ao atualizar utilizador. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>A carregar...</h2>
      </div>
    );
  }

  const permissionsList = [
    { key: "canViewWorks", label: "Ver Obras" },
    { key: "canCreateWorks", label: "Criar Obras" },
    { key: "canEditWorks", label: "Editar Obras" },
    { key: "canDeleteWorks", label: "Eliminar Obras" },
    { key: "canViewMaintenance", label: "Ver Manutenção" },
    { key: "canCreateMaintenance", label: "Criar Manutenção" },
    { key: "canEditMaintenance", label: "Editar Manutenção" },
    { key: "canDeleteMaintenance", label: "Eliminar Manutenção" },
    { key: "canViewUsers", label: "Ver Utilizadores" },
    { key: "canCreateUsers", label: "Criar Utilizadores" },
    { key: "canEditUsers", label: "Editar Utilizadores" },
    { key: "canDeleteUsers", label: "Eliminar Utilizadores" },
    { key: "canViewReports", label: "Ver Relatórios" },
    { key: "canExportData", label: "Exportar Dados" },
    { key: "canViewDashboard", label: "Ver Dashboard" },
    { key: "canViewStats", label: "Ver Estatísticas" },
  ];

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <button
          onClick={() => navigate("/users")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #ddd",
            borderRadius: "5px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← Voltar
        </button>

        <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>
          Editar Utilizador
        </h1>
        <p style={{ color: "#666" }}>Gerir permissões de {user.name}</p>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "10px" }}>Informações do Utilizador</h3>
          <p>
            <strong>Nome:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Papel:</strong>{" "}
            {user.role === "admin" ? "Administrador" : "Utilizador"}
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "#d4edda",
            color: "#155724",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginBottom: "20px" }}>Permissões</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
            }}
          >
            {permissionsList.map((perm) => (
              <label
                key={perm.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={permissions[perm.key] || false}
                  onChange={(e) =>
                    handlePermissionChange(perm.key, e.target.checked)
                  }
                  style={{ marginRight: "10px" }}
                />
                {perm.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "12px 24px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "A guardar..." : "Guardar Alterações"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/users")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
