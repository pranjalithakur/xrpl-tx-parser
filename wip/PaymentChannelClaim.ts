import { allPaymentChannels } from '../src/lib/parse/allPayChans';
import { TransactionStream } from 'xrpl';

export const PaymentChannelClaim = (tx: TransactionStream) => {
  const payChans = allPaymentChannels(tx);

  if (Array.isArray(payChans) && payChans.length > 0) {
    let filter = payChans.filter(
      (payChan) => payChan.tx_type == 'PaymentChannelClaim'
    );

    if (Array.isArray(filter) && filter.length > 0) return filter;
  }
};
