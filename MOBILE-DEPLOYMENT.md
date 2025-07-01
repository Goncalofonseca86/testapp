# 📱 Leirisonda - App Nativa

A aplicação Leirisonda foi convertida para **app nativa** usando Capacitor! Agora podes criar apps reais para iOS e Android.

## 🚀 Como compilar a app

### 1. **Preparar o projeto**

```bash
npm run build        # Compila a web app
npx cap sync         # Sincroniza com projetos nativos
```

### 2. **Para iOS (iPhone/iPad)**

**Requisitos:**

- macOS
- Xcode instalado
- iPhone Developer Account (para testar em dispositivo real)

**Passos:**

```bash
npx cap open ios
```

- Abre o Xcode automaticamente
- Conecta o iPhone via USB
- Selecciona o dispositivo no Xcode
- Clica "Build & Run" ▶️

### 3. **Para Android**

**Requisitos:**

- Android Studio instalado
- Android SDK
- Dispositivo Android em modo desenvolvedor

**Passos:**

```bash
npx cap open android
```

- Abre Android Studio automaticamente
- Conecta dispositivo Android via USB
- Activa "Depuração USB" no dispositivo
- Clica "Run" ▶️

## 📋 Funcionalidades da App Nativa

✅ **Funciona offline** - Cache automático  
✅ **Ícone nativo** - Aparece no ecrã inicial  
✅ **Splash screen** - Ecra de loading da Leirisonda  
✅ **Sem browsers** - App completamente independente  
✅ **App Stores** - Pode ser publicada nas lojas

## 🏪 Para publicar nas App Stores

### **App Store (iOS)**

1. Build da app no Xcode
2. Archive & Upload to App Store Connect
3. Submeter para review da Apple

### **Google Play (Android)**

1. Build signed APK no Android Studio
2. Upload to Google Play Console
3. Submeter para review do Google

## 🔧 Configurações importantes

**Arquivo:** `capacitor.config.ts`

- App ID: `com.leirisonda.obras`
- Nome: "Leirisonda - Gestão de Obras"
- Cores da Leirisonda configuradas

## ⚡ Comandos úteis

```bash
# Rebuild e sync
npm run build && npx cap sync

# Apenas iOS
npx cap copy ios && npx cap open ios

# Apenas Android
npx cap copy android && npx cap open android

# Verificar plugins
npx cap ls
```

## 🎨 Personalização

Para alterar:

- **Ícone da app:** Substituir ficheiros em `ios/App/App/Assets.xcassets/` e `android/app/src/main/res/`
- **Splash screen:** Editar configuração em `capacitor.config.ts`
- **Nome da app:** Alterar `appName` no config

---

**🎉 Parabéns! A Leirisonda é agora uma app nativa verdadeira!**
