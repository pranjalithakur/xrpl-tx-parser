import { allOffers } from './allOffers';
import { TransactionStream } from 'xrpl';

const OfferAllFills = (tx: TransactionStream) => {
  const offers = allOffers(tx);

  if (Array.isArray(offers) && offers.length > 0) {
    let filter = offers.filter(
      (offer) =>
        offer.change_type == 'partial_fill' || offer.change_type == 'fill'
    );

    if (Array.isArray(filter) && filter.length > 0) return filter;
  }
};

export { OfferAllFills };
