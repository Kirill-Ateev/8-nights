import * as dotenv from 'dotenv';

import { Address, SendMode, internal } from 'ton-core';

import { createChangeContentBody3, openWallet } from './utils';

dotenv.config();

async function init() {
  const wallet = await openWallet(process.env.MNEMONIC!.split(' '), true);

  console.log('Gets wallet seqno...');

  let address: Address = Address.parse(
    'EQBdioteRzlziir2QU7C_CSY0fQug405PRBHQZESswxy3xcO'
  );

  // вариант контента коллкции
  const collectionData = {
    ownerAddress: wallet.contract.address,
    royaltyPercent: 0.05, // 0.05 = 5%
    royaltyAddress: wallet.contract.address,
    nextItemIndex: 1,
    collectionContentUrl: `ipfs://bafybeicixfahmew733kasyriachum46fcvzwnzostlsmceemm5ufxvzmzz/collection.json`,
    commonContentUrl: `ipfs://bafybeibapoa6avhoag57dfk7vwhqanklzagy5uj3rmh6q2zsbtvv4e7tlz/`,
  };

  const newSeqno = await wallet.contract.getSeqno();
  console.log('SEQNO: ', newSeqno);

  const changeContentBody = createChangeContentBody3(collectionData);

  console.log('Change content...');

  await wallet.contract.sendTransfer({
    seqno: newSeqno,
    secretKey: wallet.keyPair.secretKey,
    messages: [
      internal({
        value: '0.05', // Adjust the value as required by the contract for this operation
        to: address,
        body: changeContentBody,
      }),
    ],
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
  });

  console.log('Change content COMPLETE');
}

void init();
