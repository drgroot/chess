import splitVariations from './pgnextract';
import nodeMQ from './rabbitmq';
import log from './log';

const onMessage = (msg, ch, input) => {
  if (typeof input !== 'string') {
    log('[ERROR] input must be pgn', input);
    return nodeMQ.reply(msg, ch, { isSuccess: false, results: [], error: 'invalid input' });
  }

  return splitVariations(input)
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
    .then((response) => nodeMQ.reply(msg, ch, response));
};

export const queueName = 'pgnextract';
const consumer = () => nodeMQ
  .consume({
    queueName,
    onMessage,
    prefetch: (process.env.PREFETCH) ? parseInt(process.env.PREFETCH, 10) : 4,
    onConsuming: () => log('starting'),
  });

if (require.main === module) {
  consumer();
}

export default consumer;
