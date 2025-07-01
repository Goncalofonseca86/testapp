import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Save,
  ArrowLeft,
  AlertCircle,
  Shield,
  Settings,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  FileText,
  Download,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { User as UserType, UserPermissions } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirebaseSync } from "@/hooks/use-firebase-sync";

export function CreateUser() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createUser: createUserWithSync, users } = useFirebaseSync();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as "admin" | "user",
  });

  const [permissions, setPermissions] = useState<UserPermissions>({
    canViewWorks: true,
    canCreateWorks: false,
    canEditWorks: false,
    canDeleteWorks: false,
    canViewMaintenance: true,
    canCreateMaintenance: false,
    canEditMaintenance: false,
    canDeleteMaintenance: false,
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewReports: false,
    canExportData: false,
    canViewDashboard: true,
    canViewStats: true,
  });

  // Only admin Gonçalo can access this page
  if (!user || user.email !== "gongonsilva@gmail.com") {
    return (
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
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    // Validation
    if (!formData.name.trim()) {
      setError("Por favor, introduza o nome do utilizador.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Por favor, introduza o email.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.password) {
      setError("Por favor, introduza a palavra-passe.");
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As palavras-passe não coincidem.");
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("A palavra-passe deve ter pelo menos 6 caracteres.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Check if user already exists
      if (users.find((u) => u.email === formData.email)) {
        setError("Já existe um utilizador com este email.");
        setIsSubmitting(false);
        return;
      }

      // Create new user data
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(), // Normalize email
        role: formData.role,
        permissions:
          formData.role === "admin"
            ? {
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
              }
            : permissions,
        updatedAt: new Date().toISOString(),
      };

      // Create user with Firebase sync
      console.log("🔄 Creating user with Firebase sync:", userData.name);
      const newUserId = await createUserWithSync(userData);

      // Save password with multiple keys for maximum compatibility (local authentication)
      const passwordKeys = [
        `password_${newUserId}`,
        `password_${userData.email}`,
        `password_${userData.email.trim().toLowerCase()}`,
        `password_${formData.email.trim().toLowerCase()}`,
      ];

      // Remove duplicates and save to all keys
      const uniqueKeys = [...new Set(passwordKeys)];
      uniqueKeys.forEach((key) => {
        localStorage.setItem(key, formData.password);
        console.log(`🔐 Saved password to key: ${key}`);
      });

      console.log("✅ User created successfully with Firebase sync:", {
        id: newUserId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        passwordKeysCreated: uniqueKeys,
      });

      setSuccess(
        `Utilizador criado com sucesso! Email: ${userData.email} - Pode agora fazer login. Dados sincronizados automaticamente.`,
      );

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "user",
      });
      setPermissions({
        canViewWorks: true,
        canCreateWorks: false,
        canEditWorks: false,
        canDeleteWorks: false,
        canViewMaintenance: true,
        canCreateMaintenance: false,
        canEditMaintenance: false,
        canDeleteMaintenance: false,
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canViewReports: false,
        canExportData: false,
        canViewDashboard: true,
        canViewStats: true,
      });
    } catch (err) {
      setError("Erro ao criar utilizador. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Criar Novo Utilizador
          </h1>
          <p className="mt-1 text-gray-600">
            Adicione um novo utilizador ao sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Informações do Utilizador
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Nome Completo *
              </Label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Ex: João Silva"
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email *
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="joao@exemplo.com"
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="role"
                className="text-sm font-medium text-gray-700"
              >
                Tipo de Utilizador *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "user") =>
                  updateFormData("role", value)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilizador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Palavra-passe *
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirmar Palavra-passe *
                </Label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateFormData("confirmPassword", e.target.value)
                    }
                    placeholder="••••••••"
                    className="pl-10"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            {formData.role === "user" && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Permissões do Utilizador
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Obras Permissions */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-blue-600" />
                      Gestão de Obras
                    </h4>
                    <div className="space-y-3 pl-6">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canViewWorks}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canViewWorks: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Ver obras</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canCreateWorks}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canCreateWorks: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          Criar obras
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canEditWorks}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canEditWorks: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          Editar obras
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canDeleteWorks}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canDeleteWorks: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">
                          Eliminar obras
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Maintenance Permissions */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Settings className="w-4 h-4 mr-2 text-green-600" />
                      Manutenção
                    </h4>
                    <div className="space-y-3 pl-6">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canViewMaintenance}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canViewMaintenance: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">
                          Ver manutenção
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canCreateMaintenance}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canCreateMaintenance: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">
                          Criar manutenção
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canEditMaintenance}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canEditMaintenance: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">
                          Editar manutenção
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canDeleteMaintenance}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canDeleteMaintenance: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">
                          Eliminar manutenção
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Dashboard Permissions */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2 text-purple-600" />
                      Dashboard & Relatórios
                    </h4>
                    <div className="space-y-3 pl-6">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canViewDashboard}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canViewDashboard: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">
                          Ver dashboard
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canViewStats}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canViewStats: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">
                          Ver estatísticas
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canViewReports}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canViewReports: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">
                          Ver relatórios
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canExportData}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canExportData: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">
                          Exportar dados
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Users Permissions */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <User className="w-4 h-4 mr-2 text-orange-600" />
                      Utilizadores
                    </h4>
                    <div className="space-y-3 pl-6">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canViewUsers}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canViewUsers: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">
                          Ver utilizadores
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canCreateUsers}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canCreateUsers: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">
                          Criar utilizadores
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canEditUsers}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canEditUsers: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">
                          Editar utilizadores
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={permissions.canDeleteUsers}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              canDeleteUsers: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">
                          Eliminar utilizadores
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <UserPlus className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  "A criar..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Criar Utilizador
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
