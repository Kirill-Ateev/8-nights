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
const utils_1 = require("./utils");
dotenv.config();
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const wallet = yield (0, utils_1.openWallet)(process.env.MNEMONIC.split(' '), true);
        console.log('Gets wallet seqno...');
        let address = ton_core_1.Address.parse('EQBdioteRzlziir2QU7C_CSY0fQug405PRBHQZESswxy3xcO');
        // вариант контента коллкции
        const collectionData = {
            ownerAddress: wallet.contract.address,
            royaltyPercent: 0.05, // 0.05 = 5%
            royaltyAddress: wallet.contract.address,
            nextItemIndex: 1,
            collectionContentUrl: `ipfs://bafybeicixfahmew733kasyriachum46fcvzwnzostlsmceemm5ufxvzmzz/collection.json`,
            commonContentUrl: `ipfs://bafybeibapoa6avhoag57dfk7vwhqanklzagy5uj3rmh6q2zsbtvv4e7tlz/`,
        };
        const newSeqno = yield wallet.contract.getSeqno();
        console.log('SEQNO: ', newSeqno);
        const changeContentBody = (0, utils_1.createChangeContentBody3)(collectionData);
        console.log('Change content...');
        yield wallet.contract.sendTransfer({
            seqno: newSeqno,
            secretKey: wallet.keyPair.secretKey,
            messages: [
                (0, ton_core_1.internal)({
                    value: '0.05', // Adjust the value as required by the contract for this operation
                    to: address,
                    body: changeContentBody,
                }),
            ],
            sendMode: ton_core_1.SendMode.PAY_GAS_SEPARATELY + ton_core_1.SendMode.IGNORE_ERRORS,
        });
        console.log('Change content COMPLETE');
    });
}
void init();
//# sourceMappingURL=changeContent.js.map