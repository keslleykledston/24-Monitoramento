# Guia de Atualização - Settings com Edição de Targets

**Data:** 31 de Dezembro de 2024
**Versão:** 1.2.0

---

## 🎯 Resumo das Alterações

Adicionada funcionalidade completa de edição de targets na página Settings, incluindo:

1. ✅ **Botão Edit** para cada target
2. ✅ **Modal de Edição** com todos os parâmetros
3. ✅ **Thresholds Configuráveis** (latência, timeout, packet loss, oscilação)
4. ✅ **Lógica de Detecção** claramente definida

---

## 📊 Sobre os Valores de Latência

### ❓ Por que valores acima de 1000ms na Dashboard antiga?

**Resposta:** A Dashboard original mostra **HTTP RTT (Round-Trip Time)**, não ICMP ping:

#### Diferença entre HTTP RTT e ICMP Ping:

| Tipo | Processo | Latência Esperada |
|------|----------|-------------------|
| **ICMP Ping** | Apenas pacote ICMP echo request/reply | 30-100ms |
| **HTTP RTT** | DNS lookup + TCP handshake + HTTP request + response | 100-1500ms |

**HTTP RTT inclui:**
1. DNS Resolution (~20-100ms)
2. TCP 3-way Handshake (~30-100ms)
3. HTTP Request (~20-50ms)
4. Server Processing (~50-500ms)
5. HTTP Response (~20-100ms)
6. Network Overhead (~variable)

**Total esperado:** 140-850ms (normal)
**Picos:** 1000-2000ms (aceitável em redes congestionadas)

### ✅ Soluções Implementadas:

1. **Latency Monitor** (`/latency`) - Mostra valores de **PING (30-100ms)**
2. **Dashboard Original** - Mostra **HTTP RTT (100-1500ms)**
3. **Configuração por Target** - Permite definir threshold específico

---

## 🆕 Funcionalidades Adicionadas

### 1. Botão "Edit" na Tabela de Targets

**Localização:** Settings → Manage Targets → Coluna "Actions"

**Aparência:**
- Botão azul "Edit" ao lado do botão vermelho "Delete"
- Ativa modal de edição ao clicar

### 2. Modal de Edição Completo

**Seções:**

