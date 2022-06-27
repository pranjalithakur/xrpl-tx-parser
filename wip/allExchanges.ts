import { dropsToXrp } from 'xrpl';
import { TransactionStream } from './../../models/methods/subscribe';
import BigNumber from 'bignumber.js';
import { parseQuality } from './lib/quality';
import { GeneralNode } from './../../models/additions'

import { OfferInterface, Currency } from "./models/parser/offer"

/**
 * OffersExercised;
 * parse a single transaction to extract
 * all offers exercised
 */

var allExchanges = function (tx: TransactionStream) {
  var affNode:any;

    if (  tx.engine_result !== 'tesSUCCESS' ) return undefined;
    if (  tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS' ) return undefined;

    if (  tx.transaction.TransactionType !== 'Payment' 
          && tx.transaction.TransactionType !== 'OfferCreate') return;
    
      if (tx.meta) {
        let parsedOffers = tx.meta.AffectedNodes
            .map((n, i) => {
                let node:any;
                affNode = n;

                if ( affNode.ModifiedNode ) node = affNode.ModifiedNode;
                if ( affNode.DeletedNode ) node = affNode.DeletedNode;
            
                if (  !node 
                      || node.LedgerEntryType !== 'Offer'
                      || !node.PreviousFields 
                      || !node.PreviousFields.TakerPays 
                      || !node.PreviousFields.TakerGets ) return;

                node.NodeIndex = i;
                return parseOfferExercised(node, tx)})
            .filter(parsed => parsed != undefined )


      if (Array.isArray(parsedOffers) && parsedOffers.length > 0 ) return parsedOffers
    }
  }

  /**
   * parseOfferExercised
   * after determining the presence of an
   * excercised offer, extract it into
   * the required form
   */

  function parseOfferExercised (node:GeneralNode, tx:TransactionStream) {

    let base : Currency = {};
    var counter : Currency = {};
    var exchangeRate: string | BigNumber | undefined
    var change : any;
    var counterparty : any;

    if (node.FinalFields && node.FinalFields.Account) counterparty = node.FinalFields.Account;

    // TakerPays IOU
    if (node.PreviousFields && node.FinalFields) {

      if (node.PreviousFields.TakerPays &&
          typeof node.PreviousFields.TakerPays === "object") {

        if (typeof node.FinalFields.TakerPays === "string" ) {
          change = new BigNumber(node.PreviousFields.TakerPays.toString())
        } else {
          change = new BigNumber(node.PreviousFields.TakerPays.value)
            .minus(node.FinalFields.TakerPays.value)

      base = {
        currency: node.PreviousFields.TakerPays.currency,
        issuer: node.PreviousFields.TakerPays.issuer,
        amount: change.toString()
      }
    }

    // TakerPays XRP
    } else {
        change = new BigNumber(node.PreviousFields.TakerPays.toString())
          .minus(node.FinalFields.TakerPays.toString());

        base = {
          currency: 'XRP',
          amount: dropsToXrp(change).toString()
        }
      }
    }

    // TakerGets IOU
    if (node.PreviousFields && node.FinalFields) {

    if (node.PreviousFields.TakerGets &&
        typeof node.PreviousFields.TakerGets === "object") {

        if (typeof node.FinalFields.TakerGets === "string" ) {
          change = new BigNumber(node.PreviousFields.TakerGets.toString())
        } else {
          change = new BigNumber(node.PreviousFields.TakerGets.value)
            .minus(node.FinalFields.TakerGets.value)
        }

      counter = {
        currency: node.PreviousFields.TakerGets.currency,
        issuer: node.PreviousFields.TakerGets.issuer,
        amount: change.toString()
      }

    // TakerGets XRP
    } else {
        change = new BigNumber(node.PreviousFields.TakerGets.toString())
          .minus(node.FinalFields.TakerGets.toString());

        counter = {
          currency: 'XRP',
          amount: dropsToXrp(change).toString()
        }
      }
    }

    if (  node.FinalFields 
          && node.FinalFields.quality
          && typeof base == "object"
          && typeof counter == "object" ) {

        exchangeRate = parseQuality(
            node.FinalFields.quality,
            base.currency,
            counter.currency
        );

      }
    
    if (  !exchangeRate           
          && typeof base == "object"
          && typeof counter == "object"
          && base.amount
          && counter.amount ) {

          exchangeRate = new BigNumber(base.amount).dividedBy(counter.amount);
    }

    var offer : OfferInterface = {
      base         : base,
      counter      : counter,
      rate         : exchangeRate,
      buyer        : counterparty,
      seller       : tx.transaction.Account,
      taker        : tx.transaction.Account,
      time         : tx.transaction.date,
      tx_type      : tx.transaction.TransactionType,
      ledger_index : tx.ledger_index,
      node_index   : node.NodeIndex,
      tx_hash      : tx.transaction.hash
    };

    if (tx.meta) offer.tx_index  =  tx.meta.TransactionIndex;

    if (node.FinalFields) {
        offer.provider  =  node.FinalFields.Account;
        offer.sequence  =  node.FinalFields.Sequence;
    }

    // look for autobridge data
    if (  tx.transaction.TransactionType === 'OfferCreate' 
          && offer.counter && offer.base 
          && typeof tx.transaction.TakerPays === 'object' 
          && typeof tx.transaction.TakerGets === 'object' ) {

      if (offer.counter.currency === 'XRP' &&
        offer.base.currency === tx.transaction.TakerPays.currency) {
        offer.autobridged = {
          currency: tx.transaction.TakerGets.currency,
          issuer: tx.transaction.TakerGets.issuer
        };

      } else if (offer.counter.currency === 'XRP' &&
        offer.base.currency === tx.transaction.TakerGets.currency) {
        offer.autobridged = {
          currency: tx.transaction.TakerPays.currency,
          issuer: tx.transaction.TakerPays.issuer
        };

      } else if (offer.base.currency === 'XRP' &&
        offer.counter.currency === tx.transaction.TakerPays.currency) {
        offer.autobridged = {
          currency: tx.transaction.TakerGets.currency,
          issuer: tx.transaction.TakerGets.issuer
        };

      } else if (offer.base.currency === 'XRP' &&
        offer.counter.currency === tx.transaction.TakerGets.currency) {
        offer.autobridged = {
          currency: tx.transaction.TakerPays.currency,
          issuer: tx.transaction.TakerPays.issuer
        };
      }
    }

    return orderPair(offer);
  }

  /**
   * orderPair
   * swap currencies based on
   * lexigraphical order
   */

  function orderPair (offer : OfferInterface) {

    if (  offer.counter && offer.base 
          && typeof offer.counter == "object"
          && typeof offer.base == "object" 
          && offer.counter.currency && offer.base.currency ) {

      var c1 = (offer.base.currency + offer.base.issuer).toLowerCase();
      var c2 = (offer.counter.currency + offer.counter.issuer).toLowerCase();
      var swap: any ;

      if (c2 < c1) {
        swap          = offer.base;
        offer.base    = offer.counter;
        offer.counter = swap;
        offer.rate    = offer.rate.toString();
        swap          = offer.buyer;
        offer.buyer   = offer.seller;
        offer.seller  = swap;

      } else {
        offer.rate = offer.rate.pow(-1).toString();
      }
    }

    return offer;
  }

export { allExchanges };
