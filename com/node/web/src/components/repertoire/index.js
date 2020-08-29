import Crossfilter from 'crossfilter2';
import { get } from '../../lib/request';
import stripFen from '../../lib/fen';
import updateTable from '../../lib/table';

const crossfilter = Crossfilter([]);
const fenDim = crossfilter.dimension((d) => d.fen);
const nextMoveDim = crossfilter.dimension((d) => d.nextMove);
const colorDim = crossfilter.dimension((d) => d.color);
const nameDim = crossfilter.dimension((d) => d.name);

const update = () => updateTable({
  element: document.getElementById('componentRepertoire'),
  group: nextMoveDim.group().top(Infinity),
  entryValidator: (entry) => entry.value > 0,
  rowClasslist: ['grid', 'grid-cols-2'],

  valuesGenerator: (entry) => {
    nextMoveDim.filter(entry.key);
    const [{ name }] = nameDim.top(1);
    return [entry.key, name];
  },
});

const subFunctons = (state) => {
  colorDim.filter(state.state.color);
  document.getElementById('repertoire_load_white')
    .addEventListener('click', () => state.setState({ color: 'white' }));
  document.getElementById('repertoire_load_black')
    .addEventListener('click', () => state.setState({ color: 'black' }));
  state.subscribe('color', (o, { color }) => colorDim.filter(color));
  state.subscribe('color', update);
};

const init = (state) => {
  fenDim.filter(stripFen(state.state.position));
  state.subscribe('position', (o, { position }) => fenDim.filter(stripFen(position)));
  state.subscribe('position', update);

  if (state.state.color) {
    subFunctons(state);
  } else {
    import(
      /* webpackChunkName: "state" */
      '../../lib/state'
    )
      .then(({ default: State }) => {
        const myState = new State([
          { name: 'color', value: 'white' },
        ]);
        subFunctons(myState);
      });
  }
};

Promise.all([
  get('/api/repertoire/white'),
  get('/api/repertoire/black'),
])
  .then(([w, b]) => {
    const data = [];

    for (const match of [...w, ...b]) {
      for (const move of match.moves) {
        data.push({
          key: data.length,
          fen: move.fen,
          nextMove: move.nextMove,
          color: match.repertoire,
          name: `${match.database} ${match.blackName.replace(/^\d+\s+/, '')}`,
        });
      }
    }
    crossfilter.add(data);
    update();
  });

export default init;
