import * as dotenv from 'dotenv';

import { toNano } from 'ton-core';

import { NftCollection } from '../contracts/NftCollection';
import { NftItem } from '../contracts/NftItem';
import { waitSeqno } from './delay';
import { openWallet } from './utils';

dotenv.config();

async function init() {
  const wallet = await openWallet(process.env.MNEMONIC!.split(' '), false);

  console.log('Start deploy of nft collection...');
  const collectionData = {
    ownerAddress: wallet.contract.address,
    royaltyPercent: 0.05, // 0.05 = 5%
    royaltyAddress: wallet.contract.address,
    nextItemIndex: 1,
    collectionContentUrl: `ipfs://bafybeicixfahmew733kasyriachum46fcvzwnzostlsmceemm5ufxvzmzy/collection.json`,
    commonContentUrl: `ipfs://bafybeigxrdwfmfuunjkcju4zf6gke6coce5r4cx6xx5v2vzy5lodjhuhei/`,
  };
  const collection = new NftCollection(collectionData);
  let seqno = await collection.deploy(wallet);
  console.log(`Collection deployed: ${collection.address}`);
  await waitSeqno(seqno, wallet);

  // Deploy nft items
  // Количество файлов для минта, ВНИМАТЕЛЬНО. Возможно нужно переписать на подключение к контракту для продолжения минтинга
  const filesLength = 8;
  let index = 1;

  // пополнение баланса контракта
  seqno = await collection.topUpBalance(wallet, filesLength);
  await waitSeqno(seqno, wallet);
  console.log(`Balance top-upped`);

  for (let i = 1; i <= filesLength; i++) {
    console.log(`Start deploy of ${index} NFT`);
    const mintParams = {
      queryId: 0,
      itemOwnerAddress: wallet.contract.address,
      itemIndex: index,
      amount: toNano('0.05'),
      commonContentUrl: `${index}.json`,
    };
    const nftItem = new NftItem(collection);
    seqno = await nftItem.deploy(wallet, mintParams);
    console.log(`Successfully deployed ${index} NFT`);
    await waitSeqno(seqno, wallet);
    index++;
  }

  //   console.log('Start deploy of new marketplace  ');
  //   const marketplace = new NftMarketplace(wallet.contract.address);
  //   seqno = await marketplace.deploy(wallet);
  //   await waitSeqno(seqno, wallet);
  //   console.log('Successfully deployed new marketplace');

  //   const nftToSaleAddress = await NftItem.getAddressByIndex(
  //     collection.address,
  //     0
  //   );
  //   const saleData: GetGemsSaleData = {
  //     isComplete: false,
  //     createdAt: Math.ceil(Date.now() / 1000),
  //     marketplaceAddress: marketplace.address,
  //     nftAddress: nftToSaleAddress,
  //     nftOwnerAddress: null,
  //     fullPrice: toNano('10'),
  //     marketplaceFeeAddress: wallet.contract.address,
  //     marketplaceFee: toNano('1'),
  //     royaltyAddress: wallet.contract.address,
  //     royaltyAmount: toNano('0.5'),
  //   };
  //   const nftSaleContract = new NftSale(saleData);
  //   seqno = await nftSaleContract.deploy(wallet);
  //   await waitSeqno(seqno, wallet);

  //   await NftItem.transfer(wallet, nftToSaleAddress, nftSaleContract.address);
}

void init();
