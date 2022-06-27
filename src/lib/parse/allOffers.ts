import { dropsToXrp } from 'xrpl';
import { TransactionStream } from 'xrpl';

import BigNumber from 'bignumber.js';
import { parseQuality } from '../helpers/quality';

import { GeneralNode, NewFields, FinalFields } from '../../../types/common';
import { OfferInterface } from '../../../types/parser/offer';

const EPOCH_OFFSET = 946684800;

var allOffers = function (tx: TransactionStream) {
  var list = new Array();
  var affNode: any;
  var node: GeneralNode;
  var fields: NewFields | FinalFields | undefined;
  var type: string;
  var offer: OfferInterface;

  if (tx.engine_result !== 'tesSUCCESS') return undefined;
  if (tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS') return undefined;

  if (
    ['Payment', 'OfferCancel', 'OfferCreate'].indexOf(
      tx.transaction.TransactionType
    ) === -1
  )
    return undefined;

  if (
    tx.transaction.TransactionType === 'Payment' ||
    'OfferCancel' ||
    'OfferCreate'
  ) {
    if (tx.meta) {
      offer = {
        tx_type: tx.transaction.TransactionType,
        tx_index: tx.meta.TransactionIndex,
        tx_hash: tx.transaction.hash,
        executed_time: tx.transaction.date,
        ledger_index: tx.ledger_index,
        taker_pays: { value: '0' },
        taker_gets: { value: '0' },
      };

      if (
        tx.transaction.TransactionType === 'OfferCreate' &&
        tx.transaction.Expiration
      )
        offer.expiration = tx.transaction.Expiration;

      tx.meta.AffectedNodes.forEach((n, i) => {
        affNode = n;

        if (affNode.CreatedNode) {
          node = affNode.CreatedNode;
          type = 'CreatedNode';
        } else if (affNode.ModifiedNode) {
          node = affNode.ModifiedNode;
          type = 'ModifiedNode';
        } else if (affNode.DeletedNode) {
          node = affNode.DeletedNode;
          type = 'DeletedNode';
        } else {
          return;
        }

        if (node.LedgerEntryType !== 'Offer') return;

        fields = node.NewFields || node.FinalFields;

        if (!fields) return;

        if (node.LedgerEntryType == 'Offer') {
          offer.node_type = type;
          offer.account = fields.Account;
          offer.offer_sequence = fields.Sequence;
          offer.book_directory = fields.BookDirectory;
          offer.node_index = i;

          // track old and new offers
          if (
            tx.transaction.TransactionType == 'OfferCreate' ||
            tx.transaction.TransactionType == 'OfferCancel'
          ) {
            if (
              tx.transaction.OfferSequence &&
              fields.Account === tx.transaction.Account
            ) {
              if (type === 'CreatedNode') {
                offer.prev_offer_sequence = tx.transaction.OfferSequence;
              } else if (type === 'DeletedNode') {
                offer.next_offer_sequence = tx.transaction.Sequence;
              }
            }
          }

          if (typeof fields.TakerPays === 'object') {
            offer.taker_pays = fields.TakerPays;
          } else {
            offer.taker_pays = {
              currency: 'XRP',
              value: new BigNumber(dropsToXrp(fields.TakerPays)).toString(),
            };
          }

          if (typeof fields.TakerGets === 'object') {
            offer.taker_gets = fields.TakerGets;
          } else {
            offer.taker_gets = {
              currency: 'XRP',
              value: new BigNumber(dropsToXrp(fields.TakerGets)).toString(),
            };
          }

          if (
            node.FinalFields &&
            node.FinalFields.quality &&
            offer.taker_pays &&
            offer.taker_gets
          ) {
            try {
              offer.rate = parseQuality(
                node.FinalFields.quality,
                offer.taker_pays.currency,
                offer.taker_gets.currency
              ).toString();
            } catch (e) {
              console.log('unable to calculate rate', e);
            }
          }

          //adjust to unix time
          if (offer.expiration) {
            let addition = offer.expiration + EPOCH_OFFSET;
            offer.expiration = addition;
          }

          // determine change amounts
          if (node.PreviousFields) {
            if (!node.PreviousFields.TakerPays) {
              offer.pays_change = '0';
            } else if (
              offer.taker_pays.currency === 'XRP' &&
              typeof node.PreviousFields.TakerPays == 'string' &&
              typeof offer.taker_pays.value == 'object'
            ) {
              offer.pays_change = new BigNumber(
                dropsToXrp(node.PreviousFields.TakerPays)
              )
                .minus(offer.taker_pays.value)
                .toString();
            } else {
              if (
                typeof node.PreviousFields.TakerPays == 'object' &&
                typeof offer.taker_pays.value == 'object'
              ) {
                offer.pays_change = new BigNumber(
                  node.PreviousFields.TakerPays.value
                )
                  .minus(offer.taker_pays.value)
                  .toString();
              }
            }

            if (!node.PreviousFields.TakerGets) {
              offer.gets_change = '0';
            } else if (
              offer.taker_gets.currency === 'XRP' &&
              typeof node.PreviousFields.TakerGets == 'string' &&
              typeof offer.taker_gets.value == 'object'
            ) {
              offer.gets_change = new BigNumber(
                dropsToXrp(node.PreviousFields.TakerGets)
              )
                .minus(offer.taker_gets.value)
                .toString();
            } else {
              if (
                typeof node.PreviousFields.TakerGets == 'object' &&
                typeof offer.taker_gets.value == 'object'
              ) {
                offer.gets_change = new BigNumber(
                  node.PreviousFields.TakerGets.value
                )
                  .minus(offer.taker_gets.value)
                  .toString();
              }
            }
          } else {
            offer.pays_change = '0';
            offer.gets_change = '0';
          }

          // created node is only a new offer
          if (type === 'CreatedNode') {
            offer.change_type = 'create';

            // all modified nodes are partial fill
          } else if (type === 'ModifiedNode') {
            offer.change_type = 'partial_fill';

            // all offer cancel is cancel
          } else if (tx.transaction.TransactionType === 'OfferCancel') {
            offer.change_type = 'cancel';

            // replace
          } else if (
            tx.transaction.TransactionType === 'OfferCreate' &&
            type === 'DeletedNode' &&
            fields.Account === tx.transaction.Account &&
            fields.Sequence === tx.transaction.OfferSequence
          ) {
            offer.change_type = 'replace';

            // no amount means filled offer
          } else if (offer.taker_pays.value === '0') {
            offer.change_type = 'fill';
          } else if (!node.PreviousFields) {
            offer.change_type = 'unfunded_cancel';
          } else if (offer.pays_change !== '0' || offer.gets_change !== '0') {
            offer.change_type = 'unfunded_partial_fill';
          }
        }

        list.push(offer);
      });

      if (Array.isArray(list) && list.length > 0) return list;
    }
  }
};

export { allOffers };
