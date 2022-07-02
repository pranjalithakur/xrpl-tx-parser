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
    connectionTimeout,
  }: {
    url?: string | string[] | undefined;
    registry?: (string | undefined)[] | undefined;
    test?: boolean;
    reconnect?: number | boolean;
    timeout?: number | undefined;
    connectionTimeout?: number | undefined;
  }) {
    super();
    this.registry = registry || [];
    this.url = url || DEFAULT_MAINNET;
    this.urlPosition = 0;
    this.test = test || false;
    this.reconnect = reconnect || undefined;
    this.timeout = timeout || undefined;
    this.connectionTimeout = connectionTimeout || undefined;
    this.ws = undefined;
    this.timeoutId;
    if (this.url instanceof Array && this.url.length > 0)
      this._connect(this.url[this.urlPosition]);
    if (typeof this.url === 'string') this._connect(this.url);
    if (this.timeout) this._startTimeout();
    this._ping();
    this.addListener('pong', () => {
      if (this.test) console.log('pong');
      if (this.timeout) this._resetTimeout;
    });
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
    if (this.test) console.log('resetting timeout');
    clearTimeout(this.timeoutId);
    this._startTimeout();
  };

  private _ping = async (): Promise<any> => {
    setTimeout(() => {
      this.emit('ping');
      this._ping();
    }, this.timeout || 5000);
  };

  /**
   * Connect to client and initalize listeners
   * @param {string} url - The url to the server.
   */
  private _connect = async (url: string): Promise<any> => {
    this.ws = new Client(url, {
      timeout: this.timeout || 60000,
      connectionTimeout: this.connectionTimeout || 10000,
    });
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
    if (this.test) console.log('forceful disconnect');
    this.ws?.disconnect();
  };

  /**
   * Event indication that the client is open
   *  Proceeds to subscribe to registry
   */
  private _onConnected(): void {
    if (this.timeout) this._resetTimeout();
    this.emit(wsStatusMessages.connected);
    if (this.test) console.log('sending request to client');
    this.ws?.request({
      command: 'subscribe',
      streams: ['transactions', 'ledger'],
    });
  }

  /**
   * Captured emitted event on transaction message
   */
  private _onTx(event: any): any {
    if (this.test) console.log('received tx', event);

    let handled: any = parse.txHandler(event);
    let parsed = parse.allPayments(handled);
    if (this.test) console.log('parsed tx', parsed);

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
