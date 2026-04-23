# Webhook Platform

Plataforma de ingestão e processamento assíncrono de webhooks com autenticação configurável por parceiro, persistência de eventos brutos, enfileiramento com SQS, worker resiliente, DLQ, reprocessamento manual e observabilidade com Prometheus + Grafana.

---

## Visão geral

Este projeto foi criado para simular um cenário real de integrações externas, em que diferentes parceiros enviam webhooks com formatos e estratégias de autenticação diferentes.

O sistema recebe o webhook, valida a autenticação conforme a configuração do parceiro, persiste o payload bruto no PostgreSQL, publica o evento em uma fila SQS, processa de forma assíncrona com um worker dedicado, registra tentativas de processamento, envia falhas repetidas para DLQ e disponibiliza métricas para observabilidade.

---

## Principais funcionalidades

### Ingestão de webhooks

- Recebimento de webhooks via HTTP
- Suporte a múltiplos parceiros
- Configuração por parceiro no banco de dados
- Persistência do payload bruto, headers e metadados
- Extração configurável de `eventType` e `externalEventId`

### Autenticação configurável por parceiro

- HMAC
- Bearer Token
- Basic Auth
- API Key
- Parceiros sem autenticação (`NONE`)

### Processamento assíncrono

- Publicação em fila SQS
- Worker dedicado para consumo da fila
- Atualização de status do evento no banco
- Registro de tentativas de processamento
- Histórico de falhas

### Resiliência

- Retry por redelivery do SQS
- DLQ para mensagens problemáticas
- Reprocessamento manual via API administrativa
- Idempotência por `source + externalEventId`

### Observabilidade

- Endpoint `/metrics`
- Métricas Prometheus
- Dashboard Grafana
- Backlog da fila principal
- Backlog da DLQ
- Métricas de recebimento, enfileiramento, processamento, falha e dead-letter

---

## Arquitetura

### Fluxo principal

1. Um parceiro externo envia um webhook para a API.
2. A API identifica o parceiro pelo path.
3. A configuração do parceiro é carregada do banco.
4. A autenticação é validada com base na estratégia configurada.
5. O evento bruto é persistido no PostgreSQL.
6. O evento é publicado na SQS.
7. O worker consome a mensagem da fila.
8. O worker busca o evento persistido no banco.
9. O worker processa o evento.
10. Em caso de sucesso, o evento é marcado como `PROCESSED`.
11. Em caso de falha repetida, o evento pode ser marcado como `DEAD_LETTERED`.
12. Eventos problemáticos podem ser consultados e reprocessados manualmente.

### Componentes

- **API**: recebe e valida webhooks, persiste eventos, publica na fila, expõe endpoints administrativos e `/metrics`
- **PostgreSQL**: armazena parceiros, eventos brutos e tentativas de processamento
- **SQS (LocalStack)**: fila principal e DLQ
- **Worker**: consome mensagens e executa o processamento assíncrono
- **Prometheus**: coleta métricas
- **Grafana**: visualiza métricas em dashboards

---

## Stack utilizada

### Backend

- Node.js 24
- NestJS
- TypeScript
- Prisma ORM 7
- PostgreSQL
- AWS SDK v3
- LocalStack

### Infra local

- Docker
- Docker Compose

### Observabilidade

- prom-client
- Prometheus
- Grafana

---

## Estrutura do projeto

```txt
webhook-platform/
  apps/
    api/
    worker/
  libs/
    common/
    database/
  infra/
    localstack/
    observability/
      prometheus/
      grafana/
  prisma/
  scripts/
  generated/
```

### Pastas principais

- `apps/api`: aplicação HTTP principal
- `apps/worker`: consumidor assíncrono da fila
- `libs/common`: utilitários compartilhados, client SQS, métricas
- `libs/database`: Prisma service e módulo de banco
- `infra/localstack`: bootstrap da SQS local
- `infra/observability`: configuração de Prometheus e Grafana
- `prisma`: schema e migrations
- `scripts`: scripts utilitários de seed, assinatura e testes

---

## Modelagem de dados

### `partner_integrations`

Armazena a configuração de cada parceiro.

Principais campos:

- `slug`
- `authType`
- `signatureAlgorithm`
- `secret`
- `signatureHeaderName`
- `timestampHeaderName`
- `signedPayloadTemplate`
- `eventTypePath`
- `externalEventIdPath`
- `deliveryIdHeaderName`
- `bearerToken`
- `basicUsername`
- `basicPassword`
- `apiKeyHeaderName`
- `apiKeyValue`

### `webhook_raw_events`

