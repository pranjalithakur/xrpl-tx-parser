import { Client, LedgerStream, TransactionStream } from 'xrpl';
import { wsStatusMessages, DEFAULT_MAINNET } from './constants';
import parse from '../lib/parse';
import EventEmitter from 'events';

/**
 * xrplSubscriptionToRegistryWS
 * Class for listening to a registry of addresses
 */
class xrplTxParser extends EventEmitter {
  [index: string]: any;
  registry: (string | undefined)[] | undefined;
  url: string | string[];
  urlPosition: number;
  ws: Client | undefined;
  test?: boolean | undefined;
  timeout?: number | undefined;
  timeoutId?: any;
  reconnect?: number | boolean;
  connectionTimeout?: number | undefined;

  /**
   * Open a subsription stream with XRPLjs.
   * @param {string| string[]} url - The url to the server.
   * @param { string[] } registry - The subsription registry: List of XRPL addresses.
   */
  constructor({
    url,
    registry,
    test,
    reconnect,
    timeout,
  }: {
    url?: string | string[] | undefined;
    registry?: (string | undefined)[] | undefined;
    test?: boolean;
    reconnect?: number;
    timeout?: number | undefined;
  }) {
    super();
    this.registry = registry || [];
    this.url = url || DEFAULT_MAINNET;
    this.urlPosition = 0;
    this.test = test || false;
    this.reconnect = reconnect || 0;
    this.timeout = timeout || undefined;
    this.ws = undefined;
    this.timeoutId;
    if (this.url instanceof Array && this.url.length > 0)
      this._connect(this.url[this.urlPosition]);
    if (typeof this.url === 'string') this._connect(this.url);
    if (this.timeout) this._startTimeout();
  }

  /**
   * Start timeout if defined
   */
  private _startTimeout = async (): Promise<any> => {
    this.timeoutId = setTimeout(() => {
      this.emit(wsStatusMessages.timeout);
      this.disconnect();
    }, this.timeout);
  };

  /**
   * Reset timeout on every emitted event
   */
  private _resetTimeout = async (): Promise<any> => {
    clearTimeout(this.timeoutId);
    this._startTimeout();
  };

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

    if (this.reconnect && this.reconnect > 0) {
      if (this.url instanceof Array) {
        this.urlPosition < this.url.length - 1
          ? this.urlPosition++
          : (this.urlPosition = 0);
        this._connect(this.url[this.urlPosition]);
        this.emit(wsStatusMessages.reconnect, this.url[this.urlPosition]);
      }
      if (typeof this.url === 'string') {
        this._connect(this.url);
        this.emit(wsStatusMessages.reconnect, this.url);
      }
      --this.reconnect;
    }
  };

  /**
   * Event indication that the client is open
   *  Proceeds to subscribe to registry
   */
  private _onConnected(): void {
    if (this.timeout) this._resetTimeout();
    this.emit(wsStatusMessages.connected);
    this.ws?.request({
      command: 'subscribe',
      streams: ['transactions', 'ledger'],
    });
  }

  /**
   * Captured emitted event on transaction message
   */
  private _onTx(event: any): any {
    let handled: any = parse.txHandler(event);
    let parsed = parse.allPayments(handled);

    if (this.registry?.length === 0 && parsed) {
      if (this.timeout) this._resetTimeout();
      return this.emit(wsStatusMessages.tx, parsed);
    }

    if (this.registry && parsed?.destination && parsed.source) {
      if (
        this.registry.indexOf(parsed.destination) > -1 ||
        this.registry.indexOf(parsed.source) > -1
      ) {
        if (this.timeout) this._resetTimeout();
        this.emit(wsStatusMessages.tx, parsed);
      }
    }
    return;
  }

  /**
   * Captured emitted event on ledger message
   */
  private _onLgr(event: any): void {
    this.emit(wsStatusMessages.lgr, event);
  }

  /**
   * Captured emitted event on error message
   */
  private _onError(event: any[]): void {
    this.emit(wsStatusMessages.error, event);
    this.disconnect();
  }

  /**
   * Captured emitted event on close message
   */
  private _onClose(event: number): void {
    if (this.reconnect === 0) this.emit(wsStatusMessages.closed, event);
  }
}

export default xrplTxParser;
