import xrplTxParser from '../src/lib/ws';
import {
  wsStatusMessages,
  mainServerURL,
  serverURL,
} from '../src/lib/constants';

describe('parse-client', () => {
  test('opening-closing', async () => {
    let test = new xrplTxParser({});

    let connected = await new Promise((resolve) => {
      test.once(wsStatusMessages.connected, () => {
        return resolve(wsStatusMessages.connected);
      });
    });

    test.disconnect();

    let disconnected = await new Promise((resolve) => {
      test.once(wsStatusMessages.closed, () => {
        return resolve(wsStatusMessages.closed);
      });
    });

    expect(connected).toStrictEqual(wsStatusMessages.connected);
    expect(disconnected).toStrictEqual(wsStatusMessages.closed);
  });

  test('ledger-closes', async () => {
    let test = new xrplTxParser({});

    let connected = await new Promise((resolve) => {
      test.once(wsStatusMessages.connected, () => {
        return resolve(wsStatusMessages.connected);
      });
    });

    let ledgers = await new Promise((resolve) => {
      let count = 0;
      test.addListener(wsStatusMessages.lgr, () => {
        count++;
        if (count === 3) return resolve(count);
      });
    });

    test.disconnect();

    let disconnected = await new Promise((resolve) => {
      test.once(wsStatusMessages.closed, () => {
        return resolve(wsStatusMessages.closed);
      });
    });

    expect(connected).toStrictEqual(wsStatusMessages.connected);
    expect(disconnected).toStrictEqual(wsStatusMessages.closed);
    expect(ledgers).toBe(3);
  }, 30000);

  test('tx', async () => {
    let test = new xrplTxParser({});

    let connected = await new Promise((resolve) => {
      test.once(wsStatusMessages.connected, () => {
        return resolve(wsStatusMessages.connected);
      });
    });

    let transactions = await new Promise((resolve) => {
      let count = 0;
      test.addListener(wsStatusMessages.tx, () => {
        count++;
        if (count === 10) return resolve(count);
      });
    });

    test.disconnect();

    let disconnected = await new Promise((resolve) => {
      test.once(wsStatusMessages.closed, () => {
        return resolve(wsStatusMessages.closed);
      });
    });

    expect(connected).toStrictEqual(wsStatusMessages.connected);
    expect(disconnected).toStrictEqual(wsStatusMessages.closed);
    expect(transactions).toBe(10);
  }, 10000);

  test('timeout', async () => {
    let test = new xrplTxParser({ registry: ['abcde'], timeout: 3000 });

    let connected = await new Promise((resolve) => {
      test.once(wsStatusMessages.connected, () => {
        return resolve(wsStatusMessages.connected);
      });
    });

    let timeout = await new Promise((resolve) => {
      test.once(wsStatusMessages.timeout, () => {
        return resolve(wsStatusMessages.timeout);
      });
    });

    let disconnected = await new Promise((resolve) => {
      test.once(wsStatusMessages.closed, () => {
        return resolve(wsStatusMessages.closed);
      });
    });

    expect(connected).toStrictEqual(wsStatusMessages.connected);
    expect(disconnected).toStrictEqual(wsStatusMessages.closed);
    expect(timeout).toStrictEqual(wsStatusMessages.timeout);
  });

  test('reconnect', async () => {
    let test = new xrplTxParser({
      url: [
        'wss://xls20-sandbox.rippletest.net:51233',
        serverURL,
        mainServerURL,
      ],
      registry: ['rMfCZhBfR4tRunHaE9jrtdsjF5stuuQ9JB'],
      timeout: 300,
      reconnect: 10,
    });

    let connected = await new Promise((resolve) => {
      test.once(wsStatusMessages.connected, () => {
        return resolve(wsStatusMessages.connected);
      });
    });

    let reconnect = await new Promise((resolve) => {
      let count = 0;
      test.addListener(wsStatusMessages.reconnect, () => {
        count++;
        if (count === 10) return resolve(count);
      });
    });

    let disconnected = await new Promise((resolve) => {
      test.once(wsStatusMessages.closed, () => {
        return resolve(wsStatusMessages.closed);
      });
    });

    expect(connected).toStrictEqual(wsStatusMessages.connected);
    expect(disconnected).toStrictEqual(wsStatusMessages.closed);
    expect(reconnect).toStrictEqual(10);
  }, 10000);

  test('url-array', async () => {
    let reconnectCount = 10;
    let serverArray = [
      'wss://xls20-sandbox.rippletest.net:51233',
      serverURL,
      mainServerURL,
    ];

    let internalCount: number = 0,
      resultArray: string[] = [];
    for (let i = 0; i < reconnectCount; i++) {
      ++internalCount;
      if (internalCount === serverArray.length) internalCount = 0;
      resultArray.push(serverArray[internalCount]);
    }

    let test = new xrplTxParser({
      url: serverArray,
      registry: ['rMfCZhBfR4tRunHaE9jrtdsjF5stuuQ9JB'],
      timeout: 300,
      reconnect: reconnectCount,
    });

    let connected = await new Promise((resolve) => {
      test.once(wsStatusMessages.connected, () => {
        return resolve(wsStatusMessages.connected);
      });
    });

    let array: any;
    let reconnect = await new Promise((resolve) => {
      let count = 0;
      let urlArray: string[] = [];
      test.addListener(wsStatusMessages.reconnect, (e) => {
        count++;
        urlArray.push(e);
        if (count === 10) {
          array = urlArray;
          return resolve(count);
        }
      });
    });

    let disconnected = await new Promise((resolve) => {
      test.once(wsStatusMessages.closed, () => {
        return resolve(wsStatusMessages.closed);
      });
    });

    expect(connected).toStrictEqual(wsStatusMessages.connected);
    expect(disconnected).toStrictEqual(wsStatusMessages.closed);
    expect(reconnect).toStrictEqual(10);
    expect(array).toStrictEqual(resultArray);
  }, 10000);
});
