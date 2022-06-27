import { allEscrows } from './allEscrows';
import { TransactionStream } from 'xrpl';

const EscrowCancel = (tx: TransactionStream) => {
  const escrows: any = allEscrows(tx);

  if (Array.isArray(escrows) && escrows.length > 0) {
    let filter = escrows.filter((escrow) => escrow.tx_type == 'EscrowCancel');

    if (Array.isArray(filter) && filter.length > 0) return filter;
  }
};

export { EscrowCancel };
