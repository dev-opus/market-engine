import { Hono } from 'hono';
import { Config } from './config.js';
import { serve } from '@hono/node-server';
import { OrderBook } from './orderbook.js';
import { createNodeWebSocket } from '@hono/node-ws';

const config = new Config();
config.ensureEnvVariables();
const logger = config.getLogger();

const app = new Hono();
const orderBook = new OrderBook(logger);

const INTERVAL_MS = 400;

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get('/api/v3/depth', (c) => {
  const snapshot = orderBook.getSnapshot();
  return c.json(snapshot);
});

app.get(
  '/ws',
  upgradeWebSocket((c) => {
    let interval: NodeJS.Timeout;
    return {
      onOpen: (_, ws) => {
        logger.info('WebSocket connection established');
        interval = setInterval(() => {
          const update = orderBook.generateUpdate();
          ws.send(JSON.stringify(update));
        }, INTERVAL_MS);
      },
      onMessage: (evt) => {
        logger.info('Websocket message received', evt.data);
      },
      onClose: () => {
        logger.info('WebSocket connection closed');
        clearInterval(interval);
      },
    };
  })
);

const server = serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT),
  },
  (info) => {
    logger.info(`Server is running on http://localhost:${info.port}`);
  }
);

injectWebSocket(server);
