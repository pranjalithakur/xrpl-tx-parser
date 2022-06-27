import { TxResponse, TransactionStream, TransactionEntryResponse } from 'xrpl';
import { Amount } from 'xrpl/dist/npm/models/common';
import { EscrowCancel, EscrowFinish, EscrowCreate } from 'xrpl';

export type modTxResponse = TxResponse;

export type modTransactionStream = TransactionStream;

export type modTransactionEntryResponse = TransactionEntryResponse;

export type TxParserInterface =
  | modTxResponse
  | modTransactionStream
  | modTransactionEntryResponse;

export interface GeneralNode {
  LedgerEntryType: string;
  LedgerIndex: string;
  NewFields?: NewFields;
  FinalFields?: FinalFields;
  PreviousFields?: PreviousFields;
  PreviousTxnID?: string;
  PreviouTxnLgrSeq?: number;
  NodeIndex?: number;
  BookDirectory?: string;
  nodeIndex?: number;
  Expiration?: number;
}

export interface FinalFields {
  //[field: string]: unknown,
  TakerPays: Amount;
  TakerGets: Amount;
  Account: string;
  Sequence?: string;
  Amount?: string;
  Balance?: Amount;
  //-----
  BookDirectory?: string;
  Expiration?: number;
  ExchangeRate?: string;
  RootIndex?: string;
  TakerPaysCurrency?: string;
  TakerPaysIssuer?: string;
  Destination?: string;
  DestinationTag?: string;
  SourceTag?: string;
  HighLimit?: { issuer: string };
  LowLimit?: { issuer: string };
  PreviousTxnID?: string;
  quality?: string;
}

export interface PreviousFields {
  [field: string]: unknown;
  TakerPays: Amount;
  TakerGets: Amount;
  //--
  Amount?: string;
  Balance?: Amount;
  Destination?: string;
  DestinationTag?: string;
  SourceTag?: string;
  BookDirectory?: string;
}

export interface NewFields {
  //[field: string]: unknown
  Account: string;
  BookDirectory: string;
  Expiration: number;
  Sequence: number;
  TakerGets: Amount;
  TakerPays: Amount;
  ExchangeRate: string;
  RootIndex: string;
  TakerPaysCurrency: string;
  TakerPaysIssuer: string;
  HighLimit?: { issuer: string };
  LowLimit?: { issuer: string };
  //--
  Amount?: string;
  Balance?: Amount;
  Destination?: string;
  DestinationTag?: string;
  SourceTag?: string;
}

export type GeneralEscrow = EscrowCancel | EscrowFinish | EscrowCreate;
