import { TransactionStream } from 'xrpl';

function getSignerListNode(tx: TransactionStream) {
  if (tx.meta) {
    let parsedNodes = tx.meta.AffectedNodes.map((affNode, index) => {
      let node_types = ['CreatedNode'];
      let key = Object.keys(affNode)[0];

      if (node_types.indexOf(key) !== -1) return [affNode[key], key, index + 1];
    }).filter((node) => node[0].LedgerEntryType == 'SignerList');

    if (Array.isArray(parsedNodes) && parsedNodes.length > 0)
      return parsedNodes[0];
  }
}

function SignerList(tx: TransactionStream) {
  var list = {};
  var key;

  if (tx.engine_result !== 'tesSUCCESS') return undefined;
  if (tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS') return undefined;

  if (['SignerListSet'].indexOf(tx.transaction.TransactionType) === -1)
    return undefined;

  const [node, node_type, index] = getSignerListNode(tx);

  if (node == undefined) return;

  try {
    let keys = Object.keys(node);

    keys.forEach((k) => {
      if (['NewFields', 'FinalFields'].indexOf(k) != -1) key = k;
    });

    list.ledgerEntryType = node[key].LedgerEntryType;
    list.flags = node[key].Flags;
    list.previous_sequence = node[key].PreviousTxnLgrSeq;
    list.previous_tx_hash = node[key].PreviousTxnID;

    list.list = node[key].SignerEntries;
    list.listId = node[key].SignerListID;
    list.quorum = node[key].SignerQuorum;

    list.total_weight = node[key].SignerQuorum.map((entry) => {
      return entry.SignerEntry.SignerWeight;
    }).reduce((a, b) => a + b, 0);

    list.ledger_index = tx.ledger_index;
    list.executed_time = tx.transaction.date;
    list.tx_hash = tx.transaction.hash;

    list.transactionType = tx.transaction.TransactionType;
    (list.tx_index = tx.meta.TransactionIndex),
      (list.sequence = tx.transaction.Sequence);
    (list.tx_flag = tx.transaction.Flags),
      (list.ledger_index = tx.ledger_index),
      (list.fee = new BigNumber(dropsToXrp(tx.transaction.Fee)).toString());

    list.node_type = node_type;
    list.node_index = index;

    return list;
  } catch (error) {
    return error;
  }
}

export { SignerList };
