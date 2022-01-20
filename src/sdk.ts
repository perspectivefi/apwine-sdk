import { BigNumberish, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { providers } from '@0xsequence/multicall'
import { Controller, FutureVault, Registry } from '@apwine/protocol'
import { AMM, AMMRegistry, AMMRouter } from '@apwine/amm'
import { Network, PairId, APWToken } from './constants'

import {
  deposit,
  fetchAllFutureAggregates,
  fetchAllFutureVaults,
  fetchFutureAggregateFromIndex,
  fetchFutureAggregateFromAddress,
  withdraw,
  fetchFutureToken,
  updateAllowance,
  approve,
  fetchAllowance,
  fetchAMMs
} from './futures'
import { addLiquidity, approveLPForAll, fetchAllLPTokenPools, fetchLPTokenPool, isLPApprovedForAll, removeLiquidity } from './lp'
import {
  getAMMRegistryContract,
  getAMMRouterContract,
  getControllerContract,
  getRegistryContract
} from './contracts'

import { findPoolPath, findTokenPath } from './utils/swap'
import { swap, SwapOptions, SwapParams } from './swap'
import { WithOptional } from './utils/general'

type ConstructorProps = {
  network: Network
  provider: Provider
  signer?: Signer
  defaultSlippage?: number
}

type ConstructorOptions = {
  initialize: boolean
}

class APWineSDK {
  ready: ReturnType<APWineSDK['initialize']> | boolean = false
  defaultSlippage: number

  network: Network
  provider: Provider
  signer?: Signer

  AMMRegistry: AMMRegistry
  Registry: Registry
  Router: AMMRouter

  // async props
  AMMs: AMM[] = []
  Controller: Controller | null = null

  /**
   *Creates a new APWine SDK instance.
   * @param param0 - An object containing a network a spender,  a provider
     and an optional signer.
   */
  constructor({ network, signer, provider, defaultSlippage = 0.5 }: ConstructorProps, options: ConstructorOptions = { initialize: true }) {
    this.provider = new providers.MulticallProvider(provider)
    this.defaultSlippage = defaultSlippage
    this.network = network

    if (signer) {
      this.signer = signer
    }

    this.AMMRegistry = getAMMRegistryContract(provider, network)
    this.Registry = getRegistryContract(provider, network)
    this.Router = getAMMRouterContract(provider, network)

    if (options.initialize) {
      this.initialize()
    }
  }

  /**
   * Initializes all asynchronous properties, and sets the resulting promise in sdkInstance.ready
   * @returns - A Promise of a collection of asynchronous props wrapped into Promise.all
   */
  async initialize() {
    const ready = Promise.all([
      getControllerContract(this.provider, this.network).then(
        controller => (this.Controller = controller)
      ),
      fetchAMMs(this.provider, this.network).then((amms) => (this.AMMs = amms))
    ])

    this.ready = ready
    return ready
  }

  /**
  * Updates the provider on an existing APWineSDK instance.
   * @param provider - A provider to connect to the ethereum blockchain.
   */
  updateProvider(provider: Provider) {
    this.provider = provider
  }

  /**
   * Updates the network on an existing APWineSDK instance.
   * @param network - The network on which the SDK instance operates
   */
  updateNetwork(network: Network) {
    this.network = network
  }

  /**
  * Updates the signer on an existing APWineSDK instance.
   * @param signer - A transaction signer.
   */
  updateSigner(signer: Signer) {
    this.signer = signer
  }

  /**
   * Set default slippage tolerance for the SDK instance.
   * @param slippage - default slippage to be set.
   */
  updateSlippageTolerance(slippage: number) {
    this.defaultSlippage = slippage
  }

  /**
   * Approve transactions for a token amount on the target future vault.
   * @param spender - The contract/entity receiving approval for spend.
   * @param amount - The amount of tokens to be approved.

   * @returns - Either an error, or a transaction receipt.
   */
  async approve(spender: string, future: FutureVault, amount: BigNumberish) {
    return approve(this.signer, spender, future, amount)
  }

  /**
   * Fetch the spendable amount by another party(spender) from the owner's tokens on a future vault
   * @param spender - The contract/entity to which the allowance is set .
   * @param owner - The token owner's wallet address
   * @param future - The future on which the allowance is set.
   * @returns - The allowance in TokenAmount.
   */
  async allowance(spender: string, owner: string, future: FutureVault) {
    return fetchAllowance(this.provider, this.network, owner, spender, future)
  }

  /**
   * Fetch an aggregated Future construct by future vault index.
   * @param index - The index of the future to be fetched.
   * @returns - An aggregated object with future related data.
   */
  async fetchFutureAggregateFromIndex(index: number) {
    return fetchFutureAggregateFromIndex(this.network, this.provider, index)
  }

  /**
   * Fetch an aggregated Future construct by future vault address.
   * @param futureAddress - The address of the future to be fetched.
   * @returns - An aggregated object with future related data.
   */
  async fetchFutureAggregateFromAddress(futureAddress: string) {
    return fetchFutureAggregateFromAddress(this.provider, this.network, futureAddress)
  }

  /**
   * Fetch all aggregated Future constructs.
   * @returns - A collection of aggregated objects with future related data
   */
  async fetchAllFutureAggregates(amm:AMM) {
    return fetchAllFutureAggregates(this.provider, this.network, amm)
  }

  /**
   * Fetch the token of a future vault instance.
   * @param future - The target future vault instance.
   * @returns - A token instance of the future vault.
   */
  async fetchFutureToken(future: FutureVault) {
    return fetchFutureToken(this.provider, future)
  }

  /**
   * Fetch all future vaults.
   * @returns - All FutureVault instances.
   */
  async fetchAllFutureVaults() {
    return fetchAllFutureVaults(this.provider, this.network)
  }

  /**
   * Inspect LPToken approval status of an account.
   * @param account - The account's approval to be checked.
   * @param operator - The operator the approval is given to.
   * @returns - a boolean value of the approval of this account for all LPs.
   */
  async isLPApprovedForAll(account: string, operator: string) {
    return isLPApprovedForAll(this.provider, this.network, account, operator)
  }

  /**
   * Set LPToken approval status for an account.
   * @param account - The account for which the approval will be set.
   * @param approval - Boolean value of the approval.
   * @returns
   */
  async approveLPForAll(account: string, approval: boolean = true) {
    return approveLPForAll(this.signer, this.network, account, approval)
  }

  /**
   * Fetch an aggregated construct of an LPTokenPool
   * @param pairId - pair id of the tokenPair, 0 or 1
   * @param periodIndex anything from 0 to the current period index. Default is the current period.
   * @returns - An aggregated construct with LPTokenPool related data.
   */
  async fetchLPTokenPool(amm:AMM, pairId: PairId, periodIndex?: number) {
    return fetchLPTokenPool(this.provider, amm, pairId, periodIndex)
  }

  /**
   * Fetch an aggregated construct collection of all LPTokenPools.
   * @returns - A collection of aggregated constructs with LPTokenPool related data.
   */
  async fetchAllLPTokenPools(amm: AMM) {
    return fetchAllLPTokenPools(this.provider, amm)
  }

  /**
   * Add liqidity for the target AMM for a user.
   * @param amm - The AMM to add liquidity to.
   * @param pairId - pair id of the tokenPair, 0 or 1.
   * @param poolAmountIn - amount of liquidity points to be added for the token pair.
   * @param maxAmountsOut - maximum amount to be taken from the token pair.
   * @param account - optional user account, signer.getAddress is the default.
   * @returns - an SDK returnType which contains a transaction and/or an error.
   */
  async addLiquidity(amm:AMM, pairId: PairId, poolAmountIn: BigNumberish, maxAmountsOut: [BigNumberish, BigNumberish], account?: string) {
    return addLiquidity(this.signer, this.network, amm, pairId, poolAmountIn, maxAmountsOut, account)
  }

  /**
   * Remove liquidity from the target AMM for a user.
   * @param amm - The AMM to add liquidity to.
   * @param pairId - pair id of the tokenPair, 0 or 1.
   * @param poolAmountOut - amount of liquidity points to be removed for the token pair.
   * @param maxAmountsIn - maximum amount to be rece9ved from the token pair.
   * @param account - optional user account, signer.getAddress is the default.
   * @returns - an SDK returnType which contains a transaction and/or an error.
   */
  async removeLiquidity(amm:AMM, pairId: PairId, poolAmountOut: BigNumberish, maxAmountsIn: [BigNumberish, BigNumberish], account?: string) {
    return removeLiquidity(this.signer, this.network, amm, pairId, poolAmountOut, maxAmountsIn, account)
  }

  /**
  * Update the spendable amount by another party(spender) from the owner's tokens on a future vault.
  * @param spender - The contract/entity for which the allowance will be updated.
  * @param future - The future on which the allowance is being set.
  * @param amount - The amount of the allowance.
  * @returns - an SDK returnType which contains a transaction and/or an error.
  */
  async updateAllowance(spender: string, future: FutureVault, amount: BigNumberish, options = { autoApprove: false }) {
    if (options.autoApprove) {
      this.approve(spender, future, amount)
    }

    return updateAllowance(this.signer, spender, future, amount)
  }

  /**
   * Withdraw amount from a future vault.
   * @param future - The future to be withdrawn from.
   * @param amount - The amount to be withdrawn.
   * @param autoApprove - Approve automatically in case it's necessary.
   * @returns - an SDK returnType which contains a transaction and/or an error.
   */
  async withdraw(future: FutureVault, amount: BigNumberish, options = { autoApprove: false }) {
    if (options.autoApprove && this.Controller) {
      await this.approve(this.Controller.address, future, amount)
    }

    return withdraw(this.signer, this.network, future, amount)
  }

  /**
   * Deposit amount to a future vault.
   * @param future - The future to be withdrawn from.
   * @param amount - The amount to be withdrawn.
   * @param autoApprove - Approve automatically in case it's necessary.
   * @returns - an SDK returnType which contains a transaction and/or an error.
   */
  async deposit(future: FutureVault, amount: BigNumberish, options = { autoApprove: false }) {
    if (options.autoApprove && this.Controller) {
      await this.approve(this.Controller.address, future, amount)
    }

    return deposit(this.signer, this.network, future, amount)
  }

  /**
   * Swap by controlling the exact amount of tokens passed in.
   * @param params - SwapParams: from token, to token, amount, slippageTolerance (1 - 100%), deadline data, and an optional future.
   * @param options - partial SwapOptions: automatic approval.
   * @returns - either an error object, or a ContractTransaction
   */
  async swapIn(params: WithOptional<SwapParams, 'slippageTolerance' >, options: SwapOptions = { autoApprove: false }) {
    return swap('IN', {
      slippageTolerance: this.defaultSlippage,
      signer: this.signer,
      network: this.network,
      ...params
    }, options)
  }

  /**
   * Swap by controlling the exact amount of tokens coming out.
   * @param params - SwapParams: from token, to token, amount, slippageTolerance (1 - 100%), deadline data, and an optional future.
   * @param options- partial SwapOptions: automatic approval.
   * @returns - either an error object, or a ContractTransaction
   */
  async swapOut(params: WithOptional<SwapParams, 'slippageTolerance'>, options: SwapOptions = { autoApprove: false }) {
    return swap('OUT', {
      slippageTolerance: this.defaultSlippage,
      signer: this.signer,
      network: this.network,
      ...params
    }, options)
  }

  /**
   * Shows what steps to take swapping between a given a source and a target token.
   * @param from  - source token
   * @param to  - target token
   * @param visual - choose result format: ['Token1', 'Token2', ...] || 'Token1->Token2'
   * @returns tokenSwapPath from left to right
   */
  howToSwap(from: APWToken, to: APWToken) {
    const { tokenPath, namedTokenPath, graphSearchResult } = findTokenPath(from, to)
    const poolPath = findPoolPath(namedTokenPath)

    return {
      tokenPath,
      poolPath,
      namedTokenPath,
      visual: graphSearchResult?.join('->')
    }
  }
}

export default APWineSDK
