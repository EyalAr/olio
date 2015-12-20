# olio

Synchronized collaborative state editing.
Use as a client or as a server which syncs with multiple clients.

Based on [Differential Synchronization by Neil Fraser](https://neil.fraser.name/writing/sync/eng047-fraser.pdf).

## API

### State

`import State from 'olio';`
`var State = require('olio').State;`
`require(['olio/state'], function(State){ /* ... */ });`

`State` is a constructor which receives an optional JSON object of the initial state.

`var s = new State()`
`var s = new State(init)`

#### Modifying state

`s.set( keypath, value )`

0. `keypath {String/Array}`
0. `value {*}`
