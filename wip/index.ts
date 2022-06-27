import { OfferPartialFills } from './OfferPartialFills';
import { OfferAllFills } from './OfferAllFills';
import { OfferFilled } from './OfferFilled';
import { OfferCreates } from './OfferCreates';
import { OfferCancels } from './OfferCancels';

import { Payment } from './Payment';
import { PaymentChannelClaim } from '../../../wip/PaymentChannelClaim';
import { PaymentChannelCreate } from './PaymentChannelCreate';
import { PaymentChannelFund } from './PaymentChannelFund';

import { TicketCreate } from './TicketCreate';
import { TrustSet } from './TrustSet';

import { SetRegularKey } from './SetRegularKey';

import { AccountDelete } from './AccountDelete';
import { AccountSet } from './AccountSet';

import { allPayments } from './allPayments';
import { allChecks } from './allChecks';
import { allEscrows } from './allEscrows';
import { allExchanges } from './allExchanges';
import { allMemos } from './allMemos';
import { allOffers } from './allOffers';
import { allAffectedAccounts } from './allAffectedAccounts';
import { allBalanceChanges } from './allBalanceChanges';
import { allPaymentChannels } from './allPayChans';

import { TxParserInterface } from '../../../types/common';

const txHandler = (tx: TxParserInterface) => {
  if (tx.type == 'response') return tx.result;
  if (tx.type == 'transaction') return tx;
  if (tx.type == 'TransactionEntryResponse') return tx.result;
  return Error('This is not in an eligible tranaction format');
};

export default {
  txHandler,

  allPayments,
  allChecks,
  allEscrows,
  allExchanges,
  allMemos,
  allOffers,
  allAffectedAccounts,
  allBalanceChanges,
  allPaymentChannels,

  OfferPartialFills,
  OfferAllFills,
  OfferFilled,
  OfferCreates,
  OfferCancels,
  Payment,
  PaymentChannelClaim,
  PaymentChannelCreate,
  PaymentChannelFund,
  TrustSet,
  TicketCreate,
  SetRegularKey,
  AccountDelete,
  AccountSet,
};
