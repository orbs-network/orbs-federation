const DateTime = artifacts.require('./DateTime.sol');
const DateTimeWrapper = artifacts.require('../test/helpers/DateTimeWrapper.sol');
const SubscriptionManagerMock = artifacts.require('../test/SubscriptionManagerMock.sol');

module.exports = async (deployer, network) => {
  // We're only using these migrations during development and testing.
  if (network !== 'development' && network !== 'coverage') {
    return;
  }

  await deployer.deploy(DateTime);
  await deployer.link(DateTime, DateTimeWrapper);
  await deployer.link(DateTime, SubscriptionManagerMock);
};
