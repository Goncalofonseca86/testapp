import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";

export function UsersList() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { users, deleteUser: deleteUserWithSync, isOnline } = useFirebaseSync();

  const deleteUser = async (userId: string) => {
    if (window.confirm("Tem a certeza que quer eliminar este utilizador?")) {
      try {
        console.log("🗑️ Deleting user with Firebase sync:", userId);
        await deleteUserWithSync(userId);

        // Remove local password keys
        const user = users.find((u) => u.id === userId);
        if (user) {
          const passwordKeys = [
            `password_${user.id}`,
            `password_${user.email}`,
            `password_${user.email?.trim().toLowerCase()}`,
          ];
          passwordKeys.forEach((key) => localStorage.removeItem(key));
          console.log("🔐 Removed password keys for user:", user.email);
        }

        console.log("✅ User deleted successfully");
      } catch (error) {
        console.error("❌ Error deleting user:", error);
        alert("Erro ao eliminar utilizador. Tente novamente.");
      }
    }
  };

  // Check if admin and specifically Gonçalo
  if (!currentUser || currentUser.email !== "gongonsilva@gmail.com") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Acesso Negado</h2>
        <p>Esta página é exclusiva para o administrador principal.</p>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>
            Utilizadores
            <span
              style={{
                marginLeft: "10px",
                fontSize: "14px",
                padding: "4px 8px",
                borderRadius: "12px",
                backgroundColor: isOnline ? "#d4edda" : "#f8d7da",
                color: isOnline ? "#155724" : "#721c24",
              }}
            >
              {isOnline ? "🔄 Sincronizado" : "📱 Local"}
            </span>
          </h1>
          <p style={{ color: "#666" }}>
            Gerir utilizadores e suas permissões
            {isOnline
              ? " (dados sincronizados automaticamente)"
              : " (modo offline)"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate("/user-sync-diagnostic")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            🔍 Diagnóstico
          </button>
          <button
            onClick={() => navigate("/create-user")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            + Novo Utilizador
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h3>Nenhum utilizador encontrado</h3>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Crie o primeiro utilizador para começar.
          </p>
          <button
            onClick={() => navigate("/create-user")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Criar Utilizador
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                border: "1px solid #ddd",
              }}
            >
              <div style={{ marginBottom: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "#007bff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      marginRight: "15px",
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>
                      {user.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#666" }}>
                    Papel:
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      backgroundColor:
                        user.role === "admin" ? "#fff3cd" : "#d4edda",
                      color: user.role === "admin" ? "#856404" : "#155724",
                    }}
                  >
                    {user.role === "admin" ? "Administrador" : "Utilizador"}
                  </span>
                </div>

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "14px", color: "#666" }}>
                    Permissões:
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                    {user.permissions
                      ? Object.values(user.permissions).filter(Boolean).length
                      : 0}{" "}
                    ativas
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/edit-user/${user.id}`)}
                >
                  ✏️ Editar
                </button>
                <button
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    color: "#dc3545",
                  }}
                  onClick={() => deleteUser(user.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