Armazena o evento bruto recebido.

Principais campos:

- `id`
- `source`
- `eventType`
- `externalEventId`
- `headersJson`
- `payloadJson`
- `status`
- `lastError`
- `receivedAt`
- `processedAt`

### `webhook_processing_attempts`

Armazena as tentativas de processamento do evento.

Principais campos:

- `webhookEventId`
- `attemptNumber`
- `status`
- `errorMessage`
- `startedAt`
- `finishedAt`
- `latencyMs`

---

## Status de eventos

O ciclo de vida principal do evento usa estes status:

- `RECEIVED`
- `QUEUED`
- `PROCESSING`
- `PROCESSED`
- `FAILED`
- `DEAD_LETTERED`

---

## Estratégias de autenticação suportadas

### HMAC

Permite configurar:

- algoritmo (`HMAC_SHA1`, `HMAC_SHA256`, `HMAC_SHA384`, `HMAC_SHA512`)
- header da assinatura
- header de timestamp
- prefixo da assinatura
- template do payload assinado

Exemplo de template:

- `{{rawBody}}`
- `{{timestamp}}.{{rawBody}}`

### Bearer Token

Valida um token fixo no header de autorização.

### Basic Auth

Valida credenciais fixas no header `Authorization`.

### API Key

Valida uma chave em um header configurável.

### NONE

Permite parceiros sem autenticação.

---

## Pré-requisitos

Antes de rodar o projeto, você precisa ter instalado:

- Node.js 24
- npm
- Docker
- Docker Compose

---

## Como rodar o projeto localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir a infraestrutura local

```bash
docker compose up -d
```

Isso sobe:

- PostgreSQL
- LocalStack
- Prometheus
- Grafana

### 3. Gerar o client Prisma

```bash
npx prisma generate
```

### 4. Rodar as migrations

```bash
npx prisma migrate dev
```

### 5. Popular os parceiros de teste

```bash
npx ts-node scripts/seed-partners.ts
```

### 6. Subir a API

```bash
npm run start:api
```

### 7. Subir o worker

```bash
npm run start:worker
```

---

## Variáveis de ambiente

Exemplo de `.env`:

```env
NODE_ENV=development

APP_PORT=3000
WORKER_METRICS_PORT=3002

DATABASE_URL=postgresql://webhook_user:webhook_pass@localhost:5432/webhook_platform?schema=public

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localhost:4566

SQS_WEBHOOK_EVENTS_QUEUE_URL=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/webhook-events
SQS_WEBHOOK_EVENTS_DLQ_URL=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/webhook-events-dlq
SQS_MAX_RECEIVE_COUNT=3

WORKER_POLL_INTERVAL_MS=3000
WORKER_MAX_MESSAGES=5
WORKER_WAIT_TIME_SECONDS=10
```

---

## Endpoints principais

### API pública

#### Receber webhook

```http
POST /webhooks/:partner
```

Exemplo:

```http
POST /webhooks/partner-hmac
```

### API administrativa

#### Listar webhooks

```http
GET /admin/webhooks
```

#### Filtrar por status

```http
GET /admin/webhooks?status=FAILED
GET /admin/webhooks?status=DEAD_LETTERED
```

#### Ver detalhe de um webhook

```http
GET /admin/webhooks/:id
```

#### Reprocessar manualmente

```http
POST /admin/webhooks/:id/reprocess
```

### Observabilidade

#### Health check

```http
GET /health
```

#### Métricas Prometheus

```http
GET /metrics
```

---

## Como testar cada tipo de autenticação

### HMAC

Use o seed `partner-hmac`.

Exemplo de payload:

```json
{ "id": "evt-1", "eventType": "payment.created" }
```

Use o script de assinatura dinâmica:

```bash
npx ts-node scripts/sign-webhook-dynamic.ts partner-hmac payload.json
```

Depois envie:

```bash
curl -X POST http://localhost:3000/webhooks/partner-hmac \
  -H "Content-Type: application/json" \
  -H "x-webhook-timestamp: SEU_TIMESTAMP" \
  -H "x-webhook-signature: SUA_SIGNATURE" \
  --data-binary @payload.json
```

### Bearer Token

Use o seed `partner-bearer`.

Exemplo:

```bash
curl -X POST http://localhost:3000/webhooks/partner-bearer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer partner-bearer-token-123" \
  -d '{"eventId":"evt-2","type":"invoice.paid"}'
```

### Basic Auth

Use o seed `partner-basic`.

Exemplo:

