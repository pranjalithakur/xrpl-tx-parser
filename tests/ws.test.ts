import xrplTxParser from '../src/lib/ws';
import { wsStatusMessages } from '../src/lib/constants';

describe('Registry subscribe websocket', () => {
  test('opening and closing a connection', async () => {
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

  test('listening for ledger closes', async () => {
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

  test('listening for tx', async () => {
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

  test('listening for timeout', async () => {
    let test = new xrplTxParser({ registry: ['abcde'], timeout: 7000 });

    let connected = await new Promise((resolve) => {
      test.once(wsStatusMessages.connected, () => {
        return resolve(wsStatusMessages.connected);
      });
    });

    let timeout = await new Promise((resolve) => {
      test.once('timeout', () => {
        return resolve('timeout');
      });
    });

    let disconnected = await new Promise((resolve) => {
      test.once(wsStatusMessages.closed, () => {
        return resolve(wsStatusMessages.closed);
      });
    });

    expect(connected).toStrictEqual(wsStatusMessages.connected);
    expect(disconnected).toStrictEqual(wsStatusMessages.closed);
    expect(timeout).toStrictEqual('timeout');
  }, 10000);
});
