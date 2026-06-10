import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { DatabaseService } from './DatabaseService';
import { webhookLogger } from '../Utils/apiLogger';

export class WebhookService {
  private dbService: DatabaseService;
  private retryQueue: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.dbService = new DatabaseService();
  }

  async sendWebhook(sessionId: string, event: string, payload: any): Promise<void> {
    try {
      const session = await this.dbService.getSession(sessionId);
      if (!session) {
        webhookLogger.warn(`Session ${sessionId} not found for webhook`);
        return;
      }

      const webhooks = await this.dbService.getUserWebhooks(session.userId);
      const relevantWebhooks = webhooks.filter(webhook =>
        webhook.events.includes(event) || webhook.events.includes('*')
      );

      for (const webhook of relevantWebhooks) {
        await this.deliverWebhook(
          webhook.id,
          webhook.url,
          event,
          payload,
          webhook.secret ?? undefined   // null → undefined
        );
      }
    } catch (error) {
      webhookLogger.error('Error sending webhooks:' + error);
    }
  }

  private async deliverWebhook(
    webhookId: string,
    url: string,
    event: string,
    payload: any,
    secret?: string
  ): Promise<void> {
    try {
      const delivery = await this.dbService.client.webhookDelivery.create({
        data: { webhookId, event, payload, status: 'PENDING' }
      });

      const webhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: payload
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Baileys-API-Webhook/1.0'
      };

      if (secret) {
        headers['X-Webhook-Signature'] = this.createSignature(
          JSON.stringify(webhookPayload),
          secret
        );
      }

      const response = await axios.post(url, webhookPayload, {
        headers,
        timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '10000'),
        validateStatus: (status) => status < 500
      });

      await this.updateDeliveryStatus(delivery.id, response);

      webhookLogger.info(`Webhook delivered successfully to ${url} [${response.status}]`);

    } catch (error: any) {
      webhookLogger.error(`Webhook delivery failed for ${url}: ${error?.message}`);
      await this.handleWebhookError(webhookId, url, event, payload, secret, error);
    }
  }

  private async updateDeliveryStatus(
    deliveryId: string,
    response: AxiosResponse
  ): Promise<void> {
    const status = response.status >= 200 && response.status < 300 ? 'SUCCESS' : 'FAILED';

    await this.dbService.client.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: status as any,
        response: JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          data: response.data
        }),
        attempts: { increment: 1 }
      }
    });
  }

  private async handleWebhookError(
    webhookId: string,
    url: string,
    event: string,
    payload: any,
    secret?: string,
    error?: any
  ): Promise<void> {
    try {
      const webhook = await this.dbService.client.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) return;

      await this.dbService.client.webhook.update({
        where: { id: webhookId },
        data: {
          retries: { increment: 1 },
          lastError: error?.message || 'Unknown error'
        }
      });

      if (webhook.retries < webhook.maxRetries) {
        const retryDelay = this.calculateRetryDelay(webhook.retries);

        const timeoutId = setTimeout(() => {
          this.deliverWebhook(webhookId, url, event, payload, secret);
          this.retryQueue.delete(webhookId);
        }, retryDelay);

        this.retryQueue.set(webhookId, timeoutId);

        const delivery = await this.dbService.client.webhookDelivery.findFirst({
          where: { webhookId, event, status: 'PENDING' },
          orderBy: { createdAt: 'desc' }
        });

        if (delivery) {
          await this.dbService.client.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'RETRYING',
              nextRetry: new Date(Date.now() + retryDelay),
              attempts: { increment: 1 }
            }
          });
        }
      } else {
        const delivery = await this.dbService.client.webhookDelivery.findFirst({
          where: { webhookId, event, status: { in: ['PENDING', 'RETRYING'] } },
          orderBy: { createdAt: 'desc' }
        });

        if (delivery) {
          await this.dbService.client.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'FAILED',
              response: JSON.stringify({ error: error?.message || 'Max retries exceeded' })
            }
          });
        }
      }
    } catch (retryError) {
      webhookLogger.error('Error handling webhook retry:' + retryError);
    }
  }

  private calculateRetryDelay(retryCount: number): number {
    return Math.min(Math.pow(2, retryCount) * 1000, 5 * 60 * 1000);
  }

  private createSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const expected = this.createSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  async testWebhook(webhookId: string): Promise<boolean> {
    try {
      const webhook = await this.dbService.client.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) throw new Error('Webhook not found');

      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: { message: 'This is a test webhook delivery', webhookId }
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Baileys-API-Webhook/1.0'
      };

      if (webhook.secret) {
        headers['X-Webhook-Signature'] = this.createSignature(
          JSON.stringify(testPayload),
          webhook.secret
        );
      }

      const response = await axios.post(webhook.url, testPayload, {
        headers,
        timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '10000')
      });

      return response.status >= 200 && response.status < 300;
    } catch (error: any) {
      webhookLogger.error(`Webhook test failed: ${error?.message}`);
      return false;
    }
  }

  async getWebhookDeliveries(webhookId: string, limit = 50, offset = 0) {
    return this.dbService.client.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  async retryFailedDeliveries(webhookId: string): Promise<number> {
    const failedDeliveries = await this.dbService.client.webhookDelivery.findMany({
      where: { webhookId, status: 'FAILED' },
      include: { webhook: true }
    });

    let retriedCount = 0;
    for (const delivery of failedDeliveries) {
      if (delivery.webhook.retries < delivery.webhook.maxRetries) {
        await this.deliverWebhook(
          webhookId,
          delivery.webhook.url,
          delivery.event,
          delivery.payload,
          delivery.webhook.secret ?? undefined
        );
        retriedCount++;
      }
    }

    return retriedCount;
  }

  async cleanup(): Promise<void> {
    for (const [, timeoutId] of this.retryQueue) {
      clearTimeout(timeoutId);
    }
    this.retryQueue.clear();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await this.dbService.client.webhookDelivery.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } }
    });

    webhookLogger.info('Webhook service cleanup completed');
  }
}
