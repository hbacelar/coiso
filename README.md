# coiso

Opinionated HTTP API template


TODO: document fabric.toml

## API

Expressive HTTP method binding

    .get
    .post
    .any
    (...)

## Features
- Limits
  - event loop delay
  - request size
  - response size
- Body parsing
    For parsing the incoming request body async ready builtins for buffer, text, json and form encoded bodies.
- Query parsing
- Routing
- CORS

## Next Features
- cors support
- circuit breaker
- ~~cluster support~~ (outside intended scope)
- ~~websocket support?~~ (outside intended scope)