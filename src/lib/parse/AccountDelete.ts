import { TransactionStream } from 'xrpl';

function AccountDelete(tx: TransactionStream) {
  var deleteObj = {};

  if (tx.engine_result !== 'tesSUCCESS') return undefined;
  if (tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS') return undefined;

  if (['AccountDelete'].indexOf(tx.transaction.TransactionType) === -1)
    return undefined;

  try {
    deleteObj.account = tx.transaction.Account;

    deleteObj.destination = tx.transaction.Destination;
    if (tx.transaction.DestinationTag)
      deleteObj.destinationTag = tx.transaction.DestinationTag;

    deleteObj.ledger_index = tx.ledger_index;
    deleteObj.executed_time = tx.transaction.date;
    deleteObj.tx_hash = tx.transaction.hash;

    deleteObj.transactionType = tx.transaction.TransactionType;
    (deleteObj.tx_index = tx.meta.TransactionIndex),
      (deleteObj.sequence = tx.transaction.Sequence);
    (deleteObj.tx_flag = tx.transaction.Flags),
      (deleteObj.ledger_index = tx.ledger_index),
      (deleteObj.fee = new BigNumber(
        dropsToXrp(tx.transaction.Fee)
      ).toString());

    return deleteObj;
  } catch (error) {
    console.log(error);
    return error;
  }
}

export { AccountDelete };
