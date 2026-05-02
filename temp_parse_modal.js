const parser = require('@babel/parser');
const fs = require('fs');
const text = fs.readFileSync('client/src/pages/HostRoomPage.jsx', 'utf8');
const start = text.indexOf('{showManageModal && managingSettings && (');
const end = text.indexOf('      {/* Confirm modal */}');
const block = text.slice(start, end);
try {
  parser.parse(`function X() { return (${block}); }`, {sourceType:'module', plugins:['jsx','classProperties','objectRestSpread','optionalChaining','nullishCoalescingOperator']});
  console.log('PARSE_OK');
} catch (err) {
  console.error(err.message);
  console.error(JSON.stringify(err.loc));
  const snippet = block.slice(Math.max(0, err.pos-80), err.pos+80);
  console.error(JSON.stringify(snippet));
}