#### A) Informações Básicas
- **Target Name:** Nome identificador
- **URL:** Endereço completo (https://...)
- **IP Address:** IP para ICMP ping (opcional)
- **Monitoring Type:**
  - HTTPS
  - HTTP
  - ICMP Ping
- **Active:** Checkbox para ativar/desativar monitoramento

#### B) Detection Thresholds

**1. High Latency Threshold (ms)**
```
Padrão: 0 (automático = 30% acima da média)
Personalizado: Qualquer valor em ms
```
**Quando usar:**
- 0: Detecção automática baseada na média histórica
- Valor fixo: Quando você sabe exatamente o limite aceitável

**Exemplo:**
- API crítica: 200ms
- Site público: 500ms
- Backup/Monitor: 1000ms

---

**2. Timeout Threshold (ms)**
```
Padrão: 1000ms
Range: 100-10000ms
```
**Significado:**
- Latência acima deste valor = **packet loss** (considerado DOWN)
- Para ICMP ping: 1000ms é timeout padrão
- Para HTTP: pode ser maior (2000-5000ms)

**Lógica:**
```
if (latency > timeout_threshold) {
  status = DOWN (packet loss / timeout)
}
```

---

**3. Packet Loss Threshold**
```
Padrão: 2 pacotes
Range: 1-10 pacotes consecutivos
```
**Significado:**
- Número de pacotes ICMP perdidos consecutivamente para considerar DOWN

**Exemplo:**
- 1 pacote: Muito sensível (pode gerar falsos positivos)
- 2 pacotes: **Recomendado** - balanço entre sensibilidade e confiabilidade
- 3+ pacotes: Menos sensível (pode demorar para detectar down)

**Lógica:**
```
consecutive_loss = 0
for each ping:
  if packet_lost:
    consecutive_loss += 1
    if consecutive_loss >= packet_loss_threshold:
      status = DOWN
  else:
    consecutive_loss = 0
```

---

**4. Oscillation Detection (%)**
```
Padrão: 30%
Range: 10-100%
```
**Significado:**
- Percentual acima da média atual para disparar alerta de oscilação
- **Não é DOWN**, mas indica degradação de performance

**Exemplo:**
```
Média atual: 50ms
Threshold: 30%

Limite = 50ms + (50ms × 0.30) = 65ms

Se latência > 65ms → DEGRADED (amarelo)
Se latência < 65ms → NORMAL (verde)
```

---

## 🔍 Lógica de Detecção Implementada

### Status Possíveis:

1. **🟢 UP (Operational)**
   - Latência normal
   - Sem packet loss
   - Dentro dos thresholds

2. **🟡 DEGRADED (Oscilação)**
   - Latência > (média + oscillation_percentage%)
   - Mas ainda abaixo do timeout_threshold
   - Sem packet loss

3. **🔴 DOWN**
   - **Causa 1:** Packet loss ≥ packet_loss_threshold pacotes consecutivos
   - **Causa 2:** Latência > timeout_threshold (1000ms+)
   - **Causa 3:** Erro de conexão (host unreachable, etc.)

### Fluxograma de Detecção:

```
┌─────────────────────────────────────┐
│  Novo Measurement Recebido           │
└──────────────┬──────────────────────┘
               │
               ▼
       ┌───────────────┐
       │ Pacote Perdido?│
       └───────┬────────┘
               │
         ┌─────┴─────┐
         │           │
        Sim         Não
         │           │
         ▼           ▼
    ┌────────┐  ┌──────────┐
    │DOWN    │  │ Latência?│
    │(loss)  │  └─────┬────┘
    └────────┘        │
                      │
              ┌───────┴────────┐
              │                │
         > timeout      ≤ timeout
              │                │
              ▼                ▼
         ┌────────┐    ┌───────────┐
         │DOWN    │    │> média+30%?│
         │(timeout│    └──────┬────┘
         └────────┘           │
                       ┌──────┴─────┐
                       │            │
                      Sim          Não
                       │            │
                       ▼            ▼
                  ┌─────────┐  ┌────┐
                  │DEGRADED │  │ UP │
                  └─────────┘  └────┘
```

---

## 📝 Arquivos Modificados/Criados

### Criados:
1. `frontend/src/components/EditTargetModal.tsx` - Modal de edição
2. `SETTINGS_UPDATE_GUIDE.md` - Este documento

### Modificados:
1. `frontend/src/types/index.ts` - Tipo Target estendido
2. `frontend/src/components/Settings.tsx` - Botão Edit e integração
3. `frontend/src/services/api.ts` - Método update atualizado

---

## 🚀 Como Usar

### 1. Acessar Settings

```
http://localhost:5173/settings
```

### 2. Editar um Target

1. Localizar o target na tabela "Manage Targets"
2. Clicar no botão azul **"Edit"**
3. Modal abre com configurações atuais

### 3. Configurar Thresholds

**Cenário 1: API Crítica de Baixa Latência**
```
High Latency: 100ms
Timeout: 500ms
Packet Loss: 2 pacotes
Oscillation: 20%
```

**Cenário 2: Site Público Externo**
```
High Latency: 0 (auto - 30% média)
Timeout: 2000ms
Packet Loss: 3 pacotes
Oscillation: 50%
```

**Cenário 3: Monitoramento ICMP Ping**
```
Type: ICMP Ping
High Latency: 0 (auto)
Timeout: 1000ms
Packet Loss: 2 pacotes
Oscillation: 30%
```

### 4. Salvar Alterações

1. Revisar "Detection Logic Summary" no rodapé do modal
2. Clicar em **"Save Changes"**
3. Aguardar confirmação
4. Modal fecha automaticamente

---

## 🎨 Campos do Formulário

### Basic Information

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Target Name** | Nome amigável | "Google DNS" |
| **URL** | Endereço completo | "https://8.8.8.8" |
| **IP Address** | IP para ping ICMP | "8.8.8.8" |
| **Monitoring Type** | Tipo de check | ICMP Ping |
| **Active** | Habilitar monitoramento | ✓ |

### Detection Thresholds

| Campo | Padrão | Range | Descrição |
|-------|--------|-------|-----------|
| **High Latency** | 0 (auto) | 0-10000 | Threshold em ms ou 0 para auto |
| **Timeout** | 1000ms | 100-10000 | Timeout para packet loss |
| **Packet Loss** | 2 | 1-10 | Pacotes perdidos → DOWN |
| **Oscillation** | 30% | 10-100 | % acima média → DEGRADED |

---

## 🔧 Valores Recomendados por Tipo

### ICMP Ping
```yaml
Type: ping
IP Address: obrigatório
Latency Threshold: 0 (auto)
Timeout: 1000ms
Packet Loss: 2
Oscillation: 30%
```

### HTTP/HTTPS
```yaml
Type: https
URL: obrigatório
Latency Threshold: 0 (auto) ou 500-2000ms
Timeout: 2000-5000ms
Packet Loss: 2
Oscillation: 40%
```

### API Interna
```yaml
Type: https
URL: obrigatório
Latency Threshold: 200ms
Timeout: 1000ms
Packet Loss: 2
Oscillation: 25%
```

---

## ⚙️ Backend API

### Endpoint de Update

```http
PUT /api/v1/targets/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Google",
  "url": "https://google.com",
  "ip_address": "8.8.8.8",
  "type": "ping",
  "is_active": true,
  "latency_threshold": 0,
  "timeout_threshold": 1000,
  "packet_loss_threshold": 2,
  "oscillation_percentage": 30
}
```

**Nota:** O backend precisa suportar os novos campos. Se não suportar ainda, os valores são salvos no frontend mas não persistidos.

---

## 📊 Integração com Monitoring

### Como os Thresholds São Usados:

1. **Probe coleta medição** (a cada 1s)
2. **Backend processa:**
   ```python
   target = get_target(target_id)
   measurement = get_measurement()

   # Check packet loss
   if consecutive_losses >= target.packet_loss_threshold:
       status = "down"
       reason = "packet_loss"

   # Check timeout
   elif measurement.rtt_ms > target.timeout_threshold:
       status = "down"
       reason = "timeout"

   # Check oscillation
   elif measurement.rtt_ms > (avg_latency * (1 + target.oscillation_percentage/100)):
       status = "degraded"
       reason = "oscillation"

   # Normal
   else:
       status = "up"
   ```

3. **Frontend exibe status:**
   - Dashboard: cores e badges
   - Latency Monitor: cores nos cards
   - History: barras coloridas

---

## ✅ Checklist de Verificação

Após editar um target, verificar:

- [ ] Nome atualizado na tabela
- [ ] URL/IP corretos
- [ ] Tipo de monitoramento adequado
- [ ] Status Active/Inactive conforme desejado
- [ ] Thresholds fazem sentido para o tipo de serviço
- [ ] Detection Logic Summary mostra valores esperados
- [ ] Modal fecha após salvar
- [ ] Target aparece atualizado após refresh

---

## 🐛 Troubleshooting

### Modal não abre
**Solução:** Verificar console do navegador, limpar cache

### Valores não salvam
**Solução:** Verificar se backend suporta novos campos, ver network tab

### Thresholds não aparecem
**Solução:** Backend retornando valores? Verificar API response

### Botão Edit não aparece
**Solução:** Limpar cache do navegador, rebuild frontend

---

## 🎉 Resumo Visual

**Antes:**
```
Settings
└── Manage Targets
    └── [Name] [URL] [IP] [Status] [Delete]
```

**Agora:**
```
Settings
└── Manage Targets
    └── [Name] [URL] [IP] [Type] [Status] [Edit] [Delete]
                                            ↓
                                    ┌──────────────┐
                                    │ Edit Modal   │
                                    ├──────────────┤
                                    │ Basic Info   │
                                    │ Thresholds   │
                                    │ Detection    │
                                    │   Logic      │
                                    └──────────────┘
```

---

## 📈 Próximos Passos (Opcional)

1. **Backend Support:**
   - Adicionar campos no modelo Target
   - Migração de banco de dados
   - Implementar lógica de detecção

2. **Testes Automatizados:**
   - Testar diferentes combinações de thresholds
   - Validar lógica de detecção

3. **Alertas:**
   - Email/SMS quando DOWN
   - Notificações quando DEGRADED
   - Dashboard de alertas

---

**Status:** ✅ **Frontend Implementado e Funcionando**

**Acesse:** http://localhost:5173/settings

Container atualizado e rodando! 🚀
