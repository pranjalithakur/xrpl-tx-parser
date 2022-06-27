import { TransactionStream } from 'xrpl';

function getTicketCreateNode(tx: TransactionStream) {
  if (tx.meta) {
    let parsedNodes = tx.meta.AffectedNodes.map((affNode, index) => {
      let node_types = ['CreatedNode'];
      let key = Object.keys(affNode)[0];

      if (node_types.indexOf(key) !== -1) return [affNode[key], key, index + 1];
    }).filter((node) => node[0].LedgerEntryType == 'RippleState');

    if (Array.isArray(parsedNodes) && parsedNodes.length > 0)
      return parsedNodes[0];
  }
}

function TicketCreate(tx: TransactionStream) {
  var ticket = {};
  var key;

  if (tx.engine_result !== 'tesSUCCESS') return undefined;
  if (tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS') return undefined;

  if (['TicketCreate'].indexOf(tx.transaction.TransactionType) === -1)
    return undefined;

  const [node, node_type, index] = getTicketCreateNode(tx);

  if (node == undefined) return;

  try {
    let keys = Object.keys(node);

    keys.forEach((k) => {
      if (['NewFields', 'FinalFields'].indexOf(k) != -1) key = k;
    });

    ticket.ledgerEntryType = node[key].LedgerEntryType;
    ticket.flags = node[key].Flags;
    ticket.sequence = node[key].TicketSequence;
    ticket.previous_sequence = node[key].PreviousTxnLgrSeq;
    ticket.previous_tx_hash = node[key].PreviousTxnID;

    ticket.ledger_index = tx.ledger_index;
    ticket.executed_time = tx.transaction.date;
    ticket.tx_hash = tx.transaction.hash;

    ticket.transactionType = tx.transaction.TransactionType;
    (ticket.tx_index = tx.meta.TransactionIndex),
      (ticket.sequence = tx.transaction.Sequence);
    (ticket.tx_hash = tx.transaction.hash),
      (ticket.tx_flag = tx.transaction.Flags),
      (ticket.ledger_index = tx.ledger_index),
      (ticket.fee = new BigNumber(dropsToXrp(tx.transaction.Fee)).toString());

    ticket.node_type = node_type;
    ticket.node_index = index;

    return ticket;
  } catch (error) {
    return error;
  }
}

export { TicketCreate };
