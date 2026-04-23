import { Registry, collectDefaultMetrics } from 'prom-client';

export const appMetricsRegistry = new Registry();

collectDefaultMetrics({
  register: appMetricsRegistry,
  prefix: 'webhook_platform_',
});
