import mongoose from 'mongoose';
import log from './log';
import nodeMQ from './rabbitmq';
import version from './models/version';

// models
import Match from './models/match';
// import User from './models/user';

/**
 * @typedef Message
 * @param {string} model the model to perform the operation (eg: player)
 * @param {string} method the method to use. eg: findOne
 * @param {any[]|any} methodData data to be passed into the method
 * @description special case for method will be save.
 */

const inputChecks = (message) => {
  const {
    model,
    method,
    methodData,
  } = message;

  if (
    typeof model !== 'string'
    || typeof method !== 'string'
  ) {
    return false;
  }

  if (typeof methodData === 'undefined' || methodData === null) return false;

  return true;
};

/**
 * @param {Message} msg
 * @param {Channel} ch
 */
const consumeMessage = (msg, ch, input) => {
  if (!inputChecks(input)) {
    log('[ERROR] invalid inputs', input);
    const response = { isSuccess: false, results: [], error: 'invalid inputs' };
    return nodeMQ.reply(msg, ch, response);
  }
  log('received message', input);

  let job;
  switch (input.model) {
    case 'match':
      job = Match(input);
      break;
    // case 'user':
    //  job = User(input);
    //  break;
    default:
      job = Promise.reject(new Error('invalid model'));
  }

  return Promise.resolve(job)
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

mongoose.connect(process.env.MONGODB, {
  useNewUrlParser: true,
  autoIndex: false,
})
  .catch((err) => {
    log('[ERROR] connecting to database', err.message || err);
    process.exit();
  });

export const queueName = 'dbapi';

const consumer = () => version()
  .then(() => nodeMQ.consume({
    queueName,
    onMessage: consumeMessage,
    prefetch: (process.env.PREFETCH) ? parseInt(process.env.PREFETCH, 10) : 4,
    onConsuming: () => log('starting'),
  }));

if (require.main === module) {
  consumer();
}

export default consumer;
