import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-leirisonda-blue-light to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="mx-auto w-16 h-16 bg-leirisonda-blue rounded-2xl flex items-center justify-center mb-6">
          <Waves className="w-8 h-8 text-white" />
        </div>

        {/* 404 Error */}
        <div>
          <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Página não encontrada
          </h2>
          <p className="text-muted-foreground">
            A página que procura não existe ou foi removida.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Página Anterior
            </Link>
          </Button>
        </div>

        {/* Help */}
        <div className="pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Se continuar a ter problemas, entre em contacto com o suporte
            técnico.
          </p>
        </div>
      </div>
    </div>
  );
}
