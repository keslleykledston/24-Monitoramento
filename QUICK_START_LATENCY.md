# Guia Rápido - Latency Monitor

## Iniciar a Aplicação

### 1. Instalar dependências (se necessário)
```bash
cd /Users/keslleykssantos/Scripts_e_Automacoes/dev/Teste/24-Monitoramento/frontend
npm install
```

### 2. Iniciar o servidor de desenvolvimento
```bash
cd /Users/keslleykssantos/Scripts_e_Automacoes/dev/Teste/24-Monitoramento/frontend
npm run dev
```

### 3. Acessar a aplicação
1. Abra o navegador em `http://localhost:5173` (ou a porta exibida no terminal)
2. Faça login (se necessário)
3. Clique em **"Latency Monitor"** no menu de navegação

## O que você verá

### Seção Superior - Gráfico Principal
- Título: "Real-Time Latency Monitor"
- Subtítulo: "Live - Updates every second - 20 minutes history"
- Gráfico de linha azul ciano com área preenchida
- Seletor de target (dropdown) no canto superior direito
- Escala Y: 0-350ms
- Timeline com últimos 20 minutos

### Seção Inferior - Grid de Targets
- Título: "Targets Overview"
- 10 cards dispostos em grid de 5 colunas:
  1. **Globo** - https://globo.com
  2. **UOL** - https://uol.com.br
  3. **Mercado Livre** - https://mercadolivre.com.br
  4. **Gov.br** - https://gov.br
  5. **Reclame Aqui** - https://reclameaqui.com.br
  6. **Google** - https://google.com
  7. **YouTube** - https://youtube.com
  8. **Facebook** - https://facebook.com
  9. **Instagram** - https://instagram.com
  10. **Wikipedia** - https://wikipedia.org

### Cada Card Mostra:
- Nome do target
- Badge ONLINE (verde neon animado) ou OFFLINE (vermelho)
- Mini gráfico (sparkline) azul ciano
- **Current**: Latência atual em verde
- **Average**: Latência média em azul
- **Max**: Latência máxima em vermelho
- URL completo em fonte monospace cinza

## Comportamento

### Atualizações em Tempo Real
- Novos dados a cada 1 segundo
- Gráfico principal atualiza suavemente (scroll da direita para esquerda)
- Valores numéricos atualizam instantaneamente
- Spikes ocasionais de latência (200-320ms)
- Latência normal: 50-100ms (varia por target)

### Interatividade
- **Seletor de Target**: Altera o gráfico principal para mostrar dados do target selecionado
- **Hover nos Cards**: Elevação com sombra
- **Tooltip no Gráfico**: Passe o mouse para ver detalhes de cada ponto

### Responsividade
- **Desktop (>1600px)**: 5 colunas
- **Laptop (1200-1600px)**: 4 colunas
- **Tablet (768-1200px)**: 3 colunas
- **Mobile (480-768px)**: 2 colunas
- **Small Mobile (<480px)**: 1 coluna

## Cores do Tema

- **Background**: #000000 (preto puro)
- **Texto Principal**: #FFFFFF (branco)
- **Texto Secundário**: #888888 (cinza)
- **Linha/Dados Normais**: #00D4FF (azul ciano)
- **Sucesso/Online**: #00FF00 (verde neon)
- **Alerta/Max**: #FF0000 (vermelho)
- **Borders**: #333333 (cinza escuro)

## Dados Mock

Atualmente, a aplicação usa dados simulados (mock) com:
- Geração automática de 20 minutos de histórico ao carregar
- Atualização a cada segundo com novos pontos
- Latência base variável por target (50ms + target.id * 5)
- 5% de chance de spike (200-320ms)
- 98% de uptime (2% de chance de status offline)

## Próximas Integrações

Para conectar com dados reais do backend:

1. Criar endpoint no backend que retorna latência atual
2. Implementar WebSocket para push de dados em tempo real
3. Modificar `LatencyMonitor.tsx` para consumir dados reais
4. Adicionar persistência de histórico no banco de dados

## Estrutura de Arquivos Criados

```
frontend/src/
├── components/
│   └── latency/
│       ├── LatencyChart.tsx    # Gráfico principal (ECharts)
│       └── TargetCard.tsx      # Card individual com sparkline
├── pages/
│   └── LatencyMonitor.tsx      # Página principal
└── styles/
    └── latency-monitor.css     # Estilos dark theme
```

## Troubleshooting

### Erro ao importar ECharts
```bash
cd frontend
npm install echarts echarts-for-react
```

### Porta já em uso
```bash
# Alterar porta no vite.config.ts
export default defineConfig({
  server: {
    port: 3000
  }
})
```

### Build com erro de tipos
```bash
cd frontend
npm run build
```
Se houver erros de TypeScript, verifique os imports nos arquivos criados.

## Performance

- **FPS**: ~60fps nas animações
- **Memória**: Buffer limitado a 1200 pontos por target
- **CPU**: Otimizado com Canvas rendering (ECharts)
- **Network**: 0 requests (dados mock locais)

## Screenshots

A dashboard replica exatamente o design da imagem fornecida:
- Layout dark com fundo preto
- Gráfico azul ciano no topo
- Grid de cards com sparklines
- Badges ONLINE verdes animados
- Métricas coloridas (verde/azul/vermelho)

Aproveite o monitoramento em tempo real! 🚀
