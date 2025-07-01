# 📦 DEPLOY MANUAL - LEIRISONDA APP

## 🚨 PROBLEMA IDENTIFICADO:

As mudanças não estão a chegar do Builder.io → GitHub → Netlify

## 📱 SOLUÇÃO PARA IPHONE:

### OPÇÃO 1: Netlify Drop (Mais Fácil)

1. **Abre Safari** no iPhone
2. **Vai a:** https://app.netlify.com/drop
3. **Faz upload** da pasta `leirisonda-deploy` completa
4. **Aguarda** 2-3 minutos
5. **Vai a:** https://leirisonda.netlify.app
6. **Força refresh:** Puxa página para baixo

### OPÇÃO 2: GitHub Manual

1. **Abre GitHub** no Safari: https://github.com/GoncaloFonseca86/Builder-stellar-landing
2. **Clica "Add file"** → **"Upload files"**
3. **Faz upload** dos ficheiros:
   - client/pages/Login.tsx (novo)
   - client/pages/CreateMaintenance.tsx
   - client/pages/MaintenanceList.tsx
   - client/pages/MaintenanceDetail.tsx
   - client/pages/CreateIntervention.tsx
   - shared/types.ts
   - client/main.tsx
4. **Commit:** "Update to water cubicage system"
5. **Aguarda** deploy automático

## ✅ FICHEIROS PRONTOS EM leirisonda-deploy/:

- index.html (com login corrigido)
- manifest.json
- sw.js
- assets/index-DHnQ0z6C.css (novo)
- assets/index-Cf1crVxO.js (novo)

## 🆕 MUDANÇAS INCLUÍDAS:

- ✅ Login corrigido (sem tela preta)
- ✅ Botão "📱 Atualizar App"
- ✅ "Dimensões" → "Cubicagem de Água"
- ✅ Sistema completo de manutenção
- ✅ Gestão de intervenções
- ✅ PWA atualizada

## 🔗 LINKS IMPORTANTES:

- App: https://leirisonda.netlify.app
- Netlify Drop: https://app.netlify.com/drop
- GitHub: https://github.com/GoncaloFonseca86/Builder-stellar-landing
- Netlify Dashboard: https://app.netlify.com/sites/leirisonda

## ⚡ APÓS DEPLOY:

1. **Fecha** a PWA completamente
2. **Abre** de novo do ícone
3. **Força refresh** se necessário
4. **Testa:** Login → Manutenção → Nova Piscina → "Cubicagem"

## 🛠️ PROBLEMAS?

- Cache: Força refresh (puxa para baixo)
- PWA: Remove e reinstala do ecrã inicial
- Suporte: Contacta desenvolvedor
