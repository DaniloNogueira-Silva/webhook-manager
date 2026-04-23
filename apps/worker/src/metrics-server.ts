import { createServer } from 'node:http';
import { Logger } from '@nestjs/common';
import { appMetricsRegistry } from '@app/common';

export function startWorkerMetricsServer() {
  const logger = new Logger('WorkerMetricsServer');
  const port = Number(process.env.WORKER_METRICS_PORT ?? 3002);

  const server = createServer(async (req, res) => {
    try {
      if (req.url === '/metrics') {
        const metrics = await appMetricsRegistry.metrics();
        res.writeHead(200, {
          'Content-Type': appMetricsRegistry.contentType,
        });
        res.end(metrics);
        return;
      }

      if (req.url === '/health') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
        });
        res.end(
          JSON.stringify({
            status: 'ok',
            service: 'worker',
          }),
        );
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    } catch (error) {
      res.writeHead(500);
      res.end(
        error instanceof Error ? error.message : 'Unknown metrics server error',
      );
    }
  });

  server.listen(port, () => {
    logger.log(`Worker metrics server listening on http://localhost:${port}`);
  });

  return server;
}
