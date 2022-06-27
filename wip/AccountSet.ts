import { TransactionStream } from 'xrpl';

function AccountSet(tx: TransactionStream) {
  var set = {};

  if (tx.engine_result !== 'tesSUCCESS') return undefined;
  if (tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS') return undefined;

  if (['AccountSet'].indexOf(tx.transaction.TransactionType) === -1)
    return undefined;

  try {
    set.account = tx.transaction.Account;

    set.clearFlag = tx.transaction.ClearFlags;
    set.domain = tx.transaction.Domain;
    set.emailHash = tx.transaction.EmailHash;
    set.messageKey = tx.transaction.MessageKey;
    set.setFlag = tx.transaction.SetFlag;
    set.transferRate = tx.transaction.TransferRate;
    set.tickSize = tx.transaction.TickSize;
    set.minter = tx.transaction.Miniter;

    set.ledger_index = tx.ledger_index;
    set.executed_time = tx.transaction.date;
    set.tx_hash = tx.transaction.hash;

    set.transactionType = tx.transaction.TransactionType;
    (set.tx_index = tx.meta.TransactionIndex),
      (set.sequence = tx.transaction.Sequence);
    (set.tx_flag = tx.transaction.Flags),
      (set.ledger_index = tx.ledger_index),
      (set.fee = new BigNumber(dropsToXrp(tx.transaction.Fee)).toString());

    return set;
  } catch (error) {
    return error;
  }
}

export { AccountSet };
