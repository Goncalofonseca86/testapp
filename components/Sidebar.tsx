import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Briefcase,
  Plus,
  Droplets,
  Users,
  LogOut,
  Menu,
  X,
  Waves,
  Settings,
  Activity,
  Building,
  Wrench,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Button } from "./ui/button";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Nova Obra", href: "/create-work", icon: Plus },
  { name: "Manutenção Piscinas", href: "/pool-maintenance", icon: Droplets },
];

const adminNavigation = [
  { name: "Utilizadores", href: "/users", icon: Users },
  { name: "Criar Utilizador", href: "/create-user", icon: Plus },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate("/");
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden mobile-menu-button">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className="bg-white shadow-lg hover-leirisonda"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Back button - positioned below menu button */}
      <div
        className="lg:hidden fixed z-50"
        style={{
          top: "max(env(safe-area-inset-top, 16px) + 76px, 116px)",
          left: "max(env(safe-area-inset-left, 16px) + 16px, 24px)",
        }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={handleGoBack}
          className="bg-white shadow-lg hover-leirisonda"
          title="Voltar à página anterior"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Leirisonda's official logo */}
          <div className="flex items-center p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-10 bg-white rounded-lg flex items-center justify-center shadow-md p-1">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2F9862202d056a426996e6178b9981c1c7?format=webp&width=800"
                  alt="Leirisonda Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Leirisonda</h1>
                <p className="text-sm text-gray-600 font-medium">
                  Gestão de Obras
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {/* Back button for desktop */}
            <button
              onClick={handleGoBack}
              className="nav-item-leirisonda mb-4"
              title="Voltar à página anterior"
            >
              <ArrowLeft className="mr-3 h-5 w-5" />
              Voltar
            </button>

            {navigation
              .filter((item) => {
                // Filtrar "Nova Obra" se o usuário não tem permissão para criar obras
                if (item.href === "/create-work") {
                  return user?.permissions.canCreateWorks;
                }
                return true;
              })
              .map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.href ||
                  (item.href === "/works" &&
                    location.pathname.startsWith("/works"));

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) onToggle();
                    }}
                    className={`nav-item-leirisonda ${isActive ? "active" : ""}`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}

            {/* Seção de Diagnóstico */}
            <div className="pt-4 pb-2">
              <div className="flex items-center px-4 py-2">
                <Activity className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Diagnóstico
                </span>
              </div>
            </div>

            {user?.email === "gongonsilva@gmail.com" && (
              <>
                <div className="pt-6 pb-2">
                  <div className="flex items-center px-4 py-2">
                    <Settings className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Administração
                    </span>
                  </div>
                </div>
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => {
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      className={`nav-item-leirisonda ${isActive ? "active" : ""}`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            {user && (
              <div className="section-leirisonda rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all duration-200"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Terminar Sessão
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
