import './index.css';

import './template';
import Crossfilter from 'crossfilter2';
import Chess from 'chess.js';
import State from './lib/state';
import { get } from './lib/request';
import stripFen from './lib/fen';

import './vendors/chessboardjs/chessboard-1.0.0';
import './vendors/chessboardjs/chessboard-1.0.0.css';

const gameLookup = {};
const game = new Chess();
const state = new State([
  { name: 'move', value: -1 },
  { name: 'position', value: stripFen(game.fen()) },
  { name: 'n', value: -1 },
]);

// define crossfilters
const crossfilter = Crossfilter([]);
const matchidDim = crossfilter.dimension((d) => d.matchid);
// const black = crossfilter.dimension((d) => d.blackName);
// const white = crossfilter.dimension((d) => d.whiteName);
const fenDim = crossfilter.dimension((d) => d.fen);
const nextMoveDim = crossfilter.dimension((d) => d.nextMove);

const { Chessboard } = window;
const board = Chessboard('chessboard', {
  position: 'start',
  draggable: true,
  dropOffBoard: 'snapback',
  onSnapEnd: (from, to) => {
    state.setState({ move: { from, to } });
  },
});
fenDim.filter(stripFen(game.fen()));

// subscriptions
state.subscribe('move', (o, { move }) => {
  const sucess = game.move(move);
  const position = game.fen();

  if (sucess) {
    state.setState({ position });
  } else {
    board.position(position);
  }
});
state.subscribe('position', (o, { position }) => {
  board.position(position);
  fenDim.filter(stripFen(position));
});

// update recent games
const updateGames = () => {
  const currentPosition = stripFen(game.fen());
  const idGen = (matchid) => `exactGames_matchid${matchid}`;
  const gameTable = document.getElementById('exactGames');
  const matchNodes = new Set(
    Array.from(gameTable.children)
      .map((node) => node.getAttribute('matchid')),
  );
  for (const { matchid } of matchidDim.top(Infinity)) {
    const id = idGen(matchid);
    const match = gameLookup[matchid];
    const moveIndex = match.moves.findIndex((m) => m.fen === currentPosition);
    const moves = match.moves
      .slice(moveIndex, moveIndex + 5)
      .map((m) => m.nextMove)
      .join(' ');

    if (matchNodes.has(matchid)) {
      const row = document.getElementById(id);
      row.children[row.children.length - 1].innerText = moves;
      matchNodes.delete(matchid);
    } else {
      const row = document.createElement('div');
      row.setAttribute('matchid', matchid);
      row.id = id;
      row.classList.add('grid', 'grid-cols-7');

      [
        match.date.getFullYear(),
        match.whiteName,
        match.whiteElo,
        match.blackName,
        match.blackElo,
        match.result,
        moves,
      ]
        .forEach((t) => {
          const dom = document.createElement('div');
          dom.innerText = t;
          row.appendChild(dom);
          return dom;
        });

      gameTable.appendChild(row);
    }
  }
  matchNodes.forEach((matchid) => document.getElementById(idGen(matchid)).remove());
};
state.subscribe('position', updateGames);
state.subscribe('n', updateGames);

// MAIN
const matches = new Set();
const getGames = (skip = 0) => get('/api/games', { skip, chunkSize: (skip === 0) ? 500 : 1000 })
  .then(({ games, finished }) => {
    const data = [];
    for (const g of games) {
      if (!matches.has(g.matchid)) {
        g.date = new Date(g.date);
        gameLookup[g.matchid] = g;
        matches.add(g.matchid);

        for (const move of g.moves) {
          data.push({
            matchid: g.matchid,
            blackName: g.blackName,
            whiteName: g.whiteName,
            date: g.date,
            blackElo: g.blackElo,
            whiteElo: g.whiteElo,
            result: g.result,
            fen: move.fen,
            nextMove: move.nextMove,
          });
        }
      }
    }
    crossfilter.add(data);

    if (!finished) {
      getGames(games.length + skip);
    }

    state.setState({ n: crossfilter.size() });
  });
getGames();

document.getElementById('undoMove').addEventListener('click', () => {
  game.undo();
  state.setState({ position: game.fen() });
});

Promise.all([
  import(
    /* webpackPreload: true */
    /* webpackPrefetch: true */
    /* webpackChunkName: "repertoire" */
    './components/repertoire'
  ),
  import(
    /* webpackPreload: true */
    /* webpackPrefetch: true */
    /* webpackChunkName: "movetree" */
    './components/movetree'
  ),
])
  .then(([repertoire, movetree]) => {
    repertoire.default(state);
    movetree.default(state, nextMoveDim);
  });
