# Webhook Manager — Arquitetura do Software

## 1. Visão Geral da Infraestrutura

Topologia de alto nível do monorepo NestJS com duas aplicações (`api` e `worker`) e a infraestrutura de suporte.

```mermaid
graph TB
    subgraph External["🌐 Parceiros Externos"]
        P1["Partner A"]
        P2["Partner B"]
        P3["Partner N"]
    end

    subgraph Platform["Webhook Manager Platform"]
        subgraph API["📡 API App :3000"]
            API_MAIN["NestJS HTTP Server"]
            SWAGGER["Swagger /api/docs"]
            HEALTH_API["/health"]
            METRICS_API["/metrics"]
        end

        subgraph Worker["⚙️ Worker App"]
            WORKER_MAIN["NestJS Application Context"]
            METRICS_WORKER["Metrics Server :3002"]
        end

        subgraph Queue["📨 Amazon SQS"]
            SQS["webhook-events queue"]
        end

        subgraph DB["🗄️ PostgreSQL"]
            PG["webhook_platform DB"]
        end
    end

    subgraph Observability["📊 Observabilidade"]
        PROM["Prometheus :9090"]
        GRAF["Grafana :3001"]
    end

    P1 & P2 & P3 -->|"POST /webhooks/:partner"| API_MAIN
    API_MAIN -->|"Publica evento"| SQS
    API_MAIN -->|"Persiste raw event"| PG
    SQS -->|"Long polling"| WORKER_MAIN
    WORKER_MAIN -->|"Atualiza status / attempts"| PG
    PROM -->|"Scrape /metrics"| METRICS_API
    PROM -->|"Scrape /metrics"| METRICS_WORKER
    GRAF -->|"Datasource"| PROM

    style External fill:#2d2d2d,stroke:#6c63ff,color:#fff
    style Platform fill:#1a1a2e,stroke:#16213e,color:#fff
    style Observability fill:#1a1a2e,stroke:#e94560,color:#fff
    style API fill:#0f3460,stroke:#53a8b6,color:#fff
    style Worker fill:#0f3460,stroke:#53a8b6,color:#fff
    style Queue fill:#533483,stroke:#e94560,color:#fff
    style DB fill:#1b4332,stroke:#52b788,color:#fff
```

---

## 2. Arquitetura Interna — API App

Módulos NestJS, controllers, services e suas dependências internas.

```mermaid
graph LR
    subgraph ApiModule["ApiModule"]
        AC["ApiController<br/>/health"]
    end

    subgraph WebhooksModule["WebhooksModule"]
        direction TB
        WC["WebhooksController<br/>POST /webhooks/:partner"]
        WAC["WebhooksAdminController<br/>GET /admin/webhooks<br/>POST /admin/webhooks/:id/reprocess"]
        RWS["ReceiveWebhookService"]
        RWUC["ReceiveWebhookUseCase"]
        MRS["ManualReprocessService"]
        PCS["PartnerConfigService"]
        PPRS["PayloadPathReaderService"]
        WSVS["WebhookSignatureValidatorService"]

        WC --> RWS --> RWUC
        WAC --> MRS
        WAC --> WEAR["WebhookEventsAdminRepository"]
    end

    subgraph Adapters["Adapters (Ports & Adapters)"]
        PCA["PartnerConfigAdapter"]
        PRA["PayloadReaderAdapter"]
        WEA["WebhookEventsAdapter"]
        WPA["WebhookPublisherAdapter"]
        WSVA["WebhookSignatureValidatorAdapter"]
    end

    subgraph Repositories["Repositories"]
        WER["WebhookEventsRepository"]
        PIR["PartnerIntegrationsRepository"]
        WEAR2["WebhookEventsAdminRepository"]
    end

    subgraph QueueModule["QueueModule"]
        SPS["SqsProducerService"]
    end

    subgraph ObservabilityModule["ObservabilityModule"]
        MC["MetricsController<br/>/metrics"]
        HC["HealthController"]
        QMPS["QueueMetricsPollerService"]
    end

    subgraph SharedLibs["Shared Libraries"]
        DB_MOD["@app/database<br/>PrismaService"]
        COMMON["@app/common<br/>SQS Client + Metrics"]
    end

    RWUC --> PCA & PRA & WEA & WPA & WSVA
    PCA --> PIR --> DB_MOD
    WEA --> WER --> DB_MOD
    WPA --> SPS --> COMMON
    WSVA --> WSVS
    PRA --> PPRS

    style ApiModule fill:#0f3460,stroke:#53a8b6,color:#fff
    style WebhooksModule fill:#1a1a2e,stroke:#e94560,color:#fff
    style Adapters fill:#533483,stroke:#6c63ff,color:#fff
    style Repositories fill:#1b4332,stroke:#52b788,color:#fff
    style QueueModule fill:#533483,stroke:#e94560,color:#fff
    style ObservabilityModule fill:#2d2d2d,stroke:#fca311,color:#fff
    style SharedLibs fill:#2d2d2d,stroke:#adb5bd,color:#fff
```

