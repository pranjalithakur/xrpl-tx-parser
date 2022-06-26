import xrplSubscriptionToRegistryWS from '../src/lib/ws';
import * as constants from './constants';
import { wsStatusMessages } from '../src/lib/constants';

describe('Registry subscribe websocket', () => {
  test('opening and closing a connection', async () => {
    let test = new xrplSubscriptionToRegistryWS({
      url: constants.testServerURL,
      registry: constants.registryAddresses,
      test: true,
    });

    let connected = await new Promise((resolve) => {
      test.ws?.once(wsStatusMessages.connected, () => {
        return resolve(wsStatusMessages.connected);
      });
    });

    test.disconnect();

    let disconnected = await new Promise((resolve) => {
      test.ws?.once(wsStatusMessages.closed, () => {
        return resolve(wsStatusMessages.closed);
      });
    });

    expect(connected).toStrictEqual(wsStatusMessages.connected);
    expect(disconnected).toStrictEqual(wsStatusMessages.closed);
  });

  test('listening for ledger closes', async () => {
    let test = new xrplSubscriptionToRegistryWS({
      url: constants.testServerURL,
      registry: constants.registryAddresses,
      test: true,
    });

    let connected = await new Promise((resolve) => {
      test.ws?.once(wsStatusMessages.connected, () => {
        return resolve(wsStatusMessages.connected);
      });
    });

    let ledgers = await new Promise((resolve) => {
      let count = 0;
      test.ws?.addListener(wsStatusMessages.lgr, () => {
        count++;
        if (count === 3) return resolve(count);
      });
    });

    test.disconnect();

    let disconnected = await new Promise((resolve) => {
      test.ws?.once(wsStatusMessages.closed, () => {
        return resolve(wsStatusMessages.closed);
      });
    });

    expect(connected).toStrictEqual(wsStatusMessages.connected);
    expect(disconnected).toStrictEqual(wsStatusMessages.closed);
    expect(ledgers).toBe(3);
  }, 30000);

  test('listening for tx', async () => {
    let test = new xrplSubscriptionToRegistryWS({
      url: constants.testServerURL,
      registry: constants.registryAddresses,
      test: true,
    });

    let connected = await new Promise((resolve) => {
      test.ws?.once(wsStatusMessages.connected, () => {
        return resolve(wsStatusMessages.connected);
      });
    });

    let transactions = await new Promise((resolve) => {
      let count = 0;
      test.ws?.addListener(wsStatusMessages.tx, () => {
        count++;
        if (count === 10) return resolve(count);
      });
    });

    test.disconnect();

    let disconnected = await new Promise((resolve) => {
      test.ws?.once(wsStatusMessages.closed, () => {
        return resolve(wsStatusMessages.closed);
      });
    });

    expect(connected).toStrictEqual(wsStatusMessages.connected);
    expect(disconnected).toStrictEqual(wsStatusMessages.closed);
    expect(transactions).toBe(10);
  }, 10000);
});
