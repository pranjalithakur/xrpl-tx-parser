import { TransactionStream } from 'xrpl';

function DepositPreauth(tx: TransactionStream) {
  var authorization = {};

  if (tx.engine_result !== 'tesSUCCESS') return undefined;
  if (tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS') return undefined;

  if (['DepositPreauth'].indexOf(tx.transaction.TransactionType) === -1)
    return undefined;

  try {
    authorization.account = tx.transaction.Account;

    authorization.account = tx.transaction.Account;
    authorization.type = tx.transaction.Authorize
      ? 'grant access'
      : 'remove access';
    if (tx.transaction.Authorize)
      authorization.authorized = tx.transaction.Authorize;
    if (tx.transaction.Unauthorize)
      authorization.unauthorized = tx.transaction.Unauthorize;

    authorization.ledger_index = tx.ledger_index;
    authorization.executed_time = tx.transaction.date;
    authorization.tx_hash = tx.transaction.hash;

    authorization.transactionType = tx.transaction.TransactionType;
    (authorization.tx_index = tx.meta.TransactionIndex),
      (authorization.sequence = tx.transaction.Sequence);
    (authorization.tx_flag = tx.transaction.Flags),
      (authorization.ledger_index = tx.ledger_index),
      (authorization.fee = new BigNumber(
        dropsToXrp(tx.transaction.Fee)
      ).toString());

    return authorization;
  } catch (error) {
    return error;
  }
}

export { DepositPreauth };