---

## 3. Arquitetura Interna — Worker App

Pipeline de consumo e processamento de eventos do SQS.

```mermaid
graph TB
    subgraph WorkerModule["WorkerModule"]
        direction TB

        subgraph ConsumerModule["ConsumerModule"]
            SCS["SqsConsumerService<br/>(inicializa polling)"]
            WOS["WorkerOrchestratorService<br/>(poll + handle + delete)"]
        end

        subgraph ProcessingModule["ProcessingModule"]
            WEPS["WebhookEventProcessorService<br/>(process + track metrics)"]
            PATS["ProcessingAttemptTrackerService<br/>(start / succeed / fail)"]
        end

        subgraph WorkerRepos["Repositories"]
            WEWR["WebhookEventsWorkerRepository"]
            WPAR["WebhookProcessingAttemptsRepository"]
        end
    end

    SQS["📨 SQS Queue"]
    PG["🗄️ PostgreSQL"]

    SQS -->|"ReceiveMessage<br/>(long poll)"| WOS
    SCS --> WOS
    WOS --> WEPS
    WEPS --> PATS
    WEPS --> WEWR --> PG
    PATS --> WPAR --> PG
    WOS -->|"DeleteMessage<br/>(on success)"| SQS
    WOS -->|"Mark DEAD_LETTERED<br/>(max retries)"| WEWR

    style WorkerModule fill:#1a1a2e,stroke:#16213e,color:#fff
    style ConsumerModule fill:#0f3460,stroke:#53a8b6,color:#fff
    style ProcessingModule fill:#533483,stroke:#6c63ff,color:#fff
    style WorkerRepos fill:#1b4332,stroke:#52b788,color:#fff
```

---

## 4. Arquitetura Hexagonal — Ports & Adapters (Webhooks)

O módulo de Webhooks implementa uma **Arquitetura Hexagonal** com inversão de dependência através de ports (interfaces) e adapters (implementações concretas).

```mermaid
graph LR
    subgraph Domain["🎯 Domain Layer"]
        PE["PersistedWebhookEvent"]
        NWE["NewWebhookEvent"]
        PARTNER["Partner"]
    end

    subgraph UseCases["⚡ Application Layer"]
        UC["ReceiveWebhookUseCase"]
    end

    subgraph Ports["🔌 Ports (Interfaces)"]
        direction TB
        PP1["PartnerConfigPort"]
        PP2["PayloadReaderPort"]
        PP3["WebhookEventsPort"]
        PP4["WebhookPublisherPort"]
        PP5["WebhookSignatureValidatorPort"]
    end

    subgraph AdaptersImpl["🔧 Adapters (Implementações)"]
        direction TB
        A1["PartnerConfigAdapter"]
        A2["PayloadReaderAdapter"]
        A3["WebhookEventsAdapter"]
        A4["WebhookPublisherAdapter"]
        A5["WebhookSignatureValidatorAdapter"]
    end

    subgraph Infra["🏗️ Infrastructure"]
        direction TB
        S1["PartnerConfigService"]
        S2["PayloadPathReaderService"]
        S3["WebhookEventsRepository"]
        S4["SqsProducerService"]
        S5["WebhookSignatureValidatorService"]
        DB["PostgreSQL / Prisma"]
        SQS["Amazon SQS"]
    end

    UC --> PP1 & PP2 & PP3 & PP4 & PP5
    UC --> NWE & PE & PARTNER

    PP1 -.->|"implements"| A1
    PP2 -.->|"implements"| A2
    PP3 -.->|"implements"| A3
    PP4 -.->|"implements"| A4
    PP5 -.->|"implements"| A5

    A1 --> S1 --> DB
    A2 --> S2
    A3 --> S3 --> DB
    A4 --> S4 --> SQS
    A5 --> S5

    style Domain fill:#fca311,stroke:#e85d04,color:#000
    style UseCases fill:#6c63ff,stroke:#3d348b,color:#fff
    style Ports fill:#533483,stroke:#6c63ff,color:#fff
    style AdaptersImpl fill:#0f3460,stroke:#53a8b6,color:#fff
    style Infra fill:#1b4332,stroke:#52b788,color:#fff
```

