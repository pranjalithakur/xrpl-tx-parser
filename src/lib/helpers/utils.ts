import _ from 'lodash';
import BigNumber from 'bignumber.js';
import { dropsToXrp } from 'xrpl';
import { IssuedCurrencyAmount } from 'xrpl/dist/npm/models/common';

const normalizeNode = (affectedNode: any) => {
  var diffType = Object.keys(affectedNode)[0];
  var node = affectedNode[diffType];
  return Object.assign({}, node, {
    diffType: diffType,
    entryType: node.LedgerEntryType,
    ledgerIndex: node.LedgerIndex,
    newFields: node.NewFields || {},
    finalFields: node.FinalFields || {},
    previousFields: node.PreviousFields || {},
  });
};

const normalizeNodes = (metadata: any) => {
  if (!metadata.AffectedNodes) {
    return [];
  }
  return metadata.AffectedNodes.map(normalizeNode);
};

const parseCurrencyAmount = (currencyAmount: IssuedCurrencyAmount) => {
  if (currencyAmount === undefined) {
    return undefined;
  }
  if (typeof currencyAmount === 'string') {
    return {
      currency: 'XRP',
      value: dropsToXrp(new BigNumber(currencyAmount)).toString(),
    };
  }

  return {
    currency: currencyAmount.currency,
    counterparty: currencyAmount.issuer,
    value: currencyAmount.value,
  };
};

function isAccountField(fieldName: string) {
  var fieldNames = ['Account', 'Owner', 'Destination', 'Issuer', 'Target'];
  return _.includes(fieldNames, fieldName);
}

function isAmountFieldAffectingIssuer(fieldName: string) {
  var fieldNames = ['LowLimit', 'HighLimit', 'TakerPays', 'TakerGets'];
  return _.includes(fieldNames, fieldName);
}

function getAffectedAccounts(metadata: any) {
  var accounts: any = [];
  _.forEach(normalizeNodes(metadata), function (node) {
    var fields =
      node.diffType === 'CreatedNode' ? node.newFields : node.finalFields;
    _.forEach(fields, function (fieldValue, fieldName) {
      if (isAccountField(fieldName)) {
        accounts.push(fieldValue);
      } else if (isAmountFieldAffectingIssuer(fieldName) && fieldValue.issuer) {
        accounts.push(fieldValue.issuer);
      }
    });
  });
  return _.uniq(accounts);
}

function adjustQualityForXRP(quality: string, pays: string, gets: string) {
  var numeratorShift = pays === 'XRP' ? -6 : 0;
  var denominatorShift = gets === 'XRP' ? -6 : 0;
  var shift = numeratorShift - denominatorShift;
  return shift === 0
    ? new BigNumber(quality)
    : new BigNumber(quality).shiftedBy(shift);
}

function parseQuality(bookDirectory: string, pays: string, gets: string) {
  var qualityHex = bookDirectory.substring(bookDirectory.length - 16);
  var mantissa = new BigNumber(qualityHex.substring(2), 16);
  var offset = parseInt(qualityHex.substring(0, 2), 16) - 100;
  var quality = mantissa.toString() + 'e' + offset.toString();
  return adjustQualityForXRP(quality, pays, gets);
}

export default {
  normalizeNodes,
  parseCurrencyAmount,
  getAffectedAccounts,
  parseQuality,
};
