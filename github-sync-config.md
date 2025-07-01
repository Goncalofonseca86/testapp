# 🔧 RECONFIGURAÇÃO GITHUB - Builder.io

## 🎯 CONFIGURAÇÃO COMPLETA

### **PASSO 1: Reset Integração GitHub**

**No Builder.io:**

1. **Sidebar** → **Settings** (engrenagem)
2. **Integrations** → **GitHub**
3. **Disconnect** (se conectado)
4. **Clear cache/data**

### **PASSO 2: Reconnect GitHub**

1. **Connect to GitHub**
2. **Authorize Builder.io**
3. **Select Repository**: `GoncaloFonseca86/Builder-stellar-landing`
4. **Grant Permissions**:
   - ✅ Read repository
   - ✅ Write repository
   - ✅ Read/Write actions
   - ✅ Read/Write webhooks

### **PASSO 3: Configure Branch**

**Branch Settings:**

- **Default Branch**: `main`
- **Current Working**: `ai_main_92a33b97ea03`
- **Auto-sync**: ✅ Enabled
- **Auto-deploy**: ✅ Enabled

### **PASSO 4: Build Configuration**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/spa",
  "nodeVersion": "18",
  "environmentVariables": {
    "NODE_ENV": "production"
  }
}
```

### **PASSO 5: Test Connection**

1. **Test GitHub Connection**
2. **Verify Permissions**
3. **Test Push** (small change)
4. **Verify Webhook** working

## 🚨 TROUBLESHOOTING

### **Se ainda falhar:**

**Erro Token:**

- Regenerar GitHub Personal Access Token
- Scopes necessários: `repo`, `workflow`, `write:packages`

**Erro Permissions:**

- Verificar se é admin/owner do repositório
- Check organization settings

**Erro Branch:**

- Merger `ai_main_92a33b97ea03` → `main`
- Ou configurar Builder.io para usar branch atual

## 🔄 MERGE BRANCHES (Se necessário)

**Option A: Usar main branch**

```bash
git checkout main
git merge ai_main_92a33b97ea03
git push origin main
```

**Option B: Push current branch**

```bash
git push origin ai_main_92a33b97ea03:main --force
```

## ✅ VERIFICAÇÃO FINAL

Após reconfiguração:

1. **Push Code** deve mostrar ✅ Success
2. **GitHub** deve receber commits
3. **Actions** deve rodar automaticamente
4. **Netlify** deve fazer deploy

---

**RECOMENDAÇÃO**: Comece pelo **Step 1** - Disconnect GitHub no Builder.io!
