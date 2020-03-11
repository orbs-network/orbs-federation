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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
var bn_js_1 = __importDefault(require("bn.js"));
var driver_1 = require("./driver");
var chai_1 = __importDefault(require("chai"));
var rimraf_1 = __importDefault(require("rimraf"));
chai_1.default.use(require("chai-bn")(bn_js_1.default));
chai_1.default.use(require("./matchers"));
var expect = chai_1.default.expect;
var rmDir = function (path) {
    return new Promise(function (resolve) { return rimraf_1.default(path, function () { return resolve(); }); });
};
describe("subscriptions aggregation", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        it("reads VCs from SubscriptionChanged events", function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, numnberOfVChains, monthlyRate, firstPayment, subscriber, _i, _a, i, appOwner, r, events, vcs;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _b.sent();
                        numnberOfVChains = 5;
                        monthlyRate = new bn_js_1.default(1000);
                        firstPayment = monthlyRate.mul(new bn_js_1.default(2));
                        return [4 /*yield*/, d.newSubscriber("defaultTier", monthlyRate)];
                    case 2:
                        subscriber = _b.sent();
                        _i = 0, _a = new Array(numnberOfVChains);
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 8];
                        i = _a[_i];
                        appOwner = d.newParticipant();
                        return [4 /*yield*/, d.erc20.assign(appOwner.address, firstPayment)];
                    case 4:
                        _b.sent(); // TODO extract assign+approve to driver in two places
                        return [4 /*yield*/, d.erc20.approve(subscriber.address, firstPayment, {
                                from: appOwner.address
                            })];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, subscriber.createVC(firstPayment, "main", {
                                from: appOwner.address
                            })];
                    case 6:
                        r = _b.sent();
                        expect(r).to.have.subscriptionChangedEvent();
                        _b.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8: return [4 /*yield*/, d.subscriptions.web3Contract.getPastEvents("SubscriptionChanged", {
                            fromBlock: 0,
                            toBlock: "latest"
                        })];
                    case 9:
                        events = _b.sent();
                        vcs = events.map(function (event) { return event.returnValues.vcid; });
                        expect(vcs.length).to.eql(numnberOfVChains);
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
// async function getEventsPaged(
//   contract: Contract,
//   eventType: string,
//   fromBlock: number,
//   toBlock: number,
//   pageSize: number
// ): Promise<Array<EventData>> {
//   const result: Array<EventData> = [];
//   for (let currBlock = fromBlock; currBlock < toBlock; currBlock += pageSize) {
//     const options = {
//       fromBlock: currBlock,
//       toBlock: Math.min(currBlock + pageSize, toBlock)
//     };
//     try {
//       const events = await contract.getPastEvents(
//         "SubscriptionChanged",
//         options
//       );
//       result.push(...events);
//     } catch (err) {
//       if (pageSize > 5) {
//         // assume there are too many events
//         const events = await getEventsPaged(
//           contract,
//           eventType,
//           options.fromBlock,
//           options.toBlock,
//           Math.floor(pageSize / 5)
//         );
//         result.push(...events);
//       } else throw err;
//     }
//   }
//   return result;
// }