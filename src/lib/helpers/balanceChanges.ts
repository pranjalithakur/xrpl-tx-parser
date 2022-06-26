import _ from 'lodash';
import BigNumber from 'bignumber.js';
import utils from './utils';
import { dropsToXrp } from 'xrpl';

const groupByAddress = (balanceChanges: any) => {
  var grouped = _.groupBy(balanceChanges, (node: any) => node.address);
  return _.mapValues(grouped, (group: any) =>
    _.map(group, (node: any) => node.balance)
  );
};

const parseValue = (value: any) => {
  return new BigNumber(value.value || value);
};

const computeBalanceChange = (node: any) => {
  var value = null;
  if (node.newFields.Balance) {
    value = parseValue(node.newFields.Balance);
  } else if (node.previousFields.Balance && node.finalFields.Balance) {
    value = parseValue(node.finalFields.Balance).minus(
      parseValue(node.previousFields.Balance)
    );
  }
  return value === null ? null : value.isZero() ? null : value;
};

const parseFinalBalance = (node: any) => {
  if (node.newFields.Balance) {
    return parseValue(node.newFields.Balance);
  } else if (node.finalFields.Balance) {
    return parseValue(node.finalFields.Balance);
  }
  return null;
};

const parseXRPQuantity = (node: any, valueParser: any) => {
  var value = valueParser(node);

  if (value === null) {
    return null;
  }

  return {
    address: node.finalFields.Account || node.newFields.Account,
    balance: {
      counterparty: '',
      currency: 'XRP',
      value: dropsToXrp(value).toString(),
    },
  };
};

const flipTrustlinePerspective = (quantity: any) => {
  var negatedBalance = new BigNumber(quantity.balance.value).negated();
  return {
    address: quantity.balance.counterparty,
    balance: {
      counterparty: quantity.address,
      currency: quantity.balance.currency,
      value: negatedBalance.toString(),
    },
  };
};

const parseTrustlineQuantity = (node: any, valueParser: any) => {
  var value = valueParser(node);

  if (value === null) {
    return null;
  }

  /*
   * A trustline can be created with a non-zero starting balance
   * If an offer is placed to acquire an asset with no existing trustline,
   * the trustline can be created when the offer is taken.
   */
  var fields = _.isEmpty(node.newFields) ? node.finalFields : node.newFields;

  // the balance is always from low node's perspective
  var result = {
    address: fields.LowLimit.issuer,
    balance: {
      counterparty: fields.HighLimit.issuer,
      currency: fields.Balance.currency,
      value: value.toString(),
    },
  };
  return [result, flipTrustlinePerspective(result)];
};

const parseQuantities = (metadata: any, valueParser: any) => {
  var values = utils.normalizeNodes(metadata).map((node: any) => {
    if (node.entryType === 'AccountRoot') {
      return [parseXRPQuantity(node, valueParser)];
    } else if (node.entryType === 'RippleState') {
      return parseTrustlineQuantity(node, valueParser);
    }
    return [];
  });
  return groupByAddress(_.compact(_.flatten(values)));
};

/**
 *  Computes the complete list of every balance that changed in the ledger
 *  as a result of the given transaction.
 *
 *  @param {Object} metadata Transaction metadata
 *  @returns {Object} parsed balance changes
 */
const parseBalanceChanges = (metadata: any) => {
  return parseQuantities(metadata, computeBalanceChange);
};

/**
 *  Computes the complete list of every final balance in the ledger
 *  as a result of the given transaction.
 *
 *  @param {Object} metadata Transaction metadata
 *  @returns {Object} parsed balances
 */
const parseFinalBalances = (metadata: any) => {
  return parseQuantities(metadata, parseFinalBalance);
};

export { parseBalanceChanges, parseFinalBalances };
