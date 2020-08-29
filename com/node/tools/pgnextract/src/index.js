import log from 'chess_jslog';
import { consumer } from 'chess_jsrabbitmq';
import splitVariations from './pgnextract';

const onMessage = (msg, ch, input) => {
  if (typeof input !== 'string') {
    log('[ERROR] input must be pgn', input);
    return Promise.reject(new Error('invalid input'));
  }

  return splitVariations(input);
};

export const queueName = 'pgnextract';
const app = () => consumer(queueName, onMessage);

if (require.main === module) {
  app();
}

export default app;
