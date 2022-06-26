import { Client, LedgerStream, TransactionStream } from 'xrpl';
import { wsStatusMessages } from './constants';
import parse from '../lib/parse';
/**
 * xrplSubscriptionToRegistryWS
 * Class for listening to a registry of addresses
 */
class xrplSubscriptionToRegistryWS {
  [index: string]: any;
  registry: (string | undefined)[] | undefined;
  registryAccounts: string[] | undefined;
  url: string | any;
  ws: Client | undefined;
  test?: boolean | undefined;

  /**
   * Open a subsription stream with XRPLjs.
   * @param {string} url - The url to the server.
   * @param {string[]} registry - The subsription registry: List of XRPL addresses.
   */
  constructor({
    url,
    registry,
    test,
  }: {
    url: string;
    registry: (string | undefined)[] | undefined;
    test?: boolean;
  }) {
    this.registry = registry;
    this.url = url;
    this.test = test || undefined;
    this.ws = undefined;
    this.registryAccounts = undefined;
    this._connect(url);
  }

  /**
   * Connect to client and initalize listeners
   * @param {string} url - The url to the server.
   */
  private _connect = async (url: string): Promise<any> => {
    this.ws = new Client(url);
    this.ws.connect();
    this.ws.once('connected', () => this._onConnected());
    this.ws.on('transaction', (evt: TransactionStream) => this._onTx(evt));
    this.ws.on('ledgerClosed', (evt: LedgerStream) => this._onLgr(evt));
    this.ws.once('disconnected', (evt: number) => this._onClose(evt));
    this.ws.on('error', (evt: any[]) => this._onError(evt));
  };

  /**
   * Forceful disconnect from client
   */
  public disconnect = (): void => {
    this.ws?.disconnect();
  };

  /**
   * Event indication that the client is open
   *  Proceeds to subscribe to registry
   */
  private _onConnected(): void {
    if (this.test) this.ws?.emit(wsStatusMessages.connected);
    console.log(this.registry);
    this.ws?.request({
      command: 'subscribe',
      streams: ['transactions', 'ledger'],
    });
  }

  /**
   * Captured emitted event on transaction message
   */
  private _onTx(event: any): void {
    if (this.test) {
      let handled: any = parse.txHandler(event);
      let parsed = parse.allPayments(handled);
      this.ws?.emit(wsStatusMessages.tx, event);
    }
  }

  /**
   * Captured emitted event on ledger message
   */
  private _onLgr(event: any): void {
    if (this.test) this.ws?.emit(wsStatusMessages.lgr, event);
  }

  /**
   * Captured emitted event on error message
   */
  private _onError(event: any[]): void {
    if (this.test) this.ws?.emit(wsStatusMessages.error, event);
    console.log(event);
    this.ws?.disconnect();
  }

  /**
   * Captured emitted event on close message
   */
  private _onClose(event: number): void {
    if (this.test) this.ws?.emit(wsStatusMessages.closed, event);
  }
}

export default xrplSubscriptionToRegistryWS;
