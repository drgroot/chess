import { assert } from 'chai';
import Send from './app';

const send = (method, methodData = {}) => Send({ model: 'match', method, methodData });
const genGame = (info = {}) => ({
  user: 'yusuf',
  date: new Date(),
  whiteName: 'Yusuf Ali',
  blackName: 'MyFriend',
  database: 'My Games',
  result: 1,
  pgnraw: '',
  moves: [
    { fen: 'position0', nextMove: 'e4' },
    { fen: 'position1', nextMove: 'e5' },
    { fen: 'position0', nextMove: 'f4' },
  ],
  ...info,
});

const invalidInputs = (method, set) => set.forEach(
  ({ test, input }) => it(`should handle invalid inputs: ${test}`, () => send(method, input)
    .then(({ isSuccess }) => assert.isFalse(isSuccess))),
);

describe('Model Match', () => {
  it('ignore invalid methods', () => send('asdad')
    .then(({ isSuccess }) => assert.isFalse(isSuccess)));

  describe('adding match', () => {
    const game1 = genGame();

    it('should be able to add a match', () => send('add', game1)
      .then(({ isSuccess, error }) => assert.isTrue(isSuccess, error)));

    it('should be unable to add duplicate games', () => send('add', game1)
      .then(({ isSuccess, results }) => assert.isFalse(isSuccess, results[0])));

    it('another user can add in the same game', () => send('add', { ...game1, user: 'myfriend' })
      .then(({ isSuccess, error }) => assert.isTrue(isSuccess, error)));

    it('can re-add game after deleting', () => send('find', { user: game1.user, date: game1.date })
      .then(({ results: [{ matchid }] }) => send('delete', matchid))
      .then(() => send('add', game1))
      .then(({ isSuccess, error }) => assert.isTrue(isSuccess, error)));
  });

  describe('finding matches', () => {
    it('should find matches given constraints', () => send('find', { whiteName: 'Yusuf Ali' })
      .then(({ results, error }) => assert.lengthOf(results, 2, error)));

    describe('find by position', () => {
      it('no contraints', () => send('findPosition', 'position0')
        .then(({ results, error }) => assert.lengthOf(results, 2, error)));

      it('with constraints', () => send('findPosition', { position: 'position0', user: 'yusuf' })
        .then(({ results, error }) => assert.lengthOf(results, 1, error)));

      invalidInputs('findPosition', [
        { test: 'not string', input: 3 },
        { test: 'not valid object', input: {} },
      ]);
    });
  });

  describe('repertoire', () => {
    before(() => Promise.all(['white', 'black', 'black', 'black']
      .map((color, i) => send('add', genGame({
        repertoire: color,
        date: new Date((new Date()).getTime() + 1000 * i),
      })))));

    it('should select repetoire games by color', () => send('getRepertoire', { color: 'black', user: 'yusuf' })
      .then(({ results, error }) => assert.lengthOf(results, 3, error)));

    it('should return empty sets', () => send('getRepertoire', { color: 'black', user: 'myfriend' })
      .then(({ results, error }) => assert.lengthOf(results, 0, error)));

    invalidInputs('getRepertoire', [
      { test: 'no object', input: 3 },
      { test: 'no color', input: { user: 'yusuf' } },
      { test: 'invalid color', input: { color: 3, user: 'yusuf' } },
      { test: 'no user', input: { color: 'white' } },
    ]);
  });

  describe('annotations', () => {
    let matchid;
    let moveid;
    before(() => send('add', genGame({ user: 'jay' }))
      .then(({ results: [{ _id: id, moves: [{ _id: moveId }] }] }) => {
        matchid = id;
        moveid = moveId;
      }));

    describe('metadata', () => {
      const inputgen = (op, metadata, id) => ({
        operation: op, matchid, metadataid: id, metadata,
      });
      const c = (op, { metadata, id } = {}) => send('metadata', inputgen(op, metadata, id))
        .then(() => send('find', { user: 'jay' }));

      it('should add metadata', () => c('add', { metadata: { key: 'Event', value: 'Chess.com' } })
        .then(({ results: [{ metadata }] }) => {
          assert.lengthOf(metadata, 1);
          assert.strictEqual(metadata[0].value, 'Chess.com', metadata[0]);
        }));

      it('should be able to delete metadata', () => c('add', { metadata: { key: 'Control', value: 'Blitz' } })
        .then(({ results: [{ metadata: [{ _id: id }] }] }) => {
          assert.isDefined(id);
          return c('delete', { id });
        })
        .then(({ results: [{ metadata }] }) => {
          assert.lengthOf(metadata, 1);
          assert.strictEqual(metadata[0].value, 'Blitz');
        }));

      invalidInputs('metadata', [
        { test: 'requires valid operation', input: inputgen('asdasdasd') },
        { test: 'adding requires no metadata id', input: inputgen('add', { key: 'C', v: 'B' }, 'myid') },
        { test: 'deleting requires an id', input: inputgen('delete', false) },
        { test: 'deleting requires an existing id', input: inputgen('delete', false, 'asdada') },
      ]);
    });

    describe('move annotations', () => {
      const inputgen = (op, annotation, annotationid) => ({
        operation: op, matchid, moveid, annotation, annotationid,
      });
      const c = (op, a, id) => send('annotation', inputgen(op, a, id))
        .then(() => send('find', { user: 'jay' }));

      it('should be able to add an annotation', () => c('add', { version: 1, annotator: 'stockfish', metadata: [{ key: 'C', value: 1 }] })
        .then(({ results: [match] }) => {
          assert.lengthOf(match.moves[0].annotations, 1);
          assert.strictEqual(match.moves[0].annotations[0].annotator, 'stockfish');
        }));

      it('delete annotation', () => send('find', { user: 'jay' })
        .then(({ results: [{ moves: [{ annotations: [{ _id: id }] }] }] }) => c('delete', 0, id))
        .then(({ results: [match] }) => assert.lengthOf(match.moves[0].annotations, 0))
        .then(() => c('add', { version: 1, annotator: 'stockfish', metadata: [{ key: 'C', value: 1 }] })));

      it('get matches with no annotations', () => send('noAnnotations', 1)
        .then(({ results }) => assert.notInclude(results.map(({ user }) => user), 'jay')));
    });

    describe('moves', () => {
      const inputgen = (op, move, mid) => ({
        operation: op, matchid, moveid: mid, move,
      });
      const c = (op, m, id) => send('move', inputgen(op, m, id))
        .then(() => send('find', { user: 'jay' }));

      it('add move',
        () => c(
          'add',
          {
            fen: 'position2',
            nextMove: 'exf4',
            metadata: [{ key: 'c', value: 1 }],
            annotations: [{ version: 1, annotator: 'yusuf' }],
          },
        ).then(({ results: [{ moves }] }) => {
          const move = moves.pop();
          assert.strictEqual(move.fen, 'position2', move);
          assert.strictEqual(move.metadata[0].value, 1);
        }));

      it('delete move', () => c('delete', 0, moveid)
        .then(
          ({ results: [{ moves }] }) => assert.notInclude(moves.map(({ _id: i }) => i), moveid),
        ));
    });
  });
});
