import { getAffectedAccounts } from '../helpers';
import { TransactionStream } from 'xrpl';
import { AccountsInterface } from '../../../types/parser/account';

function allAffectedAccounts(tx: TransactionStream) {
  var accounts = new Array();
  var list = new Array();
  var data: AccountsInterface = {};

  if (tx.meta) {
    data.tx_result = tx.meta.TransactionResult;
    data.tx_index = tx.meta.TransactionIndex;

    accounts = getAffectedAccounts(tx.meta);

    accounts.forEach((account) => {
      if (account[0] !== 'r') return;

      data.account = account;
      data.tx_type = tx.transaction.TransactionType;
      data.time = tx.transaction.date;
      data.ledger_index = tx.ledger_index;
      data.tx_hash = tx.transaction.hash;

      list.push(data);
    });
  }

  if (Array.isArray(list) && list.length > 0) return list;
}

export { allAffectedAccounts };
