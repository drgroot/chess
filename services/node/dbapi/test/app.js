import { assert } from 'chai';
import app, { queueName } from '../src';
import command from '../src/transfer';
import rabbitmq from '../src/rabbitmq';

const send = (obj) => rabbitmq.publishMessage(queueName, obj);
const reset = () => command({
  _: ['matches', 'versions'],
  operation: 'drop',
  skipTransfer: true,
});

describe('app testing', () => {
  before(() => reset());

  it('should start', () => app());

  it('should reject unknown methods', () => send({
    model: 'asdad',
    method: 'match',
    methodData: true,
  })
    .then(({ isSuccess, error }) => {
      assert.isFalse(isSuccess);
      assert.strictEqual('invalid model', error);
    }));

  ['model', 'method', 'methodData'].forEach(
    (k) => it(`${k} should be valid and defined`, () => send({
      model: 'amodel',
      method: 'aemothd',
      methodData: {},
      [k]: null,
    }).then(({ isSuccess, error }) => {
      assert.isFalse(isSuccess);
      assert.strictEqual('invalid inputs', error);
    })),
  );
});

export default send;
