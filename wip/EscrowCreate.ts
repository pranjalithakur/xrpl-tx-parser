import { allEscrows } from './allEscrows';
import { TransactionStream } from 'xrpl';

const EscrowCreate = (tx: TransactionStream) => {
  const escrows: any = allEscrows(tx);

  if (Array.isArray(escrows) && escrows.length > 0) {
    let filter = escrows.filter((escrow) => escrow.tx_type == 'EscrowCreate');

    if (Array.isArray(filter) && filter.length > 0) return filter;
  }
};

export { EscrowCreate };
