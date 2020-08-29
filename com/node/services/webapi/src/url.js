import log from 'chess_jslog';

const environment = process.env.NODE_ENV || 'development';

export const isProduction = environment === 'production';

export const PORT = process.env.PORT || 3000;

export const weburl = (!isProduction) ? `http://localhost:${PORT}` : 'https://chess.yusufali.ca';

log(`web url is ${weburl}`);
log(`environment is ${environment}`);