---

## 5. Modelo de Dados (ER Diagram)

```mermaid
erDiagram
    WebhookRawEvent {
        uuid id PK
        string source
        string eventType
        string externalEventId UK
        string signature
        json headersJson
        json payloadJson
        enum status "RECEIVED | QUEUED | PROCESSING | PROCESSED | FAILED | DEAD_LETTERED"
        string lastError
        datetime receivedAt
        datetime processedAt
    }

    PartnerIntegration {
        uuid id PK
        string name
        string slug UK
        boolean isActive
        enum authType "HMAC | NONE | BEARER_TOKEN | BASIC | API_KEY"
        enum signatureAlgorithm "HMAC_SHA1 | SHA256 | SHA384 | SHA512"
        string secret
        string signatureHeaderName
        string signaturePrefix
        string timestampHeaderName
        int timestampToleranceSeconds
        string signedPayloadTemplate
        string eventTypePath
        string externalEventIdPath
        string deliveryIdHeaderName
        datetime createdAt
        datetime updatedAt
    }

    WebhookProcessingAttempt {
        uuid id PK
        uuid webhookEventId FK
        int attemptNumber
        enum status "STARTED | SUCCEEDED | FAILED"
        string errorMessage
        datetime startedAt
        datetime finishedAt
        int latencyMs
    }

    WebhookRawEvent ||--o{ WebhookProcessingAttempt : "has many"
    PartnerIntegration ||--o{ WebhookRawEvent : "source"
```

---

## 6. Fluxo de Vida do Webhook (Sequence Diagram)

Desde o recebimento de um webhook de um parceiro até o processamento final pelo Worker.

```mermaid
sequenceDiagram
    autonumber
    participant Partner as 🌐 Partner
    participant Controller as 📡 WebhooksController
    participant Service as ReceiveWebhookService
    participant UseCase as ReceiveWebhookUseCase
    participant PartnerCfg as PartnerConfigPort
    participant SigValidator as SignatureValidatorPort
    participant PayloadReader as PayloadReaderPort
    participant EventsPort as WebhookEventsPort
    participant Publisher as WebhookPublisherPort
    participant SQS as 📨 SQS Queue
    participant Orchestrator as ⚙️ WorkerOrchestrator
    participant Processor as WebhookEventProcessor
    participant DB as 🗄️ PostgreSQL

    Partner->>Controller: POST /webhooks/:partner
    Controller->>Service: execute(partner, headers, rawBody, payload)
    Service->>UseCase: execute(input)

    UseCase->>PartnerCfg: getActivePartnerOrFail(slug)
    PartnerCfg-->>UseCase: Partner entity

    UseCase->>SigValidator: validate(partner, rawBody, headers)
    SigValidator-->>UseCase: ✅ Valid

    UseCase->>PayloadReader: getString(payload, eventTypePath)
    PayloadReader-->>UseCase: eventType

    UseCase->>EventsPort: findBySourceAndExternalEventId()
    EventsPort-->>UseCase: null (não duplicado)

    UseCase->>EventsPort: create(NewWebhookEvent)
    EventsPort->>DB: INSERT webhook_raw_events
    EventsPort-->>UseCase: PersistedWebhookEvent

    UseCase->>Publisher: publishWebhookEvent(event)
    Publisher->>SQS: SendMessage

    UseCase->>EventsPort: updateStatus(id, QUEUED)
    EventsPort->>DB: UPDATE status = QUEUED

    UseCase-->>Controller: { eventId, status: QUEUED }
    Controller-->>Partner: 202 Accepted

    Note over SQS,Orchestrator: Processamento assíncrono

    Orchestrator->>SQS: ReceiveMessage (long polling)
    SQS-->>Orchestrator: Message(webhookRecordId)

    Orchestrator->>Processor: process(webhookRecordId)
    Processor->>DB: findById + UPDATE status = PROCESSING
    Processor->>DB: INSERT processing_attempt (STARTED)
    Processor->>Processor: Business logic processing
    Processor->>DB: UPDATE status = PROCESSED
    Processor->>DB: UPDATE attempt status = SUCCEEDED
    Processor-->>Orchestrator: ✅ Success

    Orchestrator->>SQS: DeleteMessage
```
