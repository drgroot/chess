import updateTable from '../../lib/table';

const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumSignificantDigits: 3 });

const initGroup = () => ({
  matchids: new Set(),
  totalElo: 0,
  avgElo: 0,
  wins: 0,
  loss: 0,
  draw: 0,
});

const remove = (a, entry) => {
  if (a.matchids.has(entry.matchid)) {
    const p = { ...a };
    p.matchids.delete(entry.matchid);
    p.totalElo -= (entry.fen.endsWith('b')) ? entry.blackElo : entry.whiteElo;
    p.avgElo = (p.matchids.size > 0) ? p.totalElo / p.matchids.size : 0;

    if (entry.result === 1) {
      p.wins -= 1;
    } else if (entry.result === 0.5) {
      p.draw -= 1;
    } else {
      p.loss -= 1;
    }

    return p;
  }
  return a;
};

const add = (a, entry) => {
  if (!a.matchids.has(entry.matchid)) {
    const p = { ...a };
    p.matchids.add(entry.matchid);
    p.totalElo += (entry.fen.endsWith('b')) ? entry.blackElo : entry.whiteElo;
    p.avgElo = (p.matchids.size > 0) ? p.totalElo / p.matchids.size : 0;

    if (entry.result === 1) {
      p.wins += 1;
    } else if (entry.result === 0.5) {
      p.draw += 1;
    } else {
      p.loss += 1;
    }

    return p;
  }
  return a;
};

const valuesGenerator = (entry) => [
  entry.key,
  entry.value.matchids.size,
  percentFormatter.format(entry.value.wins / entry.value.matchids.size),
  percentFormatter.format(entry.value.draw / entry.value.matchids.size),
  percentFormatter.format(entry.value.loss / entry.value.matchids.size),
];

const update = (state, group) => () => updateTable({
  element: document.getElementById('componentMoveTree'),
  group: group.order((p) => p.matchids.size).top(Infinity),
  entryValidator: (e) => e.value.matchids.size > 0,
  rowClasslist: ['grid', 'grid-cols-5'],

  valuesGenerator,
  rowCallback(entry, row, tds) {
    tds[0].addEventListener('click', () => state.setState({ move: entry.key }));
  },
  nodeUpdator(entry, row, children) {
    // eslint-disable-next-line no-param-reassign
    valuesGenerator(entry).forEach((v, i) => { children[i].innerText = v; });
  },
});

const init = (state, nextMoveDim) => {
  const nextMoveGroup = nextMoveDim
    .group()
    .reduce(add, remove, initGroup);

  const updateFun = update(state, nextMoveGroup);
  state.subscribe('position', updateFun);
  state.subscribe('n', updateFun);
};

export default init;
