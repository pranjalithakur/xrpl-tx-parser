import { TransactionStream } from '../../models/methods/subscribe';
import { MemoInterface } from './models/parser/memo';

var hexMatch    = new RegExp('^(0x)?[0-9A-Fa-f]+$');
var base64Match = new RegExp('^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})([=]{1,2})?$');
var sjcl        = require('sjcl');


var allMemos = function (tx:TransactionStream) {
  var list = new Array();
  var data:MemoInterface = {}

//NOTE: keep all memos
//  if ( tx.metaData.TransactionResult !== "tesSUCCESS" ) {
//    return list;
//  }


  if (tx.transaction.Memos) {
    
    data.account = tx.transaction.Account;
    tx.transaction.Memos.forEach(function(memo, i) {

      if (!memo.Memo) return;

      //MemoData
      if(memo.Memo.MemoData) {
        data.memo_data = memo.Memo.MemoData;
        //attempt to decode from base64 or hex
        try {
          if (hexMatch.test(memo.Memo.MemoData)) {
            data.decoded_data  = decodeHex(memo.Memo.MemoData);
            data.data_encoding = 'hex';

          } else if (base64Match.test(memo.Memo.MemoData)) {
            data.decoded_data  = decodeBase64(memo.Memo.MemoData);
            data.data_encoding = 'base64';
          }

        } catch (e) {
          //unable to decode
        }
      }

      //MemoFormat
      if (memo.Memo.MemoFormat) {

        //attempt to decode from base64 or hex
        try {
          data.memo_format = memo.Memo.MemoFormat;
          if (hexMatch.test(memo.Memo.MemoFormat)) {
            data.decoded_format  = decodeHex(memo.Memo.MemoFormat);
            data.format_encoding = 'hex';

          } else if (base64Match.test(memo.Memo.MemoFormat)) {
            data.decoded_format  = decodeBase64(memo.Memo.MemoFormat);
            data.format_encoding = 'base64';
          }

        } catch (e) {
          //unable to decode
        }
      }

      //MemoType
      if (memo.Memo.MemoType) {

        //attempt to decode from base64 or hex
        try {
          data.memo_type = memo.Memo.MemoType;
          if (hexMatch.test(memo.Memo.MemoType)) {
            data.decoded_type  = decodeHex(memo.Memo.MemoType);
            data.type_encoding = 'hex';

          } else if (base64Match.test(memo.Memo.MemoType)) {
            data.decoded_type  = decodeBase64(memo.Memo.MemoType);
            data.type_encoding = 'base64';
          }

        } catch (e) {
          //unable to decode
        }
      }

      if (tx.transaction.TransactionType == "Payment" ||
          tx.transaction.TransactionType == "AccountDelete" ||
          tx.transaction.TransactionType == "CheckCreate" ||
          tx.transaction.TransactionType == "EscrowCreate" ||
          tx.transaction.TransactionType == "PaymentChannelCreate") {

        if (tx.transaction.Destination) {
          data.destination = tx.transaction.Destination;
        }

        if (tx.transaction.DestinationTag) {
          data.destination_tag = tx.transaction.DestinationTag;
        }
      }

      if (tx.transaction.SourceTag) {
        data.source_tag = tx.transaction.SourceTag;
      }

      data.executed_time = tx.transaction.date;
      data.ledger_index  = tx.ledger_index;
      data.memo_index    = i,
      data.tx_hash       = tx.transaction.hash;


      list.push(data);

    })

    if (Array.isArray(list) && list.length > 0 ) return list;

  }
};

function decodeBase64(data:string) {
  return sjcl.codec.utf8String.fromBits(sjcl.codec.base64.toBits(data)) || undefined;
}

function decodeHex(data:string) {
  return sjcl.codec.utf8String.fromBits(sjcl.codec.hex.toBits(data)) || undefined;
}

export { allMemos } ;
