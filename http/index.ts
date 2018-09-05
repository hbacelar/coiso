// Native
import {
  createServer as nodeCreateServer,
  Server,
  IncomingMessage,
  ServerResponse
} from 'http';
import { Socket } from 'net';
import { parse as parseURL } from 'url';

// 3rd party
import WebSocket from 'ws';
import { createError } from '../error';
import { log, logError } from '../log';
const findMyWay = require('find-my-way');

export type RequestContext = {
  params: { [key: string]: any },
  log?: any // TODO: implement
};

export type RequestHandler = (req: IncomingMessage, res: ServerResponse, ctx?: RequestContext) => Promise<void>

export type WebSocketHandler = (ws: WebSocket, req: IncomingMessage, ctx?: RequestContext) => Promise<void>

export interface APIServer {
  // Raw nodejs server
  server: Server;

  /* route methods */
  addRequestHandler(route: string, handler: RequestHandler): APIServer;
  addWebsocketHandler(route: string, handler: WebSocketHandler): APIServer;

  /* lifecyle methods */
  listen(ifc_path: string, port?: number): Promise<void>;
  close(): Promise<void>;
}

// Used to run code when process is bound to shutdown
function registerShutdown(fn: () => void) {
  let run = false;

  const wrapper = () => {
    if (!run) {
      run = true;
      fn();
    }
  };

  process.once('SIGINT', wrapper); // <Ctrl>+C
  process.once('SIGTERM', wrapper); // Signal 15
  process.once('exit', wrapper);
}

export function createServer(): APIServer {
  let routes = 0;
  const router = findMyWay({
    defaultRoute(_: IncomingMessage, res: ServerResponse) {
      res.statusCode = 404
      res.end()
    },
    ignoreTrailingSlash: true,
    allowUnsafeRegex: false,
    caseSensitive: true // TODO: review this decision
  });
  const websocket_router = findMyWay({
    ignoreTrailingSlash: true,
    allowUnsafeRegex: false,
    caseSensitive: true // TODO: review this decision
  });
  const server = enableDestroy(nodeCreateServer());

  // Possible errors are kernel file limits being reached
  server.on('error', function (e) {
    logError(e);
  })

  // Possible errors are incorrect/malformed HTTP requests
  server.on('clientError', (e: Error, socket: Socket) => {
    logError(e);
    socket.destroy();
  });

  server.on('request', async (req: IncomingMessage, res: ServerResponse) => {
    try {
      await router.lookup(req, res);
    } catch (e) {
      logError(e);
      res.statusCode = 500;
      res.end();
    }
  });

  server.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
    const path = parseURL(req.url || '').pathname;
    const { handler, params } = websocket_router.find(req.method, path);

    if (!handler) {
      socket.destroy();
      return;
    }

    // Calls route handler
    handler(req, socket, head, params);
  });

  return {
    get server(): Server {
      return server;
    },

    addRequestHandler(route: string, handler: RequestHandler): APIServer {
      router.all(route, handler);
      routes += 1;
      log(`Registered handler for "${route}"`);
      return this;
    },

    addWebsocketHandler(route: string, handler: WebSocketHandler): APIServer {
      // TODO: add support for `verifyClient`
      const wss = new WebSocket.Server({ noServer: true, perMessageDeflate: false });

      wss.on('error', function (e) {
        logError(e);
      });

      wss.on('connection', async (ws: WebSocket, req: IncomingMessage, ctx: RequestContext) => {
        try {
          await handler(ws, req, ctx);
        } catch (e) {
          logError(e);
          // @link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
          ws.close(1011);
        }
      });

      websocket_router.all(route, (req: IncomingMessage, socket: Socket, head: Buffer, params: object): void => {
        wss.handleUpgrade(req, socket, head, function onSuccessfulUpgrade(ws: WebSocket) {
          wss.emit('connection', ws, req, { params });
        });
      });

      routes += 1;
      log(`Registered websocket handler for "${route}"`);
      return this;
    },

    listen(ifc_path: string, port?: number): Promise<void> {
      return new Promise((resolve, reject) => {
        if (routes === 0) {
          return reject(createError('no-routes', 'No HTTP routes defined'));
        }

        // Possible errors include EADDRINUSE
        server.once('error', reject);

        const listen = ifc_path
          ? server.listen.bind(server, port, ifc_path)
          : server.listen.bind(server, ifc_path);

        listen(() => {
          const details = server.address();

          registerShutdown(() => {
            log('HTTP server shutdown');
            server.destroy(() => {
              log('HTTP server closed');
            })
          });

          if (typeof details === 'string') {
            log(`Accepting connections on ${details}`);
          } else if (typeof details === 'object') {
            log(`Accepting connections on ${details.address}:${details.port}`);
          } else {
            log('Accepting connections');
          }
          resolve();
        });
      });
    },

    close(): Promise<void> {
      return new Promise(resolve => {
        server.close(resolve);
      });
    },
  };
}

/**
 * Decorate HTTP server with a destroy/0 function
 * 
 * @param server NodeJS builtin HTTP server
 */
function enableDestroy(server: Server): (Server & { destroy: (cb: () => void) => void }) {
  const connections: { [key: string]: Socket } = {};

  server.on('connection', (conn) => {
    const key = `${conn.remoteAddress}:${conn.remotePort}`;
    connections[key] = conn;
    conn.once('close', () => delete connections[key]);
  });

  (server as Server & { destroy: (cb: () => void) => void }).destroy = function (cb) {
    // Stop accepting new connections
    server.close(cb);

    // Kill remaining ones
    let i = 0;
    for (const key in connections) {
      connections[key].destroy();
      i++;
    }
    log(`Closed ${i} connections`);
  };

  return server as Server & { destroy: (cb: Function) => void };
}
