import { BigNumber, BigNumberish, Signer } from 'ethers'
import { FutureVault, FutureVault__factory } from '@apwine/protocol'
import { Provider } from '@ethersproject/providers'
import range from 'ramda/src/range'
import {
  getAMMContract,
  getControllerContract,
  getFutureVaultContract,
  getRegistryContract
} from './contracts'
import { Network } from './constants'
import { getAddress } from './utils'

export const fetchFutureAggregateFromIndex = async (
  network: Network,
  signerOrProvider: Signer | Provider,
  index: number
) => {
  const registry = getRegistryContract(network, signerOrProvider)
  const futureAddress = getAddress(
    await registry.getFutureVaultAt(BigNumber.from(index))
  )

  return fetchFutureAggregateFromAddress(network, signerOrProvider, futureAddress)
}

export type FutureAggregate = {
  address: string
  ibtAddress: string
  apwibtAddress: string
  period: BigNumber
  platform: string
  depositsPaused: boolean
  withdrawalsPaused: boolean
  nextPeriodIndex: BigNumber
  nextPeriodTimestamp: BigNumber
 }

export const fetchFutureAggregateFromAddress = async (
  network: Network,
  signerOrProvider: Signer | Provider,
  address: string
): Promise<FutureAggregate> => {
  const controller = await getControllerContract(network, signerOrProvider)
  const futureContract = getFutureVaultContract(address, signerOrProvider)
  const [
    ibtAddress,
    apwibtAddress,
    period,
    platform,
    depositsPaused,
    withdrawalsPaused,
    nextPeriodIndex
  ] = await Promise.all([
    futureContract.getIBTAddress().then(getAddress),
    futureContract.getPTAddress().then(getAddress),
    futureContract.PERIOD_DURATION(),
    futureContract.PLATFORM_NAME(),
    controller.isDepositsPaused(address),
    controller.isWithdrawalsPaused(address),
    futureContract.getNextPeriodIndex()
  ])

  const nextPeriodTimestamp = await controller.getNextPeriodStart(period)

  return {
    address,
    ibtAddress,
    apwibtAddress,
    period,
    platform,
    depositsPaused,
    withdrawalsPaused,
    nextPeriodIndex,
    nextPeriodTimestamp
  }
}

export const fetchAllFutureAggregates = async (network: Network, signerOrProvider: Signer | Provider) => {
  const amm = getAMMContract(network, signerOrProvider)
  const currentPeriodIndex = await (await amm.currentPeriodIndex()).toNumber()
  return Promise.all(range(0, currentPeriodIndex).map((periodIndex) => fetchFutureAggregateFromIndex(network, signerOrProvider, periodIndex)))
}

export const fetchAllFutureVaults = async (
  network: Network,
  signerOrProvider: Signer | Provider
) => {
  const registry = getRegistryContract(network, signerOrProvider)
  const count = (await registry.futureVaultCount()).toNumber()

  const futureVaultAddresses = await Promise.all(
    range(0, count).map(index => registry.getFutureVaultAt(index))
  )

  return futureVaultAddresses.map(address =>
    FutureVault__factory.connect(address, signerOrProvider)
  )
}

export const withdraw = async (
  network: Network,
  signerOrProvider: Signer | Provider,
  future: FutureVault,
  amount: BigNumberish
) => {
  const controller = await getControllerContract(network, signerOrProvider)

  return controller.deposit(future.address, amount)
}

export const deposit = async (
  network: Network,
  signerOrProvider: Signer | Provider,
  future: FutureVault,
  amount: BigNumberish
) => {
  const controller = await getControllerContract(network, signerOrProvider)

  return controller.deposit(future.address, amount)
}
