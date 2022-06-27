import { dropsToXrp } from 'xrpl';
import { TransactionStream } from 'xrpl';
import BigNumber from 'bignumber.js';
import { GeneralNode } from '.../../../types/common';
import { EscrowInterface } from '.../../../types/parser/escrow';

const EPOCH_OFFSET = 946684800;

function allEscrows(tx: TransactionStream) {
  var affNode: any;

  if (tx.engine_result !== 'tesSUCCESS') return undefined;
  if (tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS') return undefined;

  if (
    ['EscrowCreate', 'EscrowCancel', 'EscrowFinish'].indexOf(
      tx.transaction.TransactionType
    ) === -1
  )
    return undefined;

  if (tx.meta) {
    let parsedEscrows = tx.meta.AffectedNodes.map((n, i) => {
      let node: any;
      affNode = n;

      if (
        affNode.DeletedNode &&
        affNode.DeletedNode.LedgerEntryType === 'Escrow'
      )
        node = affNode.DeletedNode;

      return assembleEscrowData(tx, node);
    }).filter((parsed) => parsed != undefined);

    if (Array.isArray(parsedEscrows) && parsedEscrows.length > 0)
      return parsedEscrows;
  }
}

function assembleEscrowData(tx: TransactionStream, node: GeneralNode) {
  let escrow: EscrowInterface = {};

  if (
    tx.transaction.TransactionType === 'EscrowCreate' ||
    'EscrowCancel' ||
    'EscrowFinish'
  ) {
    escrow.ledger_index = tx.ledger_index;
    escrow.time = tx.transaction.date;

    escrow.flags = tx.transaction.Flags;
    escrow.tx_hash = tx.transaction.hash;
    escrow.tx_type = tx.transaction.TransactionType;
    escrow.account = tx.transaction.Account;

    escrow.source_tag = tx.transaction.SourceTag;
    escrow.create_tx = tx.transaction.hash;

    if (node.FinalFields) {
      escrow.source_tag = node.FinalFields.SourceTag;
      escrow.create_tx = node.FinalFields.PreviousTxnID;
    }

    if (tx.transaction.Fee)
      escrow.fee = new BigNumber(dropsToXrp(tx.transaction.Fee)).toString();

    if (tx.transaction.TransactionType === 'EscrowCancel') {
      escrow.create_tx_seq =
        tx.transaction.Sequence || tx.transaction.OfferSequence;
      escrow.owner = tx.transaction.Account || tx.transaction.Owner;
    }

    if (tx.transaction.TransactionType === 'EscrowFinish') {
      escrow.condition = tx.transaction.Condition;
      escrow.fulfillment = tx.transaction.Fulfillment;
      escrow.create_tx_seq =
        tx.transaction.Sequence || tx.transaction.OfferSequence;
      escrow.owner = tx.transaction.Account || tx.transaction.Owner;
    }

    if (tx.transaction.TransactionType === 'EscrowCreate') {
      escrow.condition = tx.transaction.Condition;
      escrow.amount = new BigNumber(tx.transaction.Amount).toString();
      escrow.destination = tx.transaction.Destination;
      escrow.destination_tag = tx.transaction.DestinationTag;

      if (node.FinalFields) {
        if (node.FinalFields.Amount)
          escrow.amount = dropsToXrp(node.FinalFields.Amount).toString();
        escrow.destination = node.FinalFields.Destination;
        escrow.destination_tag = node.FinalFields.DestinationTag;
      }

      if (tx.transaction.CancelAfter) {
        escrow.cancel_after = tx.transaction.CancelAfter + EPOCH_OFFSET;
      }

      if (tx.transaction.FinishAfter) {
        escrow.finish_after = tx.transaction.FinishAfter + EPOCH_OFFSET;
      }
    }

    return escrow;
  }
}

export { allEscrows };
