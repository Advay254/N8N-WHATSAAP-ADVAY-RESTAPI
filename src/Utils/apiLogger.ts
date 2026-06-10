import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const baseOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  })
};

export const logger = pino({ ...baseOptions, name: 'api' });
export const whatsappLogger = pino({ ...baseOptions, name: 'whatsapp' });
export const webhookLogger = pino({ ...baseOptions, name: 'webhook' });
export const dbLogger = pino({ ...baseOptions, name: 'database' });

export default logger;
