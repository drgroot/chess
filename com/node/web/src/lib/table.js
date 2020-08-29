const updateTable = ({
  element: table,
  group,

  keyGenerator = (entry) => entry.key,
  entryValidator = () => true,
  nodeUpdator = false,

  valuesGenerator,
  rowClasslist = [],
  tdClassList = [],
  rowCallback = () => true,
} = {}) => {
  const tableId = table.id;
  const idGen = (key) => `${tableId}_key${key}`;
  const nodes = new Set(Array.from(table.children).map((node) => node.getAttribute('key')));

  for (const entry of group) {
    if (entryValidator(entry)) {
      const key = keyGenerator(entry);

      if (nodes.has(key)) {
        nodes.delete(key);

        if (nodeUpdator) {
          nodeUpdator(
            document.getElementById(idGen(key)),
            entry,
          );
        }
      } else {
        const id = idGen(key);
        const row = document.createElement('div');
        row.setAttribute('key', key);
        row.id = id;
        row.classList.add(...rowClasslist);

        const rowDoms = valuesGenerator(entry)
          .map((t) => {
            const dom = document.createElement('div');
            dom.innerText = t;
            row.appendChild(dom);
            dom.classList.add(...tdClassList);
            return dom;
          });
        rowCallback(rowDoms);

        table.appendChild(row);
      }
    }
  }

  nodes.forEach((key) => document.getElementById(idGen(key)).remove());
};

export default updateTable;
