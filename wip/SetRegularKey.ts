import { TransactionStream } from 'xrpl';

const lsfDisableMaster = 0x00100000;

function SetRegularKey(tx: TransactionStream) {
  var keyObj = {};

  if (tx.engine_result !== 'tesSUCCESS') return undefined;
  if (tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS') return undefined;

  if (['SetRegularKey'].indexOf(tx.transaction.TransactionType) === -1)
    return undefined;

  try {
    keyObj.account = tx.transaction.Account;

    keyObj.type = tx.transaction.RegularKey ? 'add' : 'remove';

    if (tx.transaction.SigningPubKey)
      keyObj.master = tx.transaction.SigningPubKey;
    if (tx.transaction.RegularKey) keyObj.signer = tx.transaction.RegularKey;

    keyObj.ledger_index = tx.ledger_index;
    keyObj.executed_time = tx.transaction.date;
    keyObj.tx_hash = tx.transaction.hash;

    keyObj.transactionType = tx.transaction.TransactionType;
    (keyObj.tx_index = tx.meta.TransactionIndex),
      (keyObj.sequence = tx.transaction.Sequence);
    (keyObj.tx_flag = tx.transaction.Flags),
      (keyObj.ledger_index = tx.ledger_index),
      (keyObj.fee = new BigNumber(dropsToXrp(tx.transaction.Fee)).toString());

    keyObj.master_disabled =
      (lsfDisableMaster & keyObj.tx_flag) === lsfDisableMaster ? true : false;

    return keyObj;
  } catch (error) {
    return error;
  }
}

export { SetRegularKey };
