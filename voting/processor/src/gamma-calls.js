/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

let verbose = false;
if (process.env.VERBOSE) {
    verbose = true;
}

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function runQuery(orbsEnvironment, orbsVotingContractName, orbsContractFunctionJson, args) {
    let argsString = '';
    if (args && args.length > 0) {
        for (let i = 0; i < args.length; i++) {
            argsString += ` -arg${i + 1} ${args[i]}`;
        }
    }
    let command = `gamma-cli run-query ./gammacli-jsons/${orbsContractFunctionJson} -signer user1 -name ${orbsVotingContractName} ${argsString} -env ${orbsEnvironment}`;
    const {stdout, stderr } = await exec(command);
    if (stdout.length === 0 && stderr.length > 0){
        throw new Error(stderr);
    }
    let result = JSON.parse(stdout);

    // if (verbose) {
    //     console.log(`RUNNING: ${command}\n`, `OUTPUT:\n`, result);
    // }
    return result;
}

async function sendTransaction(orbsEnvironment, orbsVotingContractName, orbsContractFunctionJson, args) {
    let argsString = '';
    for (let i = 0;i < args.length;i++) {
        argsString += ` -arg${i+1} ${args[i]}`;
    }
    let command = `gamma-cli send-tx ./gammacli-jsons/${orbsContractFunctionJson} -signer user1 -name ${orbsVotingContractName} ${argsString} -env ${orbsEnvironment}`;
    const {stdout, stderr } = await exec(command);
    if (stdout.length === 0 && stderr.length > 0){
        throw new Error(stderr);
    }
    let result = JSON.parse(stdout);
    if (verbose) {
        console.log(`RUNNING: ${command}\n`, `OUTPUT:\n`, result);
    }
    return result;
}

async function runQueryParseNumberResult(orbsEnvironment, orbsVotingContractName, orbsContractFunctionJson, args) {
    let resultInt = 0;
    try {
        let result = await runQuery(orbsEnvironment, orbsVotingContractName, orbsContractFunctionJson, args);
        if (!(result.RequestStatus === "COMPLETED" && result.ExecutionResult === "SUCCESS")) {
            console.log(`Could not get valid number result for ${orbsContractFunctionJson}. Error OUTPUT:\n`, result);
            return 0;
        }
        resultInt = parseInt(result.OutputArguments[0].Value)
    } catch (e){
        console.log(`Could not get valid number result for ${orbsContractFunctionJson}. Error OUTPUT:\n` + e);
    }
    return resultInt;
}

async function runQueryParseStringResult(orbsEnvironment, orbsVotingContractName, orbsContractFunctionJson, args) {
    try {
        let result = await runQuery(orbsEnvironment, orbsVotingContractName, orbsContractFunctionJson, args);
        if (!(result.RequestStatus === "COMPLETED" && result.ExecutionResult === "SUCCESS")) {
            console.log(`Could not get valid number result for ${orbsContractFunctionJson}. Error OUTPUT:\n`, result);
            return 0;
        }
        return result.OutputArguments[0].Value
    } catch (e){
        console.log(`Could not get valid number result for ${orbsContractFunctionJson}. Error OUTPUT:\n` + e);
    }
    return "";
}

async function getCurrentBlockNumber(orbsEnvironment, orbsVotingContractName) {
    return await runQueryParseNumberResult(orbsEnvironment, orbsVotingContractName, 'get-current-block.json');
}

async function getProcessingStartBlockNumber(orbsEnvironment, orbsVotingContractName) {
    return await runQueryParseNumberResult(orbsEnvironment, orbsVotingContractName, 'get-processing-start-block.json');
}

module.exports = {
    runQuery,
    sendTransaction,
    getCurrentBlockNumber,
    getProcessingStartBlockNumber,
    runQueryParseNumberResult,
    runQueryParseStringResult
};
