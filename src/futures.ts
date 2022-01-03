import { BigNumber, BigNumberish, Signer } from 'ethers'
import { AToken__factory, FutureVault, FutureVault__factory } from '@apwine/protocol'
import { Provider } from '@ethersproject/providers'
import range from 'ramda/src/range'
import {
  getAMMContract,
  getControllerContract,
  getFutureVaultContract,
  getRegistryContract
} from './contracts'
import { Network } from './constants'
import { error, getAddress } from './utils'

export const fetchFutureAggregateFromIndex = async (
  network: Network,
  signerOrProvider: Signer | Provider,
  index: number
) => {
  const registry = getRegistryContract(signerOrProvider, network)
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
  const controller = await getControllerContract(signerOrProvider, network)
  const futureContract = getFutureVaultContract(signerOrProvider, address)
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

export const fetchAllFutureAggregates = async (signerOrProvider: Signer | Provider, network: Network) => {
  const amm = getAMMContract(signerOrProvider, network)
  const currentPeriodIndex = await (await amm.currentPeriodIndex()).toNumber()
  return Promise.all(range(0, currentPeriodIndex).map((periodIndex) => fetchFutureAggregateFromIndex(network, signerOrProvider, periodIndex)))
}

export const fetchAllFutureVaults = async (
  signerOrProvider: Signer | Provider,
  network: Network
) => {
  const registry = getRegistryContract(signerOrProvider, network)
  const count = (await registry.futureVaultCount()).toNumber()

  const futureVaultAddresses = await Promise.all(
    range(0, count).map(index => registry.getFutureVaultAt(index))
  )

  return futureVaultAddresses.map(address =>
    FutureVault__factory.connect(address, signerOrProvider)
  )
}

export const withdraw = async (
  signer: Signer | undefined,
  network: Network,
  future: FutureVault,
  amount: BigNumberish
) => {
  if (!signer) {
    return error('NoSigner')
  }

  const controller = await getControllerContract(signer, network)

  return controller.withdraw(future.address, amount)
}

export const fetchFutureToken = async (signerOrProvider: Signer | Provider, future: FutureVault) => {
  const ibtAddress = await future.getIBTAddress()

  return AToken__factory.connect(ibtAddress, signerOrProvider)
}

export const approve = async (signer: Signer | undefined, spender: string, future: FutureVault, amount: BigNumberish) => {
  if (!signer) {
    return error('NoSigner')
  }

  const token = await fetchFutureToken(signer, future)

  return token.approve(spender, amount)
}

export const fetchAllowance = async (signerOrProvider: Signer | Provider, owner: string, spender: string, future: FutureVault) => {
  const token = await fetchFutureToken(signerOrProvider, future)

  return token.allowance(owner, spender)
}

export const updateAllowance = async (signer: Signer | undefined, spender: string, future: FutureVault, amount: BigNumberish) => {
  if (!signer) {
    return error('NoSigner')
  }

  const token = await fetchFutureToken(signer, future)
  const bignumberAmount = BigNumber.from(amount)

  if (bignumberAmount.isNegative()) {
    return token.decreaseAllowance(spender, bignumberAmount)
  }

  return token.increaseAllowance(spender, bignumberAmount.abs())
}

export const deposit = async (
  signer: Signer | undefined,
  network: Network,
  future: FutureVault,
  amount: BigNumberish

) => {
  if (!signer) {
    return error('NoSigner')
  }

  const controller = await getControllerContract(signer, network)

  return controller.deposit(future.address, amount)
}
