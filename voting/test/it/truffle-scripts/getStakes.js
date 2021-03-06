/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const numberOfStakeHolders = process.env.NUMBER_OF_STAKEHOLDERS_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!erc20ContractAddress) {
      throw("missing env variable ERC20_CONTRACT_ADDRESS");
    }

    if (!numberOfStakeHolders) {
      throw("missing env variable NUMBER_OF_STAKEHOLDERS_ETHEREUM");
    }

    const ercToken = artifacts.require('IERC20');
    const instance = await ercToken.at(erc20ContractAddress);

    let accounts = await web3.eth.getAccounts();
    let txs = [];
    for (let i = 0;i < numberOfStakeHolders;i++) {
      txs.push(instance.balanceOf(accounts[i]).then(balance => {
        return { Index: i, Balance: "" + balance };
      }));
    }

    let balances = await Promise.all(txs);

    console.log(JSON.stringify({ balances }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
