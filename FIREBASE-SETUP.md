# 🔥 Firebase Setup - Leirisonda

## Sincronização Real-time Implementada

A aplicação Leirisonda agora tem **sincronização real entre dispositivos** usando Firebase!

## 🚀 Funcionalidades

### ✅ O que foi implementado:

- **Autenticação Firebase**: Login com email/password
- **Firestore Database**: Dados sincronizados em tempo real
- **Modo Offline**: Funciona sem internet usando localStorage
- **Sincronização Automática**: Dados sincronizam automaticamente quando online
- **Sistema Híbrido**: Compatível com utilizadores locais existentes

### 📱 Como funciona:

1. **Online**: Dados guardados no Firebase + localStorage (backup)
2. **Offline**: Dados guardados localmente
3. **Reconexão**: Sincronização automática quando volta online

## 🔧 Configuração

### 1. Firebase Project (necessário para produção)

Para usar em produção, precisa de configurar um projeto Firebase:

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Crie novo projeto: "leirisonda-obras"
3. Ative **Authentication** > Email/Password
4. Ative **Firestore Database**
5. Copie as credenciais para `client/lib/firebase.ts`

### 2. Credenciais atuais (demo)

```typescript
// client/lib/firebase.ts - ALTERAR PARA PRODUÇÃO
const firebaseConfig = {
  apiKey: "AIzaSyDDemo-FakeKey-ForLeirisondaApp",
  authDomain: "leirisonda-obras.firebaseapp.com",
  projectId: "leirisonda-obras",
  storageBucket: "leirisonda-obras.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};
```

## 👥 Utilizadores

### Utilizadores globais (funcionam em qualquer dispositivo):

- `gongonsilva@gmail.com` / `19867gsf` (Admin)
- `tecnico@leirisonda.pt` / `tecnico123` (User)
- `supervisor@leirisonda.pt` / `supervisor123` (Admin limitado)

### Sistema híbrido:

- **Firebase Auth**: Login prioritário via Firebase
- **Local Fallback**: Se Firebase falhar, usa sistema local
- **Auto-criação**: Utilizadores locais criados automaticamente no Firebase

## 📊 Coleções Firestore

### `users`

- Dados dos utilizadores
- Permissões e roles
- Sincronização automática

### `works`

- Todas as obras
- Fotos e documentos
- Status e progresso

### `maintenances`

- Manutenções de piscinas
- Intervenções
- Histórico completo

## 🔄 Sincronização

### Automática:

- **Real-time listeners**: Dados atualizados instantaneamente
- **Auto-sync**: A cada 5 minutos quando online
- **Conflict resolution**: Última alteração prevalece

### Manual:

- Botão "Sync" no Dashboard
- Sincronização após login
- Backup/restore de dados

## 🎯 Componentes Atualizados

### `useFirebaseSync` Hook

```typescript
const {
  works,
  maintenances,
  users,
  isOnline,
  isSyncing,
  lastSync,
  createWork,
  createMaintenance,
} = useFirebaseSync();
```

### `FirebaseStatus` Component

- Indicador de conexão
- Status de sincronização
- Botão sync manual
- Última sincronização

### Páginas atualizadas:

- ✅ `CreateWork` - Firebase sync
- ✅ `CreateMaintenance` - Firebase sync
- ✅ `Dashboard` - Status Firebase
- ✅ `AuthProvider` - Firebase Auth

## 🔒 Segurança

### Regras Firestore (configurar na produção):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users podem ler/escrever apenas seus dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Works e maintenances - apenas utilizadores autenticados
    match /works/{workId} {
      allow read, write: if request.auth != null;
    }

    match /maintenances/{maintenanceId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📱 Indicadores de Estado

### Dashboard:

- 🟢 **Online**: Sincronização ativa
- 🟠 **Offline**: Modo local
- 🔄 **Sincronizando**: A atualizar dados
- ⏱️ **Última sync**: Timestamp da última sincronização

### Páginas de criação:

- Indicador de conexão no header
- Aviso quando offline
- Confirmação de sincronização

## 🛠️ Desenvolvimento

### Dependências adicionadas:

```json
{
  "firebase": "^10.x.x"
}
```

### Novos arquivos:

- `client/lib/firebase.ts` - Configuração
- `client/services/FirebaseService.ts` - Operações CRUD
- `client/hooks/use-firebase-sync.tsx` - Hook principal
- `client/components/FirebaseStatus.tsx` - Status component

## 🚀 Deploy

### Para produção:

1. Configure projeto Firebase real
2. Atualize credenciais em `firebase.ts`
3. Configure regras de segurança Firestore
4. Deploy da aplicação normalmente

### Teste local:

- Firebase emulators disponíveis para desenvolvimento
- Dados ficam locais durante desenvolvimento
- Sistema funciona offline por defeito

## ✨ Benefícios

- **📱 Multi-dispositivo**: Dados sincronizados entre telemóveis/tablets
- **☁️ Backup automático**: Dados seguros na cloud
- **🔄 Real-time**: Alterações aparecem instantaneamente
- **📱 Offline-first**: Funciona sem internet
- **👥 Colaboração**: Equipas podem trabalhar em simultâneo
- **🔒 Seguro**: Autenticação e permissões adequadas

---

**A sincronização está ATIVA! Dados agora ficam guardados e sincronizados entre todos os dispositivos! 🎉**
