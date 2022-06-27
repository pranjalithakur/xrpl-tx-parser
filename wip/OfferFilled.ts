import { allOffers } from './allOffers';
import { TransactionStream } from 'xrpl';

export const OfferFilled = (tx: TransactionStream) => {
  const offers = allOffers(tx);

  if (Array.isArray(offers) && offers.length > 0) {
    let filter = offers.filter((offer) => offer.change_type == 'fill');

    if (Array.isArray(filter) && filter.length > 0) return filter;
  }
};
