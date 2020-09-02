import os from 'os';
import winston from 'winston';
import Slack from 'winston-slack-webhook-transport';

const logger = winston.createLogger()
  .clear();

if (process.env.SLACK_URL) {
  const username = process.env.SERVICE_NAME || os.hostname();

  const customFormat = (info) => {
    const opts = info[Symbol.for('splat')];
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `[${username}] ${info.level}: ${info.message}`,
        },
      },
    ];

    if (typeof opts !== 'undefined' && opts.length > 0) {
      for (const [index, obj] of opts.entries()) {
        if (index < 3) {
          const value = JSON.stringify(obj);
          if (Buffer.byteLength(value, 'utf8') / (1024 * 1024.0) <= 30.0) {
            blocks.push({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ['`', value, '`'].join(''),
              },
            });
          }
        }
      }
      blocks.push({ type: 'divider' });
    }

    return { blocks };
  };

  logger.add(
    new Slack({
      webhookUrl: process.env.SLACK_URL,
      channel: '#logs',
      handleExceptions: true,
      formatter: customFormat,
    }),
  );
}

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console());
}

logger.exitOnError = false;

const log = (...logArgs) => logger.info(...logArgs);

export default log;
