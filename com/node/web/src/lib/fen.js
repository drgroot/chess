const stripFen = (fen) => fen.split(/\s/g).slice(0, 2).join(' ');
export default stripFen;
