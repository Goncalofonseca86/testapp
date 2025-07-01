# 📱 GITHUB UPLOAD - Leirisonda (Passo a Passo)

## 🎯 OBJETIVO: Colocar aplicação Leirisonda no GitHub

A aplicação está **100% pronta** e funcional (como vê no login com logo)!

## 📱 MÉTODO 1: GitHub Mobile App

### **PASSO 1**: Download da App

- **iPhone**: App Store → "GitHub"
- **Android**: Google Play → "GitHub"

### **PASSO 2**: Login

- Abrir app GitHub
- Login com suas credenciais

### **PASSO 3**: Ir ao Repositório

- Procurar **"Builder-stellar-landing"**
- Ou ir aos **"Your repositories"**

### **PASSO 4**: Upload Ficheiros

- Tocar no **"+"** (plus icon)
- **"Upload files"**
- Selecionar os ficheiros principais (lista abaixo)

## 🌐 MÉTODO 2: GitHub Browser (Mais Fácil)

### **PASSO 1**: Abrir Browser

- Ir a **github.com**
- Login na conta

### **PASSO 2**: Ir ao Repositório

- **"Your repositories"**
- Clicar **"Builder-stellar-landing"**

### **PASSO 3**: Upload Files

- Clicar **"Add file"** → **"Upload files"**
- **Arrastar e largar** ficheiros
- Ou **"choose your files"**

## 📁 FICHEIROS ESSENCIAIS PARA UPLOAD

**Prioridade ALTA** (upload obrigatório):

```
📁 client/                    (pasta completa)
  ├── components/             (todos os componentes)
  ├── pages/                  (todas as páginas)
  ├── services/               (serviços de sync)
  └── main.tsx               (entrada da app)

📁 shared/
  └── types.ts              (tipos TypeScript)

📁 .github/workflows/        (deploy automático)
  ├── deploy.yml
  └── sync-builderio.yml

📄 netlify.toml             (config Netlify)
📄 package.json            (dependências)
```

**Prioridade MÉDIA** (para completar):

```
📁 dist/spa/               (build pronto)
📁 leirisonda-deploy/      (config deploy)
📄 index.html             (página principal)
📄 tailwind.config.ts     (estilos)
📄 vite.config.ts         (build config)
```

## ⚡ COMMIT MESSAGE

Quando fizer upload, usar esta mensagem:

```
🚀 Deploy complete Leirisonda pool management system

- Complete pool maintenance management
- Photo upload and gallery system
- Professional PDF reports
- Auto-sync data system
- Leirisonda branding integration
- Responsive mobile design
```

## 🔄 APÓS UPLOAD

1. **GitHub Actions** detecta automaticamente
2. **Build** da aplicação inicia
3. **Deploy no Netlify** automático
4. **Notificação** quando site fica online

## 📞 SUPORTE

Se tiver dificuldades:

- **GitHub Help**: help.github.com
- **Upload mobile**: Usar browser é mais fácil
- **Ficheiros grandes**: Upload em partes

## ✅ CONFIRMAÇÃO

Após upload, verificar:

- ✅ Ficheiros aparecem no repositório
- ✅ **Actions** tab mostra build a correr
- ✅ Netlify recebe deploy automático

**O site Leirisonda ficará online automaticamente!** 🎉

---

_Aplicação pronta: Sistema completo de gestão de piscinas_
