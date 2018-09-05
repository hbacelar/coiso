# coiso
Opinionated HTTP API template.

## Features
 - Easy: Designed for usage with async/await
 - Fast: Ultra-high performance
 - Complete: Supports routing, API initialization lifecycle, HTTP and Websockets
 - Agile: Built for easy deployment and containerization
 - Simple: Small and explicit API surface
 - Standard: Just HTTP
 - Explicit: No middleware - modules declare all dependencies


## Installation
    npm i --save coiso

## Usage
Create a `resources` folder in your project's root and enter it:

    $ mkdir resources && cd resources

Then, create an `index.js` file and export a function that accepts the standard 
NodeJS HTTP handler signature `(req: http.IncomingMessage, res: http.ServerResponse)`:
```javascript
module.exports = async (req, res) => {
    res.end('Hello World!');
}
```

Next, create an `index.ws.js` file and export a function that accepts the standard 
Websocket handler signature `(ws: WebSocket, res: http.IncomingMessage)`:
```javascript
module.exports = async (ws, req) => {
    // Echo back the received messages
    ws.on('message', ws.send);
    
    // On connect
    ws.send('Hello websocket');
};
```

Finally, add a start script in your `package.json` file:

    {
        "scripts": {
            "start": "coiso"
        }
    }

Once all of that is done, the server can be started like this:

    $ npm start

You can now consume
 - http://localhost:8080
 - ws://localhost:8080

From this moment on, you can create as many routes as you want, both 
Request/Response or WebSocket style.

## Command Line (CLI)
Run the help command to get to know what the CLI offers:

    $ npx coiso --help

## Routing

### With the CLI tool
Routing is inferred from the folder structure within the `resources` folder.
Multi-parametric routing is supported.

The rules are:
- Only `.js` files become serveable resources (folders are used only for organization)
- HTTP Request/Response handlers are setup from filenames following the pattern `<resource_name>.js`
- WebSocket handlers are setup from filenames following the pattern `<resource_name>.ws.js`
- Parameterized route parts are defined using square bracket notation.
Example:
 1. For the URL '/:resource' (where resource is variable) one would create the file `[resource].js`
 2. For the URL '/:var1/:resource' (where var1 and resource are variables) one would create a folder named `[var1]` and the file `[resource].js`
- Variables are readable from the `params` attribute in the `Context object` (3rd parameter in handler functions) 

### With the API
TODO

## Context object
The context object is an additional parameter passed to [handler functions](https://github.com/jorgemsrs/coiso/blob/master/http/index.ts#L22-L24). 
It is a `coiso` idiom which can be safely ignored. You can check it's [schema in 
the sourcecode](https://github.com/jorgemsrs/coiso/blob/master/http/index.ts#L17).


## TODO
- Codebase cleanup
- Add log support (pino)
- Unit tests
- Integration tests
- Improve documentation
- Server metrics (performance hooks)
- ~~cors support~~ (can be done as middleware)
- ~~circuit breaker~~ (can be done as middleware)
- ~~cluster support~~ (outside intended scope)
- ~~websocket support?~~ (done)

## Inspiration
- [micro](https://github.com/zeit/micro)
- [sapper](https://github.com/sveltejs/sapper)

## License
[MIT](https://github.com/jorgemsrs/coiso/blob/master/LICENSE)