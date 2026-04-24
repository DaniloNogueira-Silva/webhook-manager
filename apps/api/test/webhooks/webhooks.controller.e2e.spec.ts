import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { WebhooksController } from '../../src/modules/webhooks/controllers/webhooks.controller';
import { ReceiveWebhookService } from '../../src/modules/webhooks/services/receive-webhook.service';

describe('WebhooksController (e2e)', () => {
  let app: INestApplication;
  const receiveWebhookServiceMock = {
    execute: jest
      .fn()
      .mockResolvedValue({ eventId: 'evt-1', status: 'QUEUED' }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: ReceiveWebhookService,
          useValue: receiveWebhookServiceMock,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    receiveWebhookServiceMock.execute.mockClear();
  });

  it('POST /webhooks/:partner should return 202', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post('/webhooks/acme')
      .set('x-signature', 'abc')
      .send({ id: 'evt-1' })
      .expect(202)
      .expect({ eventId: 'evt-1', status: 'QUEUED' });

    expect(receiveWebhookServiceMock.execute).toHaveBeenCalledTimes(1);
    expect(receiveWebhookServiceMock.execute).toHaveBeenCalledWith(
      expect.objectContaining({ partner: 'acme' }),
    );
  });
});
