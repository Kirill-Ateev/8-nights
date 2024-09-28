import {
  Cell,
  OpenedContract,
  TonClient,
  WalletContractV4,
  beginCell,
} from 'ton';
import { KeyPair, mnemonicToPrivateKey } from 'ton-crypto';
import { collectionData } from '../contracts/NftCollection';

export type OpenedWallet = {
  contract: OpenedContract<WalletContractV4>;
  keyPair: KeyPair;
};

export async function openWallet(mnemonic: string[], testnet: boolean) {
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const toncenterBaseEndpoint: string = testnet
    ? 'https://testnet.toncenter.com'
    : 'https://toncenter.com';

  const client = new TonClient({
    endpoint: `${toncenterBaseEndpoint}/api/v2/jsonRPC`,
    apiKey: process.env.TONCENTER_API_KEY,
  });

  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  let contract = client.open(wallet);
  return { contract, keyPair };
}

function bufferToChunks(buff: Buffer, chunkSize: number) {
  const chunks: Buffer[] = [];
  while (buff.byteLength > 0) {
    chunks.push(buff.slice(0, chunkSize));
    buff = buff.slice(chunkSize);
  }
  return chunks;
}

function makeSnakeCell(data: Buffer): Cell {
  const chunks = bufferToChunks(data, 127);

  if (chunks.length === 0) {
    return beginCell().endCell();
  }

  if (chunks.length === 1) {
    return beginCell().storeBuffer(chunks[0]).endCell();
  }

  let curCell = beginCell();

  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];

    curCell.storeBuffer(chunk);

    if (i - 1 >= 0) {
      const nextCell = beginCell();
      nextCell.storeRef(curCell);
      curCell = nextCell;
    }
  }

  return curCell.endCell();
}

export function encodeOffChainContent(content: string) {
  let data = Buffer.from(content);
  const offChainPrefix = Buffer.from([0x01]);
  data = Buffer.concat([offChainPrefix, data]);
  return makeSnakeCell(data);
}

export function createChangeContentBody(params: collectionData): Cell {
  const body = beginCell();
  body.storeUint(4, 32); // Operation code for changing content

  // Store new collection content
  const newCollectionContent = encodeOffChainContent(
    params.collectionContentUrl
  );
  body.storeRef(newCollectionContent);

  // Store new common content
  const newCommonContent = encodeOffChainContent(params.commonContentUrl);
  body.storeRef(newCommonContent);

  return body.endCell();
}

export function createChangeContentBody2(collectionData: collectionData) {
  const body = beginCell();

  // Assuming operation code for changing content is 4
  const operationCode = 4;
  body.storeUint(operationCode, 32); // Store the operation code

  // Serialize and store the new collection content URL
  if (collectionData.collectionContentUrl) {
    const collectionContentCell = beginCell();
    collectionContentCell.storeBuffer(
      Buffer.from(collectionData.collectionContentUrl)
    );
    body.storeRef(collectionContentCell.endCell());
  }

  // Serialize and store the new common content URL
  // if (collectionData.commonContentUrl) {
  //   const commonContentCell = beginCell();
  //   commonContentCell.storeBuffer(Buffer.from(collectionData.commonContentUrl));
  //   body.storeRef(commonContentCell.endCell());
  // }

  return body.endCell();
}

/**
 * Serializes new collection content data into a message body for the smart contract.
 * @param {object} collectionData - The new content data for the NFT collection.
 * @returns {Cell} The message body as a Cell object.
 */
export function createChangeContentBody3(collectionData: collectionData) {
  const body = beginCell();

  // Operation code for changing content is 4
  body.storeUint(4, 32);

  // Serialize and store new collection content
  // Use the same method as in createDataCell to serialize the content
  const collectionContentCell = beginCell();
  const collectionContent = encodeOffChainContent(
    collectionData.collectionContentUrl
  );
  collectionContentCell.storeRef(collectionContent);

  body.storeRef(collectionContentCell);

  const royaltyBase = 1000;
  const royaltyFactor = Math.floor(collectionData.royaltyPercent * royaltyBase);

  const royaltyCell = beginCell();
  royaltyCell.storeUint(royaltyFactor, 16);
  royaltyCell.storeUint(royaltyBase, 16);
  royaltyCell.storeAddress(collectionData.royaltyAddress);
  body.storeRef(royaltyCell);

  return body.endCell();
}
