# 📱 Sincronizar Leirisonda com GitHub (Mobile/Tablet)

## 🚀 Status: Aplicação 100% Pronta

A aplicação Leirisonda está **completamente desenvolvida** e funcional com:

- ✅ Sistema de gestão de piscinas completo
- ✅ Upload de fotos e galerias
- ✅ Relatórios profissionais PDF
- ✅ Sincronização automática de dados
- ✅ Logo Leirisonda integrado
- ✅ Interface responsiva

## 📲 Opções para Sincronizar (SEM PC)

### **OPÇÃO 1: GitHub Mobile App**

1. **Baixar GitHub App** no telemóvel/tablet
2. **Login** na conta GitHub
3. **Ir ao repositório** `Builder-stellar-landing`
4. **Upload manual** dos ficheiros principais
5. **Commit** - deploy automático ativa

### **OPÇÃO 2: GitHub Web Browser**

1. **Abrir GitHub.com** no browser
2. **Login** na conta
3. **Ir ao repositório**
4. **Upload files** (arrastar e largar)
5. **Commit changes** - deploy automático

### **OPÇÃO 3: Netlify Direct Deploy**

1. **Ir a netlify.com**
2. **Login** na conta Netlify
3. **Sites** → **Add new site** → **Deploy manually**
4. **Arrastar pasta** `dist/spa` completa
5. **Deploy** direto (bypass GitHub)

## 📁 Ficheiros Essenciais para Upload

Se usar GitHub manual, subir estes ficheiros-chave:

```
📁 client/          (toda a pasta)
📁 shared/          (toda a pasta)
📁 .github/         (workflows de deploy)
📁 dist/spa/        (aplicação compilada)
📁 leirisonda-deploy/
📄 netlify.toml     (config Netlify)
📄 package.json     (dependências)
```

## 🔗 Links Úteis

- **GitHub Mobile**: https://github.com/mobile
- **Netlify**: https://app.netlify.com
- **GitHub Web**: https://github.com

## ⚡ Deploy Automático Configurado

Quando os ficheiros chegarem ao GitHub:

1. **GitHub Actions** detecta mudanças
2. **Build automático** da aplicação
3. **Deploy no Netlify** automaticamente
4. **Site live** em poucos minutos

## 💡 Recomendação

**Mais fácil**: Usar **Netlify Direct Deploy** com a pasta `dist/spa` - site fica online imediatamente sem precisar GitHub!

---

_Aplicação pronta por Builder.io Assistant_
