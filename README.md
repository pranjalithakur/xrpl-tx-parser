# xrpl-tx-parser

Subscribe to an XRPL client and receive parsed transaction objects

### Getting Started

To get started using this project, install the node package into your project

```node
npm install @thebettermint/xrpl-tx-parser
```

```yarn
yarn add @thebettermint/xrpl-tx-parser
```

```ts
import Client, { constants } from '@thebettermint/xrpl-tx-parser';

let api = new Client(params);

// Add event listeners...
```

#### Client Options

Currently, the only transactions support by the client are payment transaction object. I plan to expand this the other transaction objects. See [wip folder](https://github.com/thebettermint/xrpl-tx-parser/blob/main/wip)

```ts
params = {
    url?: String[] || String, //Either an array of valid wss servers or just a single wss server. If Array is defined, the selected servers will rotate on every reconnect attempt. If undefined, the default wss will be used - 'wss://xrplcluster.com'
    registry?: String[] //Array of address to listen to, if undefined, all transaction objects will be returned
    timeout?: Number, //Time in ms for class timeout. If undefined, no timeout will be set
    reconnect?: Number, //Number of times the client will attempt to reconnect if inadvertantly disconnect. If undefind, the client will not attempt to reconnect
}
```

#### Examples

```ts
import Client, { constants } from '@thebettermint/xrpl-tx-parser';

const main = async () => {
  let api = new Client({
    url: [
      'wss://xls20-sandbox.rippletest.net:51233',
      constants.serverURL,
      constants.mainServerURL,
    ],
    registry: ['rMfCZhBfR4tRunHaE9jrtdsjF5stuuQ9JB'],
    timeout: 3000,
    reconnect: 10,
  });

  // Define possible emitted events using the package constants
  let events = constants.wsStatusMessages;

  // Add event listeners to catch parsed transactions

  api.once(events.connected, () => {
    console.log(events.connected);
  });

  api.on(events.tx, (e: any) => {
    console.log(events.tx);
    console.log(e);
  });

  api.on(events.reconnect, (e: any) => {
    console.log(events.reconnect);
    console.log(e); // Next wss server to attempt
  });

  api.on(events.timeout, () => {
    console.log(events.timeout);
  });

  api.once(events.closed, () => {
    console.log(events.closed);
  });
};

main();
```

[See more examples here](https://github.com/thebettermint/xrpl-tx-parser/blob/main/examples)

#### Thanks

A lot of the parsing functionality was ported from a depreciated ripple package... link here
still looking for the link

#### Contributing

Pull requests for new features, bug fixes, and suggestions are welcome! Please
create an issue for discussion before working on a substantial change.
[CONTRIBUTING.md](https://github.com/thebettermint/xrpl-tx-parser/blob/main/CONTRIBUTING.md)

#### License

[GPL-3.0](https://github.com/thebettermint/xrpl-tx-parser/blob/main/LICENSE)

Copyright 2022 thebettermint
The GNU General Public License is a free, copyleft license for
software and other kinds of works.
Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
Everyone is permitted to copy and distribute verbatim copies
of this license document, but changing it is not allowed.
