import Web3 from "web3";
declare const web3: Web3;

import BN from "bn.js";
import {Driver} from "./driver";
import chai from "chai";
chai.use(require('chai-bn')(BN));
chai.use(require('./matchers'));

const expect = chai.expect;

import {CommitteeProvider} from './committee-provider';


contract('elections-high-level-flows', async () => {

  it('handle delegation requests', async () => {
    const d = await Driver.new();

    const d1 = await d.newParticipant();
    const d2 = await d.newParticipant();

    const r = await d1.delegate(d2);
    expect(r).to.have.a.delegatedEvent({
      from: d1.address,
      to: d2.address
    });
  });

  it('sorts committee by stake', async () => {
    const stake100 = new BN(100);
    const stake200 = new BN(200);
    const stake300 = new BN(300);
    const stake500 = new BN(500);
    const stake1000 = new BN(1000);

    const d = await Driver.new(2, 4, stake100);
    const committeeProvider = new CommitteeProvider((web3.currentProvider as any).host, d.elections.address);

    // First validator registers

    const validatorStaked100 = d.newParticipant();
    let r = await validatorStaked100.stake(stake100);
    expect(r).to.have.a.stakedEvent();

    r = await validatorStaked100.registerAsValidator();
    expect(r).to.have.a.validatorRegisteredEvent({
      addr: validatorStaked100.address,
      ip: validatorStaked100.ip
    });
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [validatorStaked100.address],
      orbsAddrs: [validatorStaked100.orbsAddress],
      stakes: [stake100],
    });
    expect(r).to.have.a.topologyChangedEvent({
      orbsAddrs: [validatorStaked100.orbsAddress],
      ips: [validatorStaked100.ip]
    });

    const committeeFromAdapter = await committeeProvider.getCommitteeAsOf(r.receipt.blockNumber);
    expect(committeeFromAdapter).to.haveCommittee({
      addrs: [validatorStaked100.address.toLowerCase()],
      orbsAddrs: [validatorStaked100.orbsAddress.toLowerCase()],
      stakes: [stake100],
    });

    const validatorStaked200 = d.newParticipant();
    r = await validatorStaked200.stake(stake200);
    expect(r).to.have.a.totalStakeChangedEvent({addr: validatorStaked200.address, newTotal: stake200});

    r = await validatorStaked200.registerAsValidator();

    expect(r).to.have.a.validatorRegisteredEvent({
      addr: validatorStaked200.address,
      ip: validatorStaked200.ip,
    });
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [validatorStaked200.address, validatorStaked100.address],
      orbsAddrs: [validatorStaked200.orbsAddress, validatorStaked100.orbsAddress],
      stakes: [stake200, stake100]
    });
    expect(r).to.have.a.topologyChangedEvent({
      orbsAddrs: [validatorStaked200.orbsAddress, validatorStaked100.orbsAddress],
      ips: [validatorStaked200.ip, validatorStaked100.ip]
    });

    // A third validator registers high ranked

    const validatorStaked300 = d.newParticipant();
    r = await validatorStaked300.stake(stake300);
    expect(r).to.have.a.stakedEvent();

    r = await validatorStaked300.registerAsValidator();
    expect(r).to.have.a.validatorRegisteredEvent({
      addr: validatorStaked300.address,
      ip: validatorStaked300.ip
    });
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [validatorStaked300.address, validatorStaked200.address],
      orbsAddrs: [validatorStaked300.orbsAddress, validatorStaked200.orbsAddress],
      stakes: [stake300, stake200]
    });
    expect(r).to.have.a.topologyChangedEvent({
      orbsAddrs: [validatorStaked300.orbsAddress, validatorStaked200.orbsAddress, validatorStaked100.orbsAddress],
      ips: [validatorStaked300.ip, validatorStaked200.ip, validatorStaked100.ip]
    });

    r = await d.delegateMoreStake(stake300, validatorStaked200);
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [validatorStaked200.address, validatorStaked300.address],
      orbsAddrs: [validatorStaked200.orbsAddress, validatorStaked300.orbsAddress],
      stakes: [stake200.add(stake300), stake300]
    });
    expect(r).to.not.have.a.topologyChangedEvent();

    r = await d.delegateMoreStake(stake500, validatorStaked100);
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [validatorStaked100.address, validatorStaked200.address],
      orbsAddrs: [validatorStaked100.orbsAddress, validatorStaked200.orbsAddress],
      stakes: [stake100.add(stake500), stake500]
    });
    expect(r).to.not.have.a.topologyChangedEvent();

    // A new validator registers, stakes and enters the topology

    const inTopologyValidator = d.newParticipant();
    r = await inTopologyValidator.stake(stake100);
    expect(r).to.have.a.stakedEvent();
    r = await inTopologyValidator.registerAsValidator();
    expect(r).to.not.have.a.committeeChangedEvent();
    expect(r).to.have.a.topologyChangedEvent({
      orbsAddrs: [validatorStaked100.orbsAddress, validatorStaked200.orbsAddress, validatorStaked300.orbsAddress, inTopologyValidator.orbsAddress],
      ips: [validatorStaked100.ip, validatorStaked200.ip, validatorStaked300.ip, inTopologyValidator.ip],
    });

    // The bottom validator in the topology delegates more stake and switches places with the second to last
    // This does not change the committee nor the topology, so no event should be emitted
    r = await d.delegateMoreStake(201, inTopologyValidator);
    expect(r).to.not.have.a.committeeChangedEvent();
    expect(r).to.not.have.a.topologyChangedEvent();

    // make sure the order of validators really did change
    r = await d.elections.getTopology();
    expect(r).to.eql([validatorStaked100.address, validatorStaked200.address, inTopologyValidator.address, validatorStaked300.address]);

    // A new validator registers and stakes but does not enter the topology
    const outOfTopologyValidator = d.newParticipant();
    r = await outOfTopologyValidator.stake(stake100);
    expect(r).to.have.a.stakedEvent();
    r = await outOfTopologyValidator.registerAsValidator();
    expect(r).to.not.have.a.committeeChangedEvent();
    expect(r).to.not.have.a.topologyChangedEvent();

    // A new validator stakes enough to get to the top
    const validator = d.newParticipant();
    await validator.registerAsValidator();
    r = await validator.stake(stake1000); // now top of committee
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [validator.address, validatorStaked100.address],
      orbsAddrs: [validator.orbsAddress, validatorStaked100.orbsAddress],
      stakes: [stake1000, stake100.add(stake500)]
    });
    r = await validator.unstake(501); // now out of committee but still in topology
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [validatorStaked100.address, validatorStaked200.address],
      orbsAddrs: [validatorStaked100.orbsAddress, validatorStaked200.orbsAddress],
      stakes: [stake100.add(stake500), stake500]
    });
  });

});