import { assert } from 'chai';
import rabbitmq from 'chess_jsrabbitmq';
import app, { queueName } from '../src';
import { clear } from './version';

const send = (obj) => rabbitmq.publishMessage(queueName, obj);

describe('app testing', () => {
  before(() => clear());

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
