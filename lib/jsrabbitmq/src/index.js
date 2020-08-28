import rabbitMQ from 'nodejsmq';
import log from 'chess_jslog';

const nodemq = rabbitMQ(process.env.RABBITMQ);
nodemq.connection
  .then(
    (conn) => {
      conn.on('error', (e) => {
        log('[ERROR] Cannot connect to rabbitmq', e.message || e);
        process.exit();
      });

      conn.on('close', (e) => {
        log('[ERROR] Cannot connect to rabbitmq', e.message || e);
        process.exit();
      });
    },
  ).catch((e) => {
    log('[ERROR] Cannot connect to rabbitmq', e.message || e);
    process.exit();
  });

export default nodemq;

export const consumer = (queueName, handleMessage) => nodemq.consume({
  queueName,
  prefetch: (process.env.PREFETCH) ? parseInt(process.env.PREFETCH, 10) : 4,
  onConsuming: () => log('starting'),
  onMessage: (msg, ch, input) => Promise.resolve(handleMessage(msg, ch, input))
    .then((res) => {
      log('successfully processed job', res);
      return {
        isSuccess: true,
        results: (res.constructor === Array) ? res : [res],
        error: null,
      };
    })
    .catch((e) => {
      const error = (e.message) ? e.message : e;
      log('[ERROR] processing job', error);
      return { isSuccess: false, results: [], error };
    })
    .then((response) => nodemq.reply(msg, ch, response)),
});
