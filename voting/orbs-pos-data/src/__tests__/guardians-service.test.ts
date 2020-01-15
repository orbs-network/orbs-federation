/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { GuardiansService } from '../services/GuardiansService';
import { VOTING_CONTRACT_ADDRESS } from '../contracts-adresses';
import votingContractJSON from '../contracts/OrbsVoting.json';

class Web3Mock {
  methodParams = (methodName: string) => this.eth.Contract.mock.results[0].value.methods[methodName].mock.calls[0];
  optionValue = (optionName: string) => this.eth.Contract.mock.results[0].value.options[optionName];
  getStakeBalanceOfResult: string = null;
  latestInstance: any = null;

  eth = {
    Contract: jest.fn().mockImplementation((abi, address) => {
      this.latestInstance = {
        methods: {
          delegate: jest.fn(amount => ({ send: jest.fn() })),
          getStakeBalanceOf: jest.fn(stakeOwner => ({
            call: jest.fn(() => this.getStakeBalanceOfResult),
          })),
        },
        options: {
          from: '',
        },
      };
      return this.latestInstance;
    }),
  };
}

describe('Guardians service', () => {
  let guardiansService: GuardiansService;
  let web3Mock: Web3Mock;

  beforeEach(() => {
    web3Mock = new Web3Mock();
    guardiansService = new GuardiansService(web3Mock as any);
  });

  it('should set the default "from" address', async () => {
    const accountAddress = '0xbDBE6E5030f3e769FaC89AEF5ac34EbE8Cf95a76';
    await guardiansService.setFromAccount(accountAddress);

    expect(web3Mock.optionValue('from')).toEqual(accountAddress);
  });

  it('should initialize the contract with the right abi and the contract address', async () => {
    expect(web3Mock.eth.Contract).toBeCalledWith(votingContractJSON.abi, VOTING_CONTRACT_ADDRESS);
  });

  it('should call "delegate" with the given guardian address', async () => {
    const result = await guardiansService.selectGuardian('DUMMY_GUARDIAN_ADDRESS');
    expect(web3Mock.methodParams('delegate')).toEqual(['DUMMY_GUARDIAN_ADDRESS']);
  });

  // it('should call "getStakeBalanceOf" with the owner address', async () => {
  //   web3Mock.getStakeBalanceOfResult = '123';
  //   const actual = await guardiansService.getStakeBalanceOf('DUMMY_ADDRESS');

  //   expect(web3Mock.methodParams('getStakeBalanceOf')).toEqual(['DUMMY_ADDRESS']);
  //   expect(actual).toEqual('123');
  // });

  it('should set options.from address to the given address', async () => {
    expect(web3Mock.latestInstance.options.from).toBeUndefined;
    await guardiansService.setFromAccount('DUMMY_ADDRESS');
    expect(web3Mock.latestInstance.options.from).toEqual('DUMMY_ADDRESS');
  });
});