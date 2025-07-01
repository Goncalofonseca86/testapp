# Configuração Auto-Sync Builder.io → GitHub → Netlify

## 🎯 Objetivo

Sempre que fizeres "Push Code" no Builder.io, a app atualiza automaticamente online!

## 🔧 Passos para Configurar:

### 1. **GitHub Token** (Fazer uma vez)

1. Vai a **GitHub** → **Settings** → **Developer settings** → **Personal access tokens**
2. **Generate new token** → **Classic**
3. **Scopes:** Seleciona `repo`, `workflow`, `admin:repo_hook`
4. **Copia o token** (guarda num local seguro)

### 2. **Netlify Token** (Fazer uma vez)

1. Vai a **Netlify** → **User settings** → **Applications** → **Personal access tokens**
2. **New access token** → Dá um nome → **Generate token**
3. **Copia o token**

### 3. **GitHub Secrets** (Configurar uma vez)

No teu repositório GitHub:

1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret:**
   - Nome: `NETLIFY_AUTH_TOKEN`
   - Value: [token do Netlify]
3. **New repository secret:**
   - Nome: `NETLIFY_SITE_ID`
   - Value: `leirisonda` (site name)
4. **New repository secret:**
   - Nome: `GITHUB_TOKEN`
   - Value: [token do GitHub]

### 4. **Builder.io Integration** (Configurar uma vez)

No Builder.io:

1. **Settings** → **Integrations** → **GitHub**
2. **Connect** → Autoriza acesso ao repositório
3. **Repository:** `GoncaloFonseca86/Builder-stellar-landing`
4. **Branch:** `main`
5. **Auto-deploy:** ✅ Ativado

### 5. **Webhook Builder.io** (Opcional - para sync avançado)

1. **Builder.io** → **Settings** → **Webhooks**
2. **Add webhook:**
   - URL: `https://api.github.com/repos/GoncaloFonseca86/Builder-stellar-landing/dispatches`
   - Events: `content.publish`, `content.update`
   - Headers: (usar config do `builder-webhook.json`)

## 🚀 Como Funciona Depois:

1. **Fazes mudanças** no Builder.io
2. **Clicas "Push Code"**
3. **GitHub recebe** automaticamente ⚡
4. **GitHub Actions** faz build
5. **Netlify** faz deploy automático
6. **App atualizada** em 2-3 minutos! 🎉

## ✅ Vantagens:

- **Zero trabalho manual** depois da configuração
- **Deploys automáticos** sempre
- **Histórico completo** no GitHub
- **Rollback fácil** se houver problemas

## 🛠️ Troubleshooting:

- **Se não sincronizar:** Verifica tokens em GitHub Secrets
- **Se build falhar:** Verifica logs em GitHub Actions
- **Se deploy falhar:** Verifica Netlify logs

## 🔗 Links Úteis:

- GitHub Actions: `https://github.com/GoncaloFonseca86/Builder-stellar-landing/actions`
- Netlify Deploys: `https://app.netlify.com/sites/leirisonda/deploys`
- Builder.io Integrations: `https://builder.io/account/integrations`
