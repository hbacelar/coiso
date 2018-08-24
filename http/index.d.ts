/// <reference types="node" />
import { IncomingMessage, ServerResponse, Server } from 'http';
export interface APIServer {
    server: Server;
    get: ServerRouteFn;
    head: ServerRouteFn;
    post: ServerRouteFn;
    put: ServerRouteFn;
    delete: ServerRouteFn;
    any: ServerRouteFn;
    addRoute(method: string, route: string, handler: RouteHandler): APIServer;
    listen(ifc_path: string, port?: number): Promise<void>;
    close(): Promise<void>;
}
declare type RequestParams<T> = {
    [p: string]: T;
} | {};
declare type RouteHandler = (req: IncomingMessage, res: ServerResponse, params: RequestParams<string>) => void;
declare type ServerRouteFn = (route: string, handler: RouteHandler) => APIServer;
export declare function createServer(): APIServer;
export {};
