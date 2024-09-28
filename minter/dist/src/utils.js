"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChangeContentBody3 = exports.createChangeContentBody2 = exports.createChangeContentBody = exports.encodeOffChainContent = exports.openWallet = void 0;
const ton_1 = require("ton");
const ton_crypto_1 = require("ton-crypto");
function openWallet(mnemonic, testnet) {
    return __awaiter(this, void 0, void 0, function* () {
        const keyPair = yield (0, ton_crypto_1.mnemonicToPrivateKey)(mnemonic);
        const toncenterBaseEndpoint = testnet
            ? 'https://testnet.toncenter.com'
            : 'https://toncenter.com';
        const client = new ton_1.TonClient({
            endpoint: `${toncenterBaseEndpoint}/api/v2/jsonRPC`,
            apiKey: process.env.TONCENTER_API_KEY,
        });
        const wallet = ton_1.WalletContractV4.create({
            workchain: 0,
            publicKey: keyPair.publicKey,
        });
        let contract = client.open(wallet);
        return { contract, keyPair };
    });
}
exports.openWallet = openWallet;
function bufferToChunks(buff, chunkSize) {
    const chunks = [];
    while (buff.byteLength > 0) {
        chunks.push(buff.slice(0, chunkSize));
        buff = buff.slice(chunkSize);
    }
    return chunks;
}
function makeSnakeCell(data) {
    const chunks = bufferToChunks(data, 127);
    if (chunks.length === 0) {
        return (0, ton_1.beginCell)().endCell();
    }
    if (chunks.length === 1) {
        return (0, ton_1.beginCell)().storeBuffer(chunks[0]).endCell();
    }
    let curCell = (0, ton_1.beginCell)();
    for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i];
        curCell.storeBuffer(chunk);
        if (i - 1 >= 0) {
            const nextCell = (0, ton_1.beginCell)();
            nextCell.storeRef(curCell);
            curCell = nextCell;
        }
    }
    return curCell.endCell();
}
function encodeOffChainContent(content) {
    let data = Buffer.from(content);
    const offChainPrefix = Buffer.from([0x01]);
    data = Buffer.concat([offChainPrefix, data]);
    return makeSnakeCell(data);
}
exports.encodeOffChainContent = encodeOffChainContent;
function createChangeContentBody(params) {
    const body = (0, ton_1.beginCell)();
    body.storeUint(4, 32); // Operation code for changing content
    // Store new collection content
    const newCollectionContent = encodeOffChainContent(params.collectionContentUrl);
    body.storeRef(newCollectionContent);
    // Store new common content
    const newCommonContent = encodeOffChainContent(params.commonContentUrl);
    body.storeRef(newCommonContent);
    return body.endCell();
}
exports.createChangeContentBody = createChangeContentBody;
function createChangeContentBody2(collectionData) {
    const body = (0, ton_1.beginCell)();
    // Assuming operation code for changing content is 4
    const operationCode = 4;
    body.storeUint(operationCode, 32); // Store the operation code
    // Serialize and store the new collection content URL
    if (collectionData.collectionContentUrl) {
        const collectionContentCell = (0, ton_1.beginCell)();
        collectionContentCell.storeBuffer(Buffer.from(collectionData.collectionContentUrl));
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
exports.createChangeContentBody2 = createChangeContentBody2;
/**
 * Serializes new collection content data into a message body for the smart contract.
 * @param {object} collectionData - The new content data for the NFT collection.
 * @returns {Cell} The message body as a Cell object.
 */
function createChangeContentBody3(collectionData) {
    const body = (0, ton_1.beginCell)();
    // Operation code for changing content is 4
    body.storeUint(4, 32);
    // Serialize and store new collection content
    // Use the same method as in createDataCell to serialize the content
    const collectionContentCell = (0, ton_1.beginCell)();
    const collectionContent = encodeOffChainContent(collectionData.collectionContentUrl);
    collectionContentCell.storeRef(collectionContent);
    body.storeRef(collectionContentCell);
    const royaltyBase = 1000;
    const royaltyFactor = Math.floor(collectionData.royaltyPercent * royaltyBase);
    const royaltyCell = (0, ton_1.beginCell)();
    royaltyCell.storeUint(royaltyFactor, 16);
    royaltyCell.storeUint(royaltyBase, 16);
    royaltyCell.storeAddress(collectionData.royaltyAddress);
    body.storeRef(royaltyCell);
    return body.endCell();
}
exports.createChangeContentBody3 = createChangeContentBody3;
//# sourceMappingURL=utils.js.map