import BN from "bn.js";
import chai from "chai";
chai.use(require('chai-bn')(BN));
const expect = chai.expect;

export const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

import Web3 from "web3";
import ElectionsContract = Contracts.ElectionsContract;
import ERC20Contract = Contracts.ERC20Contract;
import StakingContract = Contracts.StakingContract;
import SubscriptionsContract = Contracts.SubscriptionsContract;
import MonthlySubscriptionContract = Contracts.MonthlySubscriptionPlanContract;
import RewardsContract = Contracts.RewardsContract;
declare const web3: Web3;

export const DEFAULT_MINIMUM_STAKE = 100;
export const DEFAULT_COMMITTEE_SIZE = 2;
export const DEFAULT_TOPOLOGY_SIZE = 3;
export const DEFAULT_MAX_DELEGATION_RATIO = 10;
export const DEFAULT_VOTE_OUT_THRESHOLD = 80;
export const DEFAULT_VOTE_OUT_TIMEOUT = 24*60*60;

export class Driver {
    private participants: Participant[] = [];

    constructor(
        public accounts: string[],
        public elections: ElectionsContract,
        public erc20: ERC20Contract,
        public staking: StakingContract,
        public subscriptions: SubscriptionsContract,
        public rewards: RewardsContract
    ) {}

    static async new(maxCommitteeSize=DEFAULT_COMMITTEE_SIZE, maxTopologySize=DEFAULT_TOPOLOGY_SIZE, minimumStake:number|BN=DEFAULT_MINIMUM_STAKE, maxDelegationRatio=DEFAULT_MAX_DELEGATION_RATIO, voteOutThreshold=DEFAULT_VOTE_OUT_THRESHOLD, voteOutTimeout=DEFAULT_VOTE_OUT_TIMEOUT) {
        const accounts = await web3.eth.getAccounts();
        const erc20 = await artifacts.require('TestingERC20').new();
        const rewards = await artifacts.require('Rewards').new(erc20.address);
        const subscriptions = await artifacts.require('Subscriptions').new(rewards.address, erc20.address);
        const elections = await artifacts.require("Elections").new(maxCommitteeSize, maxTopologySize, minimumStake, maxDelegationRatio, voteOutThreshold, voteOutTimeout, rewards.address /* committee listener */);
        const staking = await artifacts.require("StakingContract").new(1 /* _cooldownPeriodInSec */, "0x0000000000000000000000000000000000000001" /* _migrationManager */, "0x0000000000000000000000000000000000000001" /* _emergencyManager */, elections.address /* IStakingListener */, erc20.address /* _token */);

        await rewards.setCommitteeProvider(elections.address);
        await rewards.setStakingContract(staking.address);
        await elections.setStakingContract(staking.address);

        return new Driver(accounts, elections, erc20, staking, subscriptions, rewards);
    }

    get contractsOwner() {
        return this.accounts[0];
    }

    get contractsNonOwner() {
        return this.accounts[1];
    }

    async newSubscriber(tier: string, monthlyRate:number|BN): Promise<MonthlySubscriptionContract> {
        const subscriber = await artifacts.require('MonthlySubscriptionPlan').new(this.subscriptions.address, this.erc20.address, tier, monthlyRate);
        await this.subscriptions.addSubscriber(subscriber.address);
        return subscriber;
    }

    newParticipant(): Participant { // consumes two addresses from accounts for each participant - ethereum address and an orbs address
        const v = new Participant(this.accounts[this.participants.length*2], this.accounts[this.participants.length*2+1], this);
        this.participants.push(v);
        return v
    }

    async delegateMoreStake(amount:number|BN, delegatee: Participant) {
        const delegator = this.newParticipant();
        await delegator.stake(new BN(amount));
        return await delegator.delegate(delegatee);
    }
}

export class Participant {
    public ip: string;
    private erc20: ERC20Contract;
    private staking: StakingContract;
    private elections: ElectionsContract;

    constructor(public address: string, public orbsAddress: string, driver: Driver) {
        this.ip = address.substring(0, 10).toLowerCase();
        this.erc20 = driver.erc20;
        this.staking = driver.staking;
        this.elections = driver.elections;
    }

    async stake(amount: number|BN) {
        await this.erc20.assign(this.address, amount);
        await this.erc20.approve(this.staking.address, amount, {from: this.address});
        return this.staking.stake(amount, {from: this.address});
    }

    async unstake(amount: number|BN) {
        return this.staking.unstake(amount, {from: this.address});
    }

    async delegate(to: Participant) {
        return this.elections.delegate(to.address, {from: this.address});
    }

    async registerAsValidator() {
        return await this.elections.registerValidator(this.ip, this.orbsAddress, {from: this.address});
    }

    async notifyReadyForCommittee() {
        return await this.elections.notifyReadyForCommittee({from: this.address});
    }
}

export async function expectRejected(promise: Promise<any>, msg?: string) {
    try {
        await promise;
    } catch (err) {
        // TODO verify correct error
        return
    }
    throw new Error(msg || "expected promise to reject")
}

