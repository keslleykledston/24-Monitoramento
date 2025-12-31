# Real-Time Latency Monitor

Dashboard de monitoramento de latência em tempo real, implementada conforme especificações detalhadas.

## Estrutura Implementada

### Arquivos Criados

1. **frontend/src/styles/latency-monitor.css**
   - Estilos dark theme (#000000)
   - Cores específicas: #00D4FF (cyan), #00FF00 (green), #FF0000 (red)
   - Grid responsivo de 5 colunas
   - Animações e transições suaves

2. **frontend/src/components/latency/LatencyChart.tsx**
   - Gráfico principal usando ECharts
   - Linha azul ciano com área preenchida (gradient)
   - Escala Y: 0-350ms
   - Timeline de 20 minutos
   - Tooltip interativo

3. **frontend/src/components/latency/TargetCard.tsx**
   - Card individual para cada target
   - Mini sparkline (60 pontos)
   - Métricas: Current (verde), Average (azul), Max (vermelho)
   - Badge ONLINE/OFFLINE animado
   - URL em fonte monospace

4. **frontend/src/pages/LatencyMonitor.tsx**
   - Página principal que integra todos componentes
   - Gerenciamento de estado para 10 targets
   - Atualização em tempo real (1 segundo)
   - Buffer de 20 minutos (1200 pontos)
   - Geração de dados mock com spikes realistas

## Targets Configurados

1. Globo - https://globo.com
2. UOL - https://uol.com.br
3. Mercado Livre - https://mercadolivre.com.br
4. Gov.br - https://gov.br
5. Reclame Aqui - https://reclameaqui.com.br
6. Google - https://google.com
7. YouTube - https://youtube.com
8. Facebook - https://facebook.com
9. Instagram - https://instagram.com
10. Wikipedia - https://wikipedia.org

## Características Implementadas

### Gráfico Principal
- ✅ Linha azul ciano (#00D4FF) com área preenchida
- ✅ Escala Y de 0 a 350ms com intervalos de 50ms
- ✅ Timeline com timestamps (HH:MM:SS)
- ✅ Grid sutil de fundo
- ✅ Seletor de target no cabeçalho
- ✅ 20 minutos de histórico
- ✅ Atualização suave (smooth animation)
- ✅ Spikes de latência visíveis

### Cards de Targets
- ✅ Grid responsivo (5 colunas)
- ✅ Badge ONLINE verde neon (#00FF00) animado
- ✅ Border verde quando online
- ✅ Mini sparkline com linha azul ciano
- ✅ Métricas coloridas:
  - Current: Verde (#00FF00)
  - Average: Azul ciano (#00D4FF)
  - Max: Vermelho (#FF0000)
- ✅ URL em fonte monospace cinza
- ✅ Hover effect com elevação

### Real-Time Updates
- ✅ Atualização a cada 1 segundo
- ✅ Novos pontos adicionados ao gráfico
- ✅ Valores numéricos atualizam instantaneamente
- ✅ Geração de latências realistas com spikes ocasionais
- ✅ Buffer circular de 1200 pontos (20 minutos)

### Estilo Visual
- ✅ Background preto puro (#000000)
- ✅ Tipografia moderna (Sans-serif)
- ✅ Font monospace para valores numéricos e URLs
- ✅ Border radius moderado (8px)
- ✅ Animações suaves
- ✅ Responsivo (breakpoints: 1600px, 1200px, 768px, 480px)

## Integração

A página foi integrada ao aplicativo com:
- Rota: `/latency`
- Link no menu de navegação: "Latency Monitor"
- Proteção de autenticação (PrivateRoute)
- Layout sem header para tela cheia dark

## Como Acessar

1. Faça login no sistema
2. Clique em "Latency Monitor" no menu de navegação
3. A dashboard será exibida com:
   - Gráfico principal no topo
   - Grid de 10 targets abaixo
   - Atualizações em tempo real

## Tecnologias Utilizadas

- **React** 18.2.0
- **TypeScript** 5.3.3
- **ECharts** 5.4.3 (para gráficos)
- **Vite** 5.0.11 (build tool)
- **CSS3** (estilos customizados)

## Performance

- Renderização otimizada com Canvas (ECharts)
- Sampling LTTB para grandes volumes de dados
- Buffer circular para evitar memory leaks
- Debouncing em eventos de resize
- Animações GPU-accelerated

## Próximos Passos (Opcional)

Para conectar com dados reais:

1. Criar endpoint no backend: `GET /api/latency/:targetId`
2. Implementar WebSocket ou SSE para push de dados
3. Substituir função `generateLatency()` por chamadas API
4. Adicionar tratamento de erros e reconexão
5. Implementar persistência de dados históricos

## Estrutura de Dados

```typescript
interface LatencyDataPoint {
  timestamp: string;  // "YYYY-MM-DD HH:MM:SS"
  value: number;      // latência em ms
}

interface TargetMetrics {
  current: number;    // latência atual
  average: number;    // média
  max: number;        // máxima
  history: number[];  // array de valores
  online: boolean;    // status
}
```

## Build

```bash
cd frontend
npm run build
```

Build concluído com sucesso! ✅
