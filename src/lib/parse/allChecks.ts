import { dropsToXrp } from 'xrpl';
import { TransactionStream } from 'xrpl';
import BigNumber from 'bignumber.js';
import { GeneralNode } from '../../../types/common';
import { CheckInterface } from '.../../../types/parser';

const EPOCH_OFFSET = 946684800;

function allChecks(tx: TransactionStream) {
  var affNode: any;

  if (tx.engine_result !== 'tesSUCCESS') return undefined;
  if (tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS') return undefined;

  if (
    ['CheckCreate', 'CheckCancel', 'CheckCash'].indexOf(
      tx.transaction.TransactionType
    ) === -1
  )
    return undefined;

  if (tx.meta) {
    let parsedChecks = tx.meta.AffectedNodes.map((n, i) => {
      let node: any;
      affNode = n;

      if (
        affNode.DeletedNode &&
        affNode.DeletedNode.LedgerEntryType === 'Check'
      )
        node = affNode.DeletedNode;

      return assembleCheckData(tx, node);
    }).filter((parsed) => parsed != undefined);

    if (Array.isArray(parsedChecks) && parsedChecks.length > 0)
      return parsedChecks;
  }
}

function assembleCheckData(tx: TransactionStream, node: GeneralNode) {
  let check: CheckInterface = {};

  if (
    tx.transaction.TransactionType === 'CheckCreate' ||
    'CheckCancel' ||
    'checkCash'
  ) {
    console.log(tx);

    check.ledger_index = tx.ledger_index;
    check.time = tx.transaction.date;

    check.flags = tx.transaction.Flags;
    check.tx_hash = tx.transaction.hash;
    check.tx_type = tx.transaction.TransactionType;
    check.account = tx.transaction.Account;

    check.source_tag = tx.transaction.SourceTag;
    check.create_tx = tx.transaction.hash;

    if (node.FinalFields) {
      check.source_tag = node.FinalFields.SourceTag;
      check.create_tx = node.FinalFields.PreviousTxnID;
    }

    if (tx.transaction.Fee)
      check.fee = new BigNumber(dropsToXrp(tx.transaction.Fee)).toString();

    if (tx.transaction.TransactionType === 'CheckCancel') {
      check.create_tx_seq =
        tx.transaction.Sequence || tx.transaction.OfferSequence;
      check.owner = tx.transaction.Account || tx.transaction.Owner;
    }

    if (tx.transaction.TransactionType === 'CheckCash') {
      check.condition = tx.transaction.Condition;
      check.fulfillment = tx.transaction.Fulfillment;
      check.create_tx_seq =
        tx.transaction.Sequence || tx.transaction.OfferSequence;
      check.owner = tx.transaction.Account || tx.transaction.Owner;
    }

    if (tx.transaction.TransactionType === 'CheckCreate') {
      check.condition = tx.transaction.Condition;
      check.amount = new BigNumber(tx.transaction.Amount).toString();
      check.destination = tx.transaction.Destination;
      check.destination_tag = tx.transaction.DestinationTag;

      if (node.FinalFields) {
        if (node.FinalFields.Amount)
          check.amount = dropsToXrp(node.FinalFields.Amount).toString();
        check.destination = node.FinalFields.Destination;
        check.destination_tag = node.FinalFields.DestinationTag;
      }

      if (tx.transaction.CancelAfter) {
        check.cancel_after = tx.transaction.CancelAfter + EPOCH_OFFSET;
      }

      if (tx.transaction.FinishAfter) {
        check.finish_after = tx.transaction.FinishAfter + EPOCH_OFFSET;
      }
    }

    return check;
  }
}

export { allChecks };
/*

{
  "Account": "rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo",
  "Destination": "rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy",
  "DestinationNode": "0000000000000000",
  "DestinationTag": 1,
  "Expiration": 570113521,
  "Flags": 0,
  "InvoiceID": "46060241FABCF692D4D934BA2A6C4427CD4279083E38C77CBE642243E43BE291",
  "LedgerEntryType": "Check",
  "OwnerNode": "0000000000000000",
  "PreviousTxnID": "5463C6E08862A1FAE5EDAC12D70ADB16546A1F674930521295BC082494B62924",
  "PreviousTxnLgrSeq": 6,
  "SendMax": "100000000",
  "Sequence": 2,
  "index": "49647F0D748DC3FE26BDACBC57F251AADEFFF391403EC9BF87C97F67E9977FB0"
}
*/
