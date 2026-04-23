import { Counter, Gauge, Histogram } from 'prom-client';
import { appMetricsRegistry } from './metrics.registry';

export const webhookReceivedCounter = new Counter({
  name: 'webhook_received_total',
  help: 'Total de webhooks recebidos',
  labelNames: ['partner'],
  registers: [appMetricsRegistry],
});

export const webhookQueuedCounter = new Counter({
  name: 'webhook_queued_total',
  help: 'Total de webhooks publicados na fila',
  labelNames: ['partner'],
  registers: [appMetricsRegistry],
});

export const webhookProcessedCounter = new Counter({
  name: 'webhook_processed_total',
  help: 'Total de webhooks processados com sucesso',
  labelNames: ['partner', 'event_type'],
  registers: [appMetricsRegistry],
});

export const webhookFailedCounter = new Counter({
  name: 'webhook_failed_total',
  help: 'Total de falhas no processamento de webhook',
  labelNames: ['partner', 'event_type'],
  registers: [appMetricsRegistry],
});

export const webhookDeadLetteredCounter = new Counter({
  name: 'webhook_dead_lettered_total',
  help: 'Total de webhooks marcados como dead-lettered',
  labelNames: ['partner', 'event_type'],
  registers: [appMetricsRegistry],
});

export const webhookProcessingDurationMs = new Histogram({
  name: 'webhook_processing_duration_ms',
  help: 'Latência do processamento de webhook em milissegundos',
  labelNames: ['partner', 'event_type'],
  buckets: [50, 100, 250, 500, 1000, 2000, 5000],
  registers: [appMetricsRegistry],
});

export const webhookQueueBacklogGauge = new Gauge({
  name: 'webhook_queue_backlog_visible_messages',
  help: 'Quantidade de mensagens visíveis na fila principal',
  registers: [appMetricsRegistry],
});

export const webhookDlqBacklogGauge = new Gauge({
  name: 'webhook_dlq_backlog_visible_messages',
  help: 'Quantidade de mensagens visíveis na DLQ',
  registers: [appMetricsRegistry],
});
