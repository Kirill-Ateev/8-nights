"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const dotenv = __importStar(require("dotenv"));
const ton_core_1 = require("ton-core");
const NftCollection_1 = require("../contracts/NftCollection");
const NftItem_1 = require("../contracts/NftItem");
const delay_1 = require("./delay");
const utils_1 = require("./utils");
dotenv.config();
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const wallet = yield (0, utils_1.openWallet)(process.env.MNEMONIC.split(' '), false);
        //   console.log('Started uploading images to IPFS...');
        //   const imagesIpfsHash = await uploadFolderToIPFS(imagesFolderPath);
        //   console.log(
        //     `Successfully uploaded the pictures to ipfs: https://gateway.pinata.cloud/ipfs/${imagesIpfsHash}`
        //   );
        //   console.log('Started uploading metadata files to IPFS...');
        //   await updateMetadataFiles(metadataFolderPath, imagesIpfsHash);
        //   const metadataIpfsHash = await uploadFolderToIPFS(metadataFolderPath);
        //   console.log(
        //     `Successfully uploaded the metadata to ipfs: https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}`
        //   );
        console.log('Start deploy of nft collection...');
        const collectionData = {
            ownerAddress: wallet.contract.address,
            royaltyPercent: 0.05, // 0.05 = 5%
            royaltyAddress: wallet.contract.address,
            nextItemIndex: 1,
            // тут последний вариант collection.json метадаты (НУЖНО ИЗМЕНЯТЬ СВОЙСТВА, ДЛЯ НОВОГО КОНТРАКТА!)
            collectionContentUrl: `ipfs://bafybeicixfahmew733kasyriachum46fcvzwnzostlsmceemm5ufxvzmzy/collection.json`,
            commonContentUrl: `ipfs://bafybeibapoa6avhoag57dfk7vwhqanklzagy5uj3rmh6q2zsbtvv4e7tlm/`,
        };
        const collection = new NftCollection_1.NftCollection(collectionData);
        let seqno = yield collection.deploy(wallet);
        console.log(`Collection deployed: ${collection.address}`);
        yield (0, delay_1.waitSeqno)(seqno, wallet);
        // Deploy nft items
        // Количество файлов для минта, ВНИМАТЕЛЬНО. Возможно нужно переписать на подключение к контракту для продолжения минтинга
        const filesLength = 8;
        let index = 1;
        // пополнение баланса контракта
        seqno = yield collection.topUpBalance(wallet, filesLength);
        yield (0, delay_1.waitSeqno)(seqno, wallet);
        console.log(`Balance top-upped`);
        for (let i = 1; i <= filesLength; i++) {
            console.log(`Start deploy of ${index} NFT`);
            const mintParams = {
                queryId: 0,
                itemOwnerAddress: wallet.contract.address,
                itemIndex: index,
                amount: (0, ton_core_1.toNano)('0.05'),
                commonContentUrl: `${index}.json`,
            };
            const nftItem = new NftItem_1.NftItem(collection);
            seqno = yield nftItem.deploy(wallet, mintParams);
            console.log(`Successfully deployed ${index} NFT`);
            yield (0, delay_1.waitSeqno)(seqno, wallet);
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
    });
}
void init();
//# sourceMappingURL=app.js.map