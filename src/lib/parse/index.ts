import { TxParserInterface } from '../../../types/parser';
import { allPayments } from './allPayments';
import { Payment } from './Payment';

const txHandler = (tx: TxParserInterface) => {
  if (tx.type == 'response') return tx.result;
  if (tx.type == 'transaction') return tx;
  if (tx.type == 'TransactionEntryResponse') return tx.result;
  return Error('This is not in an eligible tranaction format');
};

export default {
  txHandler,
  allPayments,
  Payment,
};
