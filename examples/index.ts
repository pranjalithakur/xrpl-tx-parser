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
