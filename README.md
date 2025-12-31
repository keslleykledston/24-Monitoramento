# Multi-Location Monitoring System

Sistema de monitoramento multi-localidade com dashboard em tempo real, alertas e histórico de 7 dias.

## Características

- ✅ Probes em múltiplas localidades (São Paulo, Manaus, Frankfurt)
- ✅ Checks HTTP/HTTPS e ICMP ping a cada 1 segundo
- ✅ Dashboard em tempo real via WebSocket (atualização a cada 1s)
- ✅ Retenção: dados RAW (1s) por 6 horas, agregados (1m) por 7 dias
- ✅ Sistema de alertas com severidades (MAJOR, CRITICAL)
- ✅ Gestão de incidentes com ACK
- ✅ 10 targets pré-configurados

## Stack Tecnológica

- **Backend**: FastAPI (Python 3.12), SQLAlchemy, Alembic
- **Database**: PostgreSQL + TimescaleDB
- **Cache/PubSub**: Redis
- **Frontend**: React 18 + TypeScript + Vite + ECharts
- **Real-time**: WebSocket (FastAPI)
- **Containerização**: Docker + Docker Compose

## Estrutura do Projeto

```
24-Monitoramento/
├── backend/          # API FastAPI
│   ├── app/
│   │   ├── api/      # Endpoints
│   │   ├── core/     # Config, auth, websocket
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   └── jobs/     # APScheduler jobs
│   ├── alembic/      # Migrations
│   └── requirements.txt
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── probe/            # Probe service
│   └── probe.py
└── docker-compose.yml
```

## Quick Start

### 1. Clone e Configure

```bash
cd 24-Monitoramento
cp .env.example .env
```

### 2. Inicie os Serviços

```bash
docker compose up -d --build
```

Aguarde ~30 segundos para inicialização completa.

### 3. Acesse

- **Frontend**: http://localhost:5173
- **API Swagger**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 4. Login Padrão

```
Username: admin
Password: admin123
```

⚠️ **IMPORTANTE**: Altere a senha padrão em produção!

## Endpoints Principais

### Autenticação
- `POST /api/v1/auth/login` - Login (retorna JWT)

### CRUD
- `GET/POST /api/v1/locations` - Localidades
- `GET/POST /api/v1/probes` - Probes
- `GET/POST /api/v1/targets` - Targets
- `GET/POST /api/v1/alert-rules` - Regras de alerta

### Ingest
- `POST /api/v1/measurements` - Envio de medições (probes)

### Consulta
- `GET /api/v1/targets/{id}/live` - Dados ao vivo (15min)
- `GET /api/v1/targets/{id}/history` - Histórico agregado (7d)
- `GET /api/v1/incidents` - Lista de incidentes
- `POST /api/v1/incidents/{id}/ack` - Reconhecer incidente

### WebSocket
- `WS /ws/live` - Stream de dados em tempo real

## Regras de Alerta Pré-configuradas

1. **DOWN**: 3 falhas consecutivas → CRITICAL
2. **Loss**: ≥2% → MAJOR, ≥5% → CRITICAL
3. **Latência P95**: >120ms → MAJOR
4. **Jitter**: >20ms → MAJOR
5. **HTTP 5xx**: >2% → MAJOR

## Localidades e Probes Pré-configurados

| Localidade | Probe | Token |
|------------|-------|-------|
| São Paulo - BR | probe-sp | `$PROBE_SP_TOKEN` |
| Manaus - BR | probe-mao | `$PROBE_MAO_TOKEN` |
| Frankfurt - DE | probe-fra | `$PROBE_FRA_TOKEN` |

## Targets Pré-configurados

1. globo.com
2. uol.com.br
3. mercadolivre.com.br
4. gov.br
5. reclameaqui.com.br
6. google.com
7. youtube.com
8. facebook.com
9. instagram.com
10. wikipedia.org

## Desenvolvimento

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Probes (local)

```bash
cd probe
pip install -r requirements.txt
python probe.py --location-id 1 --probe-id 1
```

## Logs

```bash
# Todos os serviços
docker compose logs -f

# Apenas API
docker compose logs -f api

# Apenas probes
docker compose logs -f probe-sp probe-mao probe-fra
```

## Parar Serviços

```bash
docker compose down
```

## Limpar Tudo (incluindo volumes)

```bash
docker compose down -v
```

## Troubleshooting

### Serviços não iniciam

```bash
docker compose down -v
docker compose up -d --build
```

### Frontend não conecta no backend

Verifique `VITE_API_URL` no `.env` e reconstrua:

```bash
docker compose up -d --build frontend
```

### Probes não enviam dados

Verifique logs:

```bash
docker compose logs probe-sp
```

## Arquitetura

### Fluxo de Dados

```
Probes → API (/measurements) → PostgreSQL (RAW)
                             → Redis (PubSub)
                             → WebSocket (Frontend)

APScheduler Jobs:
- Agregação 1m (a cada minuto)
- Avaliação de alertas (a cada 10s)
- Limpeza TTL (a cada hora)
```

### Retenção

- **RAW (1s)**: 6 horas
- **Agregado (1m)**: 7 dias

### WebSocket

Canal `/ws/live` envia mensagens:

```json
{
  "type": "measurement",
  "target_id": 1,
  "probe_id": 1,
  "location_id": 1,
  "up": true,
  "rtt_ms": 45.2,
  "timestamp": "2025-01-15T10:30:45Z"
}
```

## Segurança

- ✅ JWT para autenticação de usuários
- ✅ Tokens fixos para probes (X-Probe-Token)
- ✅ CORS configurável
- ✅ Rate limiting (futuro)
- ⚠️ **Troque secrets em produção!**

## Licença

MIT
