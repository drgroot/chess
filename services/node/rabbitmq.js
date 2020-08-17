import rabbitMQ from 'nodejsmq';
import log from './log';

const consumer = rabbitMQ(process.env.RABBITMQ);
consumer.connection
  .then(
    (conn) => {
      conn.on('error', (e) => {
        log.info('[ERROR] Cannot connect to rabbitmq', e.message || e);
        process.exit();
      });

      conn.on('close', (e) => {
        log.info('[ERROR] Cannot connect to rabbitmq', e.message || e);
        process.exit();
      });
    },
  ).catch((e) => {
    log.info('[ERROR] Cannot connect to rabbitmq', e.message || e);
    process.exit();
  });

export default consumer;
