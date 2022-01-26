import { BigNumber, BigNumberish, Signer } from 'ethers'
import { AToken__factory, FutureVault, FutureVault__factory } from '@apwine/protocol'
import { Provider } from '@ethersproject/providers'
import range from 'ramda/src/range'
import { Token, TokenAmount } from '@uniswap/sdk'
import { AMM, AMMRegistry__factory, AMM__factory } from '@apwine/amm'
import {
  getAMMRegistryContract,
  getControllerContract,
  getFutureVaultContract,
  getRegistryContract,
  getTokencontract
} from './contracts'
import { error, getAddress, getNetworkChainId, getNetworkConfig } from './utils/general'
import { FutureAggregate, Network, SDKFunctionReturnType, Transaction } from './types'

export const fetchFutureAggregateFromIndex = async (
  signerOrProvider: Signer | Provider,
  network: Network,
  index: number
) => {
  const registry = getRegistryContract(signerOrProvider, network)
  const futureAddress = getAddress(
    await registry.getFutureVaultAt(BigNumber.from(index))
  )

  return fetchFutureAggregateFromAddress(signerOrProvider, network, futureAddress)
}

export const fetchFutureAggregateFromAddress = async (
  signerOrProvider: Signer | Provider,
  network: Network,
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

export const fetchAllFutureAggregates = async (signerOrProvider: Signer | Provider, network: Network, amm: AMM) => {
  const currentPeriodIndex = (await amm.currentPeriodIndex()).toNumber()
  return Promise.all(range(0, currentPeriodIndex).map((periodIndex) => fetchFutureAggregateFromIndex(signerOrProvider, network, periodIndex)))
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

export const fetchAMM = async (signerOrProvider: Signer | Provider, network: Network, future: FutureVault) => {
  const ammRegistry = AMMRegistry__factory.connect(getNetworkConfig(network).AMM_ROUTER, signerOrProvider)
  const ammAddress = await ammRegistry.getFutureAMMPool(future.address)

  return AMM__factory.connect(ammAddress, signerOrProvider)
}

export const fetchAllAMMs = async (signerOrProvider: Signer | Provider, network: Network) => {
  const ammRegistry = getAMMRegistryContract(signerOrProvider, network)
  const vaults = await fetchAllFutureVaults(signerOrProvider, network)

  const ammAddresses = await Promise.all(vaults.map((vault) => ammRegistry.getFutureAMMPool(vault.address)))

  return ammAddresses.map((address) => AMM__factory.connect(address, signerOrProvider))
}

export const withdraw = async (
  signer: Signer,
  network: Network,
  future: FutureVault,
  amount: BigNumberish
): Promise<SDKFunctionReturnType<Transaction>> => {
  if (!signer) {
    return error('NoSigner')
  }

  const controller = await getControllerContract(signer, network)
  const transaction = await controller.withdraw(future.address, amount)

  return { transaction }
}

export const approve = async (signer: Signer, spender: string, tokenAddress:string, amount: BigNumberish): Promise<SDKFunctionReturnType<Transaction>> => {
  if (!signer) {
    return error('NoSigner')
  }

  const token = getTokencontract(signer, tokenAddress)
  const transaction = await token.approve(spender, amount)

  return { transaction }
}

export const fetchAllowance = async (signerOrProvider: Signer | Provider, network: Network, owner: string, spender: string, tokenAddress: string) => {
  const t = getTokencontract(signerOrProvider, tokenAddress)
  const allowance = await t.allowance(owner, spender)
  const decimals = await t.decimals()
  const token = new Token(getNetworkChainId(network), t.address, decimals)

  return new TokenAmount(token, allowance.toBigInt())
}

export const updateAllowance = async (signer: Signer, spender: string, tokenAddress: string, amount: BigNumberish): Promise<SDKFunctionReturnType<Transaction>> => {
  if (!signer) {
    return error('NoSigner')
  }

  const token = getTokencontract(signer, tokenAddress)
  const bignumberAmount = BigNumber.from(amount)

  const transaction = await (bignumberAmount.isNegative()
    ? token.decreaseAllowance(spender, bignumberAmount)
    : token.increaseAllowance(spender, bignumberAmount.abs()))

  return {
    transaction
  }
}

export const deposit = async (
  signer: Signer,
  network: Network,
  future: FutureVault,
  amount: BigNumberish
): Promise<SDKFunctionReturnType<Transaction>> => {
  if (!signer) {
    return error('NoSigner')
  }

  const controller = await getControllerContract(signer, network)
  const transaction = await controller.deposit(future.address, amount)

  return { transaction }
}

export const isApprovalNecessary = async (signerOrProvider: Signer | Provider, account: string, spender: string, tokenAddress:string, amount: BigNumberish) => {
  const token = AToken__factory.connect(tokenAddress, signerOrProvider)

  const allowance = await token.allowance(account, spender)

  return allowance.lt(amount)
}
