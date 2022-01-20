import { BigNumber, BigNumberish, Signer } from 'ethers'
import { AToken__factory, FutureVault, FutureVault__factory, FutureYieldToken, FutureYieldToken__factory, IERC20, IERC20__factory, PT, PT__factory } from '@apwine/protocol'
import { Provider } from '@ethersproject/providers'
import range from 'ramda/src/range'
import { Token, TokenAmount } from '@uniswap/sdk'
import { AMM, AMM__factory } from '@apwine/amm'
import {
  getAMMRegistryContract,
  getControllerContract,
  getFutureVaultContract,
  getRegistryContract,
  getTokencontract
} from './contracts'
import { error, getAddress } from './utils/general'
import { CHAIN_IDS, Network } from './constants'
import pools from './utils/pools'
import { APWToken, PairId, SDKFunctionReturnType, Transaction } from '.'

export const fetchFutureAggregateFromIndex = async (
  network: Network,
  signerOrProvider: Signer | Provider,
  index: number
) => {
  const registry = getRegistryContract(signerOrProvider, network)
  const futureAddress = getAddress(
    await registry.getFutureVaultAt(BigNumber.from(index))
  )

  return fetchFutureAggregateFromAddress(signerOrProvider, network, futureAddress)
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

export const fetchAMMs = async (signer: Signer | undefined, network: Network) => {
  if (!signer) {
    return []
  }
  const ammRegistry = getAMMRegistryContract(signer, network)
  const vaults = await fetchAllFutureVaults(signer, network)

  const ammAddresses = await Promise.all(vaults.map((vault) => ammRegistry.getFutureAMMPool(vault.address)))

  return ammAddresses.map((address) => AMM__factory.connect(address, signer))
}

export const withdraw = async (
  signer: Signer | undefined,
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

export const approve = async (signer: Signer | undefined, spender: string, tokenAddress:string, amount: BigNumberish): Promise<SDKFunctionReturnType<Transaction>> => {
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
  const token = new Token(CHAIN_IDS[network], t.address, decimals)

  return new TokenAmount(token, allowance.toBigInt())
}

export const updateAllowance = async (signer: Signer | undefined, spender: string, tokenAddress: string, amount: BigNumberish): Promise<SDKFunctionReturnType<Transaction>> => {
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
  signer: Signer | undefined,
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

export const getPoolTokens = async (signerOrProvider: Signer | Provider, amm: AMM, pairId: PairId) => {
  const [ptAddress, underlyingAddress, fytAddress] = await Promise.all([
    amm.getPTAddress(),
    amm.getUnderlyingOfIBTAddress(),
    amm.getFYTAddress()
  ])

  const tokens = {
    PT: PT__factory.connect(ptAddress, signerOrProvider),
    Underlying: IERC20__factory.connect(underlyingAddress, signerOrProvider),
    FYT: FutureYieldToken__factory.connect(fytAddress, signerOrProvider)
  }

  const pool = pools.findEdge((edge) => pools.getEdgeAttributes(edge).pair === pairId)

  const token1 = pools.source(pool) as APWToken
  const token2 = pools.target(pool) as APWToken

  return [
    tokens[token1],
    tokens[token2]
  ]
}
