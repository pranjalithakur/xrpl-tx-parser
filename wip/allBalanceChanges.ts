import { dropsToXrp } from 'xrpl';
import { TransactionStream } from 'xrpl';
import BigNumber from 'bignumber.js';
import { GeneralNode } from '../../../types/common';

function allBalanceChanges(tx: TransactionStream) {
  var list = new Array();
  var escrows = {};
  var paychan = {};

  /**
   * findType
   * determine what type of balnace
   * change this is, if possible
   */

  function findType(data) {
    // exchange issuer/intermediary
    if (
      tx.transaction.TransactionType === 'OfferCreate' &&
      Number(data.final_balance) < 0
    ) {
      return 'intermediary';

      // offer creates are all exchanges
    } else if (tx.transaction.TransactionType === 'OfferCreate') {
      return 'exchange';
    } else if (tx.transaction.TransactionType === 'Payment') {
      // not a real payment issuer on exchange
      if (
        tx.transaction.Account === tx.transaction.Destination &&
        Number(data.final_balance) < 0
      ) {
        return 'intermediary';

        // not a real payment just an exchange
      } else if (tx.transaction.Account === tx.transaction.Destination) {
        return 'exchange';

        // payment currency and destination account
      } else if (
        data.account === tx.transaction.Destination &&
        typeof tx.transaction.Amount == 'object' &&
        tx.transaction.Amount.currency === data.currency
      ) {
        return 'payment_destination';

        // payment currency = XRP and destination account
      } else if (
        data.account === tx.transaction.Destination &&
        typeof tx.transaction.Amount == 'string' &&
        data.currency === 'XRP'
      ) {
        return 'payment_destination';

        // source currency and source account
      } else if (
        data.account === tx.transaction.Account &&
        typeof tx.transaction.SendMax == 'object' &&
        tx.transaction.SendMax.currency &&
        tx.transaction.SendMax.currency === data.currency
      ) {
        return 'payment_source';

        // source currency = XRP and source account
      } else if (
        data.account === tx.transaction.Account &&
        tx.transaction.SendMax &&
        data.currency === 'XRP'
      ) {
        return 'payment_source';

        // source account and destination currency
      } else if (
        data.account === tx.transaction.Account &&
        typeof tx.transaction.Amount == 'object' &&
        tx.transaction.Amount.currency === data.currency
      ) {
        return 'payment_source';

        // source account and destination currency
      } else if (
        data.account === tx.transaction.Account &&
        typeof tx.transaction.Amount == 'string' &&
        data.currency === 'XRP'
      ) {
        return 'payment_source';

        // issuer
      } else if (Number(data.final_balance) < 0) {
        return 'intermediary';

        // not sender, receiver, or different currency
      } else {
        return 'exchange';
      }
    }

    return null;
  }

  /**
   * parseAccountRoot
   * parse balance changes
   * from an account root node
   */

  function parseAccountRoot(node: GeneralNode) {
    var account;
    var balance;
    var previous;
    var change;
    var amount;
    var data;
    var fee;

    if (
      node.FinalFields &&
      node.PreviousFields &&
      node.FinalFields.Balance &&
      node.PreviousFields.Balance
    ) {
      balance = node.FinalFields.Balance;
      previous = node.PreviousFields.Balance;
      account = node.FinalFields.Account;
    } else if (node.NewFields) {
      balance = node.NewFields.Balance;
      previous = new BigNumber(0);
      account = node.NewFields.Account;
    } else {
      return;
    }

    change = balance.minus(previous);

    if (tx.meta && tx.transaction.Account === account) {
      if (tx.transaction.Fee) fee = new BigNumber(tx.transaction.Fee).negated();

      amount = change.minus(fee);

      list.push({
        account: account,
        currency: 'XRP',
        change: dropsToXrp(fee).toString(),
        final_balance: dropsToXrp(balance.minus(amount)).toString(),
        time: tx.transaction.date,
        ledger_index: tx.ledger_index,
        tx_index: tx.meta.TransactionIndex,
        node_index: -1,
        tx_hash: tx.transaction.hash,
        type: 'fee',
      });
    } else {
      amount = change;
    }

    if (tx.meta && !amount.isZero()) {
      data = {
        account: account,
        currency: 'XRP',
        change: dropsToXrp(amount).toString(),
        final_balance: dropsToXrp(balance).toString(),
        time: tx.transaction.date,
        ledger_index: tx.ledger_index,
        tx_index: tx.meta.TransactionIndex,
        node_index: node.nodeIndex,
        tx_hash: tx.transaction.hash,
      };

      data.type = findType(data);
      list.push(data);
    }
  }

  /**
   * parseRippleState
   * parse balances changes
   * from a ripple state node
   */

  function parseRippleState(node: GeneralNode) {
    var balance;
    var previous;
    var change;
    var currency;
    var highParty;
    var lowParty;
    var data;

    // only Payments and OfferCreates
    if (
      tx.transaction.TransactionType !== 'Payment' &&
      tx.transaction.TransactionType !== 'OfferCreate'
    )
      return;

    // simple trust line
    if (
      node.NewFields &&
      typeof node.NewFields.Balance == 'object' &&
      node.NewFields.Balance.value === '0'
    )
      return;

    // trustline created with non-zero balance
    if (node.NewFields) {
      if (typeof node.NewFields.Balance == 'object') {
        currency = node.NewFields.Balance.currency;
        balance = new BigNumber(node.NewFields.Balance.value);
        change = new BigNumber(node.NewFields.Balance.value);
      }

      if (typeof node.NewFields.HighLimit == 'object')
        highParty = node.NewFields.HighLimit.issuer;
      if (typeof node.NewFields.LowLimit == 'object')
        lowParty = node.NewFields.LowLimit.issuer;

      // trustline balance modified
    } else if (node.PreviousFields && node.PreviousFields.Balance) {
      if (typeof node.PreviousFields.Balance == 'object') {
        previous = new BigNumber(node.PreviousFields.Balance.value);
      }

      change = balance.minus(previous);

      // what else?
    } else {
      return;
    }

    if (tx.meta) {
      data = {
        account: lowParty,
        counterparty: highParty,
        currency: currency,
        change: change.toString(),
        final_balance: balance.toString(),
        time: tx.transaction.date,
        ledger_index: tx.ledger_index,
        tx_index: tx.meta.TransactionIndex,
        node_index: node.nodeIndex,
        tx_hash: tx.transaction.hash,
      };

      data.type = findType(data);
      list.push(data);

      data = {
        account: highParty,
        counterparty: lowParty,
        currency: currency,
        change: change.negated().toString(),
        final_balance: balance.negated().toString(),
        time: tx.transaction.date,
        ledger_index: tx.ledger_index,
        tx_index: tx.meta.TransactionIndex,
        node_index: node.nodeIndex,
        tx_hash: tx.transaction.hash,
      };

      data.type = findType(data);
      list.push(data);
    }
  }

  if (tx.meta) {
    if (
      tx.meta.TransactionResult.indexOf('tec') !== 0 &&
      tx.meta.TransactionResult !== 'tesSUCCESS'
    )
      return list;

    tx.meta.AffectedNodes.forEach(function (affNode: any, i) {
      var node =
        affNode.ModifiedNode || affNode.CreatedNode || affNode.DeletedNode;
      var fields;

      if (!node) return;

      node.nodeIndex = i;

      if (node.LedgerEntryType === 'AccountRoot') {
        parseAccountRoot(node);
      } else if (node.LedgerEntryType === 'RippleState') {
        parseRippleState(node);
      }

      if (node.LedgerEntryType === 'Escrow') {
        fields = node.NewFields || node.FinalFields;
        escrows[fields.Account] = fields;
        escrows[fields.Destination] = fields;
      }

      if (node.LedgerEntryType === 'PayChannel') {
        fields = node.NewFields || node.FinalFields;
        paychan[fields.Account] = fields;
        paychan[fields.Destination] = fields;
      }
    });
  }

  list.forEach(function (d) {
    var amount;
    var e;

    if (escrows[d.account] && d.type === null) {
      e = escrows[d.account];
      amount = dropsToXrp(new BigNumber(e.Amount));
      d.escrow_counterparty = e.Destination;

      if (tx.transaction.TransactionType === 'EscrowCreate') {
        d.type = 'escrow_create';
        d.escrow_balance_change = amount.toString();
      } else if (tx.transaction.TransactionType === 'EscrowCancel') {
        d.type = 'escrow_cancel';
        d.escrow_balance_change = new BigNumber(0).minus(amount).toString();
      } else if (tx.transaction.TransactionType === 'EscrowFinish') {
        d.type = 'escrow_finish';
        d.escrow_balance_change = new BigNumber(0).minus(amount).toString();
      }
    }

    if (paychan[d.account] && d.type === null) {
      e = paychan[d.account];

      if (d.account === e.Account) {
        d.type = 'paychannel_fund';
        d.paychannel_counterparty = e.Destination;
        d.paychannel_fund_change = new BigNumber(0).minus(d.change).toString();
        d.paychannel_fund_final_balance = dropsToXrp(
          new BigNumber(e.Amount || 0)
        ).toString();
        d.paychannel_final_balance = dropsToXrp(
          new BigNumber(e.Balance || 0)
        ).toString();
      } else {
        d.type = 'paychannel_payout';
        d.paychannel_counterparty = e.Account;
        d.paychannel_balance_change = new BigNumber(0)
          .minus(d.change)
          .toString();
        d.paychannel_fund_final_balance = dropsToXrp(
          new BigNumber(e.Amount || 0)
        ).toString();
        d.paychannel_final_balance = dropsToXrp(
          new BigNumber(e.Balance || 0)
        ).toString();
      }
    }
  });

  return list;
}

export { allBalanceChanges };