```bash
curl -X POST http://localhost:3000/webhooks/partner-basic \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic cGFydG5lci1iYXNpYy11c2VyOnBhcnRuZXItYmFzaWMtcGFzcw==" \
  -d '{"event":{"id":"evt-3","type":"subscription.updated"}}'
```

### API Key

Use o seed `partner-api-key`.

Exemplo:

```bash
curl -X POST http://localhost:3000/webhooks/partner-api-key \
  -H "Content-Type: application/json" \
  -H "x-api-key: partner-api-key-secret" \
  -d '{"data":{"id":"evt-4","type":"order.created"}}'
```

---

## Como testar falhas e DLQ

Envie um payload com `forceFail: true` para simular erro no worker:

```json
{ "id": "evt-dead-1", "eventType": "payment.created", "forceFail": true }
```

Fluxo esperado:

1. evento entra e vai para `QUEUED`
2. worker tenta processar
3. falha
4. SQS faz redelivery até o limite configurado
5. evento pode ser marcado como `DEAD_LETTERED`
6. mensagem vai para a DLQ

### Consultar eventos falhados

```bash
curl "http://localhost:3000/admin/webhooks?status=FAILED"
```

### Consultar eventos em DLQ lógica

```bash
curl "http://localhost:3000/admin/webhooks?status=DEAD_LETTERED"
```

### Reprocessar manualmente

```bash
curl -X POST "http://localhost:3000/admin/webhooks/SEU_EVENT_ID/reprocess"
```

---

## Observabilidade

### Prometheus

- URL: `http://localhost:9090`
- Acompanha o scrape da API e do worker

### Grafana

- URL: `http://localhost:3001`
- Usuário: `admin`
- Senha: `admin`

### Dashboard provisionado

O projeto inclui dashboard com:

- webhooks recebidos
- webhooks enfileirados
- processados
- falhas
- dead-lettered
- backlog da fila principal
- backlog da DLQ
- latência p95
- taxa de entrada/processamento/falha
- webhooks recebidos por parceiro

---

## Métricas disponíveis

Algumas métricas principais:

- `webhook_received_total`
- `webhook_queued_total`
- `webhook_processed_total`
- `webhook_failed_total`
- `webhook_dead_lettered_total`
- `webhook_processing_duration_ms`
- `webhook_queue_backlog_visible_messages`
- `webhook_dlq_backlog_visible_messages`

---

## Queries úteis no PostgreSQL

Como o schema atual usa nomes camelCase nas colunas, use aspas duplas.

### Ver eventos

```sql
SELECT id, source, "eventType", "externalEventId", status, "lastError", "receivedAt", "processedAt"
FROM webhook_raw_events
ORDER BY "receivedAt" DESC;
```

### Ver tentativas de processamento

```sql
SELECT id, "webhookEventId", "attemptNumber", status, "errorMessage", "startedAt", "finishedAt", "latencyMs"
FROM webhook_processing_attempts
ORDER BY "startedAt" DESC;
```

### Ver tentativas de um evento específico

```sql
SELECT id, "webhookEventId", "attemptNumber", status, "errorMessage", "startedAt", "finishedAt", "latencyMs"
FROM webhook_processing_attempts
WHERE "webhookEventId" = 'SEU_EVENT_ID'
ORDER BY "attemptNumber" ASC;
```

---

## Decisões técnicas importantes

### Por que persistir o payload bruto antes de processar

Para garantir:

- auditoria
- reprocessamento manual
- rastreabilidade
- observabilidade de falhas

### Por que usar SQS

Para desacoplar:

- ingestão HTTP
- processamento de negócio

Isso permite maior resiliência e separação de responsabilidades.

### Por que usar DLQ

Para isolar mensagens problemáticas e evitar que erros recorrentes bloqueiem o fluxo principal.

### Por que configurar autenticação por parceiro

Porque em integrações reais cada parceiro costuma ter:

- headers diferentes
- algoritmos diferentes
- formatos diferentes de payload assinado
- formatos diferentes de evento

### Por que usar ID interno no worker

O worker processa sempre pelo **ID interno persistido** do evento, e não pelo identificador externo do parceiro. Isso desacopla o processamento da forma como cada parceiro estrutura seu payload.

---

## Roadmap / Próximas melhorias

Possíveis evoluções futuras:

- CRUD administrativo de parceiros
- paginação e filtros avançados na admin API
- autenticação da admin API
- alertas no Grafana
- secret rotation para parceiros HMAC
- replay protection mais forte por `deliveryId`
- dockerizar API e worker no compose
- testes automatizados unitários, integração e e2e
- mapear colunas do banco em snake_case com `@map`

---

## Licença

Uso educacional e de portfólio.
