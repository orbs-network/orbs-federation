/* eslint-disable @typescript-eslint/no-use-before-define */
import { IOrbsRewardsService, IRewardsDistributionEvent, IStakingService } from 'orbs-pos-data';
import { useEffect } from 'react';
import { useBoolean, useStateful } from 'react-hanger';
import { useApi } from '../../services/ApiContext';
import { IRemoteService, TRewardsSummary } from '../../services/IRemoteService';
import { fullOrbsFromWeiOrbs } from '../../cryptoUtils/unitConverter';

export type TCompleteAddressInfoForRewardsPage = {
  distributionsHistory: IRewardsDistributionEvent[];
  // TODO : Break this to parts
  dng: any;
  staking: {
    stakedOrbs: number;
  };
  rewardsSummary: TRewardsSummary;
};

const emptyObject: TCompleteAddressInfoForRewardsPage = {
  distributionsHistory: [],
  dng: {},
  staking: {
    stakedOrbs: 0,
  },
  rewardsSummary: {
    validatorReward: 0,
    guardianReward: 0,
    delegatorReward: 0,
  },
};

export type TUseCompleteAddressInfoForRewardsPage = (
  address?: string,
) => { addressData: TCompleteAddressInfoForRewardsPage; errorLoading: boolean };

export const useCompleteAddressInfoForRewardsPage: TUseCompleteAddressInfoForRewardsPage = address => {
  const errorLoading = useBoolean(false);
  const addressData = useStateful<TCompleteAddressInfoForRewardsPage>(emptyObject);

  const { orbsRewardsService, remoteService, stakingService } = useApi();

  useEffect(() => {
    if (address) {
      readCompleteDataForAddress(address, orbsRewardsService, remoteService, stakingService)
        .then(addressData.setValue)
        .catch(errorLoading.setTrue);
    }
  }, [address, addressData.setValue, errorLoading.setTrue, orbsRewardsService, remoteService, stakingService]);

  if (!address) {
    return {
      addressData: emptyObject,
      errorLoading: false,
    };
  }

  return {
    addressData: addressData.value,
    errorLoading: errorLoading.value,
  };
};

const fetchRewardsHistory = async (address: string, orbsRewardsService: IOrbsRewardsService) => {
  return await orbsRewardsService.readRewardsDistributionsHistory(address);
};

const fetchDelegationAndGuardianInfo = async (address: string, remoteService: IRemoteService) => {
  const delegatorInfo = await remoteService.getCurrentDelegationInfo(address);
  let guardianInfo: any;
  let hasActiveDelegation: boolean;

  if (delegatorInfo.delegationType === 'Not-Delegated') {
    guardianInfo = {};
    hasActiveDelegation = false;
  } else {
    guardianInfo = await remoteService.getGuardianData(delegatorInfo.delegatedTo);
    hasActiveDelegation = true;
  }

  return { delegatorInfo, guardianInfo, hasActiveDelegation };
};

const fetchStakingInfo = async (address: string, stakingService: IStakingService) => {
  const stakedOrbsInWeiOrbs = await stakingService.readStakeBalanceOf(address);
  const fullStakedOrbs = fullOrbsFromWeiOrbs(stakedOrbsInWeiOrbs);
  return {
    stakedOrbs: fullStakedOrbs,
  };
};

const fetchRewardsSummary = async (address: string, remoteService: IRemoteService) => {
  const rewardsSummary = await remoteService.getRewards(address);
  return rewardsSummary;
};

const readCompleteDataForAddress = async (
  address: string,
  orbsRewardsService: IOrbsRewardsService,
  remoteService: IRemoteService,
  stakingService: IStakingService,
) => {
  const rewardsHistory = await fetchRewardsHistory(address, orbsRewardsService);
  const delegationAndGuardianInfo = await fetchDelegationAndGuardianInfo(address, remoteService);
  const staking = await fetchStakingInfo(address, stakingService);
  const rewardsSummary = await fetchRewardsSummary(address, remoteService);

  const addressData: TCompleteAddressInfoForRewardsPage = {
    distributionsHistory: rewardsHistory,
    dng: delegationAndGuardianInfo,
    staking,
    rewardsSummary,
  };

  return addressData;
};
