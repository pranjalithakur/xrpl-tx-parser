import { dropsToXrp } from 'xrpl';
import { TransactionStream } from './../../../models/methods/subscribe';
import { BigNumber } from 'bignumber.js';
import { NodeInterface} from './../models/parser/paychan';
import { GeneralNode } from '../models/additions';
import lib from '../lib'
import { parseQuality } from '../lib/quality';

const objectFlags = {
    lsfLowReserve: 0x00010000,
    lsfHighReserve: 0x00020000,
    lsfLowNoRipple: 0x00100000,
    lsfHighNoRipple: 0x00200000,
    lsfHighAuth: 0x00080000,
    lsfLowAuth: 0x00040000,
    lsfLowFreeze: 0x00400000,
    lsfHighFreeze: 0x00800000
  }
  
  function getTrustSetNode(tx:TransactionStream) {
  
    if (tx.meta) {
      let parsedNodes = tx.meta.AffectedNodes
        .map((affNode, index) => {
            let node_types = [ "CreatedNode", "ModifiedNode", "DeletedNode" ]
            let key = Object.keys(affNode)[0]

            if ( node_types.indexOf(key) !== -1) return [ affNode[key], key, index+1 ]

          })
        .filter(node => node[0].LedgerEntryType == 'RippleState')
  
        if ( Array.isArray(parsedNodes) && parsedNodes.length > 0 ) return parsedNodes[0]

    }

  }

  function getRippledState (node, account) {

    if ( node.Flags & objectFlags[node.HighLimit.issuer === account 
        ? 'lsfHighReserve' 
        : 'lsfLowReserve']  ) return true
    
    return false

  }
  
  function TrustSet(tx:TransactionStream) {
    var trustline = {};
    var key;

    if (  tx.engine_result !== 'tesSUCCESS' ) return undefined;
    if (  tx.meta && tx.meta.TransactionResult !== 'tesSUCCESS' ) return undefined;
  
    if([
        'TrustSet',
      ].indexOf(tx.transaction.TransactionType) === -1) return undefined 
    
        const [node, node_type, index] = getTrustSetNode(tx)

        if (node == undefined) return

        try {

            let keys = Object.keys(node)

            keys.forEach( (k) => {
                if (['NewFields', 'FinalFields']
                    .indexOf(k) != -1) key = k
            })

                let balance = node[key].Balance
                let party  = [node[key].LowLimit, node[key].HighLimit]
    
            var [account, counterparty] = parseInt(balance.value) > 0 
                                            ? party 
                                            : party.reverse();

            if(balance.value == '0') {
                [account, counterparty] = party[1].value == '0' 
                                            ? party 
                                            : party.reverse();
                }
            const notInDefaultState = getRippledState(node[key], account)   

            const ripplingFlags = [ (objectFlags.lsfLowNoRipple & node[key].Flags) == objectFlags.lsfLowNoRipple ,
                                    (objectFlags.lsfHighNoRipple & node[key].Flags) == objectFlags.lsfHighNoRipple ]
            
            const [no_rippling, no_rippling_peer] = party[0].issuer === account
                                                        ? ripplingFlags
                                                        : ripplingFlags.reverse()                                 

            const authFlags = [ (objectFlags.lsfLowAuth & node[key].Flags) == objectFlags.lsfLowAuth ,
                                (objectFlags.lsfHighAuth & node[key].Flags) == objectFlags.lsfHighAuth ]

            const [auth, auth_peer] = party[0].issuer === account
                                                    ? authFlags
                                                    : authFlags.reverse()                                 
                                        
                    
            const freezeFlags = [ (objectFlags.lsfLowFreeze & node[key].Flags) == objectFlags.lsfLowFreeze ,
                                    (objectFlags.lsfHighFreeze & node[key].Flags) == objectFlags.lsfHighFreeze ]

            const [freeze, freeze_peer] = party[0].issuer === account
                                        ? freezeFlags         
                                        : freezeFlags.reverse()       


            trustline.type = notInDefaultState == true ? 'create' : 'delete'


            // Back check to what node looks on ModifiedNode
            if(node_type == 'ModifiedNode') trustline.type = notInDefaultState == true 
                                                                ? 'modified' 
                                                                : 'delete'


            trustline.account = {}
            trustline.issuer  = {}
            trustline.account.address   = account.issuer  
            trustline.account.rippling  = !no_rippling;
            trustline.account.auth      = auth;
            trustline.account.freeze    = freeze;
            trustline.account.level     = account == party[0] ? 'Low' : 'High'

            trustline.issuer.address    = counterparty.issuer  
            trustline.issuer.rippling   = !no_rippling_peer;
            trustline.issuer.auth       = auth_peer;   
            trustline.issuer.freeze     = freeze_peer;
            trustline.issuer.level      = counterparty == party[0] ? 'Low' : 'High'

            trustline.limit = account.value
   
            trustline.balance = balance >= 0 ? new BigNumber(balance.value).toString() 
                                             : new BigNumber(balance.value).multipliedBy(-1).toString();
            trustline.currency = lib.currencyHexToUTF8(balance.currency);
            trustline.trustSet_flags = node[key].Flags;

            trustline.ledger_index = tx.ledger_index;
            trustline.executed_time = tx.transaction.date;
            trustline.tx_hash = tx.transaction.hash;

            trustline.transactionType  = tx.transaction.TransactionType;
            trustline.tx_index = tx.meta.TransactionIndex, 
            trustline.sequence   = tx.transaction.Sequence;       
            trustline.tx_hash  = tx.transaction.hash,
            trustline.tx_flag    = tx.transaction.Flags,

            trustline.ledger_index    = tx.ledger_index,
            trustline.fee   = new BigNumber(dropsToXrp(tx.transaction.Fee)).toString();

            trustline.node_type        = node_type;
            trustline.node_index       = index;


            return trustline

            } catch(error) {
                console.log(error)
            }
    
  }
  
  export { TrustSet }
  
