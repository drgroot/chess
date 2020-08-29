import { copyDatabase } from 'chess_jstransfer';
import app from '../src';

describe('starting', () => {
  it('should start the app', () => app);

  it('copy database', () => copyDatabase({ limit: 100 }));
});
