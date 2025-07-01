import React, { useState } from "react";
import { Waves, Upload, Download, Smartphone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function MobileDeploy() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState("");

  const deployToNetlify = async () => {
    setIsDeploying(true);
    setDeployStatus("A preparar ficheiros...");

    try {
      // Create deployment files content
      const deploymentFiles = {
        "index.html": `<!doctype html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, minimal-ui" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Leirisonda" />
  <meta name="application-name" content="Leirisonda" />
  <meta name="theme-color" content="#007784" />
  <meta name="description" content="Sistema de gestão de obras e manutenção de piscinas da Leirisonda" />
  <link rel="manifest" href="/manifest.json" crossorigin="use-credentials" />
  <title>Leirisonda - Gestão de Obras</title>
  <script type="module" crossorigin src="/assets/index-Cf1crVxO.js"></script>
  <link rel="stylesheet" crossorigin href="/assets/index-DHnQ0z6C.css" />
</head>
<body>
  <div id="root"></div>
  <script>
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  </script>
</body>
</html>`,

        "manifest.json": JSON.stringify({
          name: "Leirisonda Obras",
          short_name: "Leirisonda",
          description: "Gestão de obras e manutenção de piscinas",
          start_url: "/",
          display: "standalone",
          background_color: "#1E40AF",
          theme_color: "#1E40AF",
          orientation: "portrait",
          scope: "/",
          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable any",
            },
          ],
          categories: ["business", "productivity"],
          lang: "pt-PT",
        }),

        "sw.js": `const CACHE_NAME = "leirisonda-v2";
const urlsToCache = ["/", "/assets/index-DHnQ0z6C.css", "/assets/index-Cf1crVxO.js", "/manifest.json"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});
self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});`,
      };

      setDeployStatus("A contactar Netlify...");

      // Simulate deployment (in reality, you'd use Netlify API)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setDeployStatus("✅ Deploy simulado concluído!");

      // Open Netlify Drop in new tab
      setTimeout(() => {
        window.open("https://app.netlify.com/drop", "_blank");
        setDeployStatus(
          "📱 Abre o Netlify Drop no Safari e faz upload manual da pasta leirisonda-deploy",
        );
      }, 1000);
    } catch (error) {
      setDeployStatus("❌ Erro no deploy: " + error);
    } finally {
      setIsDeploying(false);
    }
  };

  const downloadFiles = () => {
    // Create and download a deployment guide
    const guide = `
# 📱 Guia de Deploy Mobile - Leirisonda

## Como atualizar a app no iPhone:

### Opção 1: Netlify Drop (Recomendado)
1. Abre https://app.netlify.com/drop no Safari
2. Faz upload dos ficheiros da pasta leirisonda-deploy
3. Aguarda deploy (2-3 min)
4. App atualizada! 🎉

### Opção 2: GitHub (Automático no futuro)
1. Configura auto-sync Builder.io → GitHub
2. Só precisas de "Push Code" 
3. Deploy automático! ⚡

### Ficheiros atualizados:
- ✅ Cubicagem de Água (em vez de dimensões)
- ✅ Sistema de intervenções completo
- ✅ Nova manutenção de piscinas

### URLs importantes:
- App: https://leirisonda.netlify.app
- Netlify: https://app.netlify.com/drop
- GitHub: https://github.com/GoncaloFonseca86/Builder-stellar-landing

### Suporte:
- Em caso de dúvidas, contacta o desenvolvedor
- Logs disponíveis no Netlify dashboard
`;

    const blob = new Blob([guide], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leirisonda-deploy-guide.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass-card p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
            <Smartphone className="mr-3 h-8 w-8 text-blue-600" />
            Deploy Mobile - iPhone
          </h1>

          <div className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                <strong>📱 Estás no iPhone!</strong> Vou ajudar-te a atualizar a
                app com as mudanças da "Cubicagem de Água".
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button
                onClick={deployToNetlify}
                disabled={isDeploying}
                className="btn-primary w-full text-lg py-4"
              >
                <Upload className="mr-2 h-5 w-5" />
                {isDeploying ? "A processar..." : "🚀 Atualizar App Online"}
              </Button>

              <Button
                onClick={downloadFiles}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                📋 Descarregar Guia de Deploy
              </Button>

              <Button
                onClick={() =>
                  window.open("https://app.netlify.com/drop", "_blank")
                }
                variant="outline"
                className="w-full"
              >
                <Globe className="mr-2 h-4 w-4" />
                🌐 Abrir Netlify Drop
              </Button>
            </div>

            {deployStatus && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {deployStatus}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                🔄 O que vai ser atualizado:
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✅ "Dimensões" → "Cubicagem de Água"</li>
                <li>✅ Sistema completo de manutenção</li>
                <li>✅ Gestão de intervenções</li>
                <li>✅ Novos formulários e campos</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">
                ⚡ Deploy Automático (Futuro):
              </h3>
              <p className="text-yellow-700 text-sm">
                Depois de configurar o auto-sync, só precisas de "Push Code" no
                Builder.io e a app atualiza sozinha!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
