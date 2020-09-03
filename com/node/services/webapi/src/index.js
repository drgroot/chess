import express from 'express';
import cors from 'cors';
import log from 'chess_jslog';
import { weburl, PORT } from './url';

import gamesRouter from './routes/games';
import repertoireRouter from './routes/repertoire';

const corsOption = { origin: weburl, credentials: true, optionsSuccessStatus: 200 };

const routes = [
  { method: 'get', path: '/', args: [(req, res) => res.send('Works')] },
  { method: 'use', path: '/games', args: [gamesRouter] },
  { method: 'use', path: '/repertoire', args: [repertoireRouter] },
];

const limit = '50mb';
const app = express();
app.enable('trust proxy');
app.use(cors(corsOption));
app.use(express.json({ limit }));
app.use(express.urlencoded({ extended: true, limit }));

// setup routes
for (const { method, path, args } of routes) {
  if ((!path.startsWith('/')) || (path.endsWith('/') && path !== '/')) {
    log(`${path} is not valid`);
    process.exit(1);
  }

  const route = `/api${path}`;
  if (method === 'get') {
    app.get(route, ...args);
  } else if (method === 'use') {
    app.use(route, ...args);
  } else {
    log(`${method} is invalid`);
    process.exit(1);
  }
}

// start app
app.listen(PORT, () => log(`Application server listening on ${PORT}`));

export default app;
