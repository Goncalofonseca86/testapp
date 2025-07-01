#!/usr/bin/env node

// Script automático para deployment da Leirisonda
console.log("🚀 Preparando Leirisonda para deployment...");

const fs = require("fs");
const path = require("path");

// Verificar se o build existe
const buildPath = "./dist/spa";
if (!fs.existsSync(buildPath)) {
  console.log("❌ Build não encontrado. Execute: npm run build");
  process.exit(1);
}

console.log("✅ Build encontrado");

// Criar zip para upload
const archiver = require("archiver");

const output = fs.createWriteStream("leirisonda-app.zip");
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", function () {
  console.log("✅ leirisonda-app.zip criado (" + archive.pointer() + " bytes)");
  console.log("");
  console.log("📋 PRÓXIMOS PASSOS:");
  console.log("");
  console.log("1. Vai a: https://netlify.com");
  console.log("2. Arrasta o ficheiro leirisonda-app.zip");
  console.log("3. Copia o URL que aparecer");
  console.log("4. Vai a: https://pwabuilder.com");
  console.log('5. Cola o URL e clica "Start"');
  console.log('6. Clica "Package for Stores"');
  console.log("7. Download APK Android");
  console.log("");
  console.log("🎉 APP LEIRISONDA PRONTA!");
});

archive.on("error", function (err) {
  console.log("❌ Erro:", err);
});

archive.pipe(output);
archive.directory(buildPath, false);
archive.finalize();
