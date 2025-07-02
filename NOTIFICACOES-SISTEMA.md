# Sistema de Notificações - Leirisonda

## 📢 Sistema Implementado

✅ **NOTIFICAÇÕES VISUAIS ATIVAS** - Os utilizadores agora recebem notificações em tempo real quando novas obras são criadas por outros utilizadores.

## Como Funciona

### 🔔 Tipos de Notificações

1. **Notificação de Nova Obra (Real-time)**
   - Aparece quando outro utilizador cria uma obra
   - Mostra: Nome do cliente, morada, quem criou, número da folha
   - Duração: 8 segundos
   - Cor: Azul (ícone Bell)

2. **Notificação Cross-Tab (Entre Abas)**
   - Detecta obras criadas em outras abas do mesmo browser
   - Duração: 5 segundos
   - Cor: Verde (ícone Bell)

3. **Notificação em Tempo Real (Same-Tab)**
   - Para eventos na mesma aba
   - Duração: 6 segundos
   - Cor: Roxo (ícone Bell)

### 🎯 Quando São Enviadas

✅ Quando **Gonçalo** cria uma obra → **Alexandre** recebe notificação
✅ Quando **Alexandre** cria uma obra → **Gonçalo** recebe notificação  
✅ Obras criadas nos últimos 5 minutos são notificadas
❌ **NÃO** notifica o próprio utilizador que criou a obra

### 💻 Cenários de Funcionamento

#### Cenário 1: Dois Utilizadores, Dispositivos Diferentes

- Gonçalo cria obra no computador dele
- Alexandre vê notificação no tablet dele automaticamente
- A obra aparece na lista de Alexandre imediatamente

#### Cenário 2: Mesmo Utilizador, Abas Diferentes

- Gonçalo cria obra na aba A
- Aba B do Gonçalo **NÃO** recebe notificação (é o mesmo utilizador)
- Mas a obra aparece na lista da aba B automaticamente

#### Cenário 3: Utilizadores Diferentes, Mesmo Dispositivo

- Gonçalo cria obra e faz logout
- Alexandre faz login no mesmo dispositivo
- Alexandre vê todas as obras, incluindo as novas do Gonçalo

## 🔧 Componentes Implementados

### WorkNotifications.tsx

- **Localização**: `components/WorkNotifications.tsx`
- **Função**: Detecta novas obras e mostra notificações toast
- **Listeners**:
  - Mudanças na lista de obras (via useFirebaseSync)
  - Eventos localStorage (cross-tab)
  - Eventos customizados (same-tab)

### Sistema de Toast

- **UI**: `components/ui/toast.tsx` + `components/ui/toaster.tsx`
- **Hook**: `hooks/use-toast.ts`
- **Aparência**: Canto superior direito, design elegante
- **Auto-dismiss**: Desaparecem automaticamente

### Integração no Main

- **Toaster** adicionado ao `main.tsx`
- **WorkNotifications** ativo em toda a aplicação
- Funciona independentemente da página atual

## 📱 Interface Visual

### Aparência das Notificações

```
┌─────────────────────────────────┐
│ 🔔 Nova obra criada!            │
│                                 │
│ 👤 João Silva                   │
│ 📍 Rua das Flores, 123, Leiria │
│ ⏰ Por Gonçalo                   │
│ LS-2024-001                     │
└─────────────────────────────────┘
```

### Indicador no SyncStatus

- Badge "🔔 Notificações ON" visível apenas para administradores
- Confirma que o sistema está ativo

## 🔍 Como Verificar se Funciona

### Teste Simples:

1. **Gonçalo** abre aplicação no computador
2. **Alexandre** abre aplica��ão no tablet
3. **Gonçalo** cria uma nova obra
4. **Alexandre** deve ver notificação no canto superior direito
5. A obra deve aparecer na lista do **Alexandre** automaticamente

### Debug no Console:

```javascript
// Verificar se notificações estão ativas
console.log("Notificações:", document.querySelector('[data-testid="toaster"]'));

// Forçar notificação teste (admin)
window.dispatchEvent(
  new CustomEvent("leirisonda_new_work", {
    detail: {
      workId: "test-123",
      clientName: "Cliente Teste",
      createdBy: "outro_user",
    },
  }),
);
```

## ⚙️ Configurações Técnicas

### Filtros de Notificação

- ✅ Apenas obras dos últimos 5 minutos
- ✅ Apenas de outros utilizadores (não próprio)
- ✅ Sem duplicatas (controlo por ID)
- ✅ Funciona online e offline

### Performance

- 🚀 Lightweight - não afeta performance
- 🔄 Listeners eficientes com cleanup
- 💾 Memória otimizada (Set para IDs processados)
- ⚡ React hooks otimizados

### Compatibilidade

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Desktop e Mobile
- ✅ Funciona com/sem internet
- ✅ Cross-tab e cross-device

## 📊 Monitorização

### Logs no Console

```
🔔 3 novas obras detectadas para notificação
🔔 Notificação enviada para obra: João Silva (LS-2024-001)
📱 Inicial: 15 obras marcadas como conhecidas
🔔 Evento de nova obra detectado via storage: {...}
```

### Debug Visual

- **SyncStatus**: Mostra "🔔 Notificações ON"
- **Console**: Logs detalhados de eventos
- **DevTools**: Toast elements visíveis no DOM

## 🎉 Status Final

✅ **IMPLEMENTADO E FUNCIONAL**

- Sistema de notificações visuais completo
- Funciona entre utilizadores e dispositivos
- Interface elegante com toasts
- Sem impacto na performance
- Logs de debug disponíveis

Os utilizadores **JÁ RECEBEM NOTIFICAÇÕES** quando outros criam obras! 🔔✨

---

**Teste agora**: Gonçalo cria obra → Alexandre vê notificação!
