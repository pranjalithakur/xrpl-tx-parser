import { dropsToXrp } from 'xrpl';
import { TransactionStream } from 'xrpl';
import { BigNumber } from 'bignumber.js';
import { PayChanInterface, NodeInterface } from '../../../types/parser/paychan';

function getPaychannelNode(tx: TransactionStream) {
  var node: any;
  var affNode: any;

  if (tx.meta) {
    let parsedNodes = tx.meta.AffectedNodes.map((n, i) => {
      affNode = n;
      if (affNode.ModifiedNode) return affNode.ModifiedNode;
      if (affNode.DeletedNode) return affNode.DeletedNode;
    }).filter((node) => node.LedgerEntryType == 'PayChannel');

    if (Array.isArray(parsedNodes) && parsedNodes.length > 0) {
      node = parsedNodes[0];
      node.fields = node.NewFields || node.FinalFields;
      return node;
    }
  }

  return {
    fields: {},
  };
}

function allPaymentChannels(tx: TransactionStream) {
  var paychan: PayChanInterface = {};
  var node: NodeInterface;

  if (tx.engine_result !== 'tesSUCCESS') return undefined;
  if (tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS') return undefined;

  if (
    [
      'PaymentChannelCreate',
      'PaymentChannelFund',
      'PaymentChannelClaim',
    ].indexOf(tx.transaction.TransactionType) === -1
  ) {
    return undefined;
  } else {
    node = getPaychannelNode(tx);
    paychan.flags = tx.transaction.Flags;
    paychan.ledger_index = tx.ledger_index;
    paychan.time = tx.transaction.date;
    paychan.tx_hash = tx.transaction.hash;
    paychan.tx_type = tx.transaction.TransactionType;
    paychan.account = tx.transaction.Account;
    paychan.source = node.fields.Account;

    if (tx.transaction.Fee)
      paychan.fee = new BigNumber(dropsToXrp(tx.transaction.Fee)).toString();

    paychan.destination = node.fields.Destination;
    paychan.destination_tag = node.fields.DestinationTag;
    paychan.source_tag = node.fields.SourceTag;

    if (tx.transaction.TransactionType == 'PaymentChannelFund') {
      paychan.channel = tx.transaction.Channel;
    }

    if (tx.transaction.TransactionType == 'PaymentChannelClaim') {
      paychan.signature = tx.transaction.Signature;
      paychan.pubkey = tx.transaction.PublicKey;
    }

    if (tx.transaction.TransactionType == 'PaymentChannelCreate') {
      paychan.pubkey = tx.transaction.PublicKey;
      paychan.settle = tx.transaction.SettleDelay;
    }

    paychan.amount = node.fields.Amount
      ? dropsToXrp(new BigNumber(node.fields.Amount)).toString()
      : undefined;

    if (typeof node.fields.Balance == 'string') {
      paychan.balance = node.fields.Balance
        ? dropsToXrp(new BigNumber(node.fields.Balance)).toString()
        : undefined;
    }

    /*
  if (tx.transaction.CancelAfter) {
    paychan.cancel_after = tx.transaction.CancelAfter + EPOCH_OFFSET
    paychan.cancel_after = paychan.cancel_after
  }

  if (tx.transaction.Expiration) {
    paychan.expiration = tx.transaction.Expiration + EPOCH_OFFSET
    paychan.expiration = paychan.expiration
  }
  */
  }

  return paychan;
}

export { allPaymentChannels };
