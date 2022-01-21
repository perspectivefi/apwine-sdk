import { BigNumberish, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { providers } from '@0xsequence/multicall'
import { Controller, FutureVault, Registry } from '@apwine/protocol'
import { AMM, AMMRegistry, AMMRouter } from '@apwine/amm'
import { Network, PairId, Options } from './constants'

import {
  deposit,
  fetchAllFutureAggregates,
  fetchAllFutureVaults,
  fetchFutureAggregateFromIndex,
  fetchFutureAggregateFromAddress,
  withdraw,
  updateAllowance,
  approve,
  fetchAllowance,
  fetchAMMs,
  isApprovalNecessary
} from './futures'
import { addLiquidity, AddLiquidityParams, approveLPForAll, fetchAllLPTokenPools, fetchLPTokenPool, isLPApprovedForAll, removeLiquidity, RemoveLiquidityParams } from './lp'
import {
  getAMMRegistryContract,
  getAMMRouterContract,
  getControllerContract,
  getRegistryContract
} from './contracts'

import { swap, SwapParams } from './swap'
import { WithOptional } from './utils/general'

type ConstructorProps = {
  network: Network
  provider: Provider
  signer: Signer
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
  signer: Signer
  defaultUser = ''

  AMMRegistry: AMMRegistry
  Registry: Registry
  Router: AMMRouter

  // async props
  Controller: Controller | null = null

  /**
   *Creates a new APWine SDK instance.
   * @param param0 - An object containing a network a spender,  a provider
     and an optional signer.
   */
  constructor({ network, signer, provider, defaultSlippage = 0.5 }: ConstructorProps, options: ConstructorOptions = { initialize: true }) {
    this.provider = new providers.MulticallProvider(provider)
    this.signer = signer
    this.defaultSlippage = defaultSlippage
    this.network = network

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
      this.signer.getAddress().then((address) => (this.defaultUser = address))
    ])

    this.ready = ready
    return ready
  }

  /**
   * Update default user on an existing APWineSDK instance.
   * @param address - The address of the new user.
   */
  updateDefaultUser(address:string) {
    this.defaultUser = address
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
   * fetch all AMMs
   * @returns - Promise of an AMM collection.
   */
  async fetchAMMs() {
    return fetchAMMs(this.signer, this.network)
  }

  /**
   * Approve transactions for a token amount on the target future vault.
   * @param spender - The contract/entity receiving approval for spend.
   * @param tokenAddress - The address of the token contract.
   * @param amount - The amount of tokens to be approved.
   * @returns - an SDK returnType which contains a transaction and/or an error.
   */
  async approve(spender: string, tokenAddress: string, amount: BigNumberish) {
    return approve(this.signer, spender, tokenAddress, amount)
  }

  /**
   * Fetch the spendable amount by another party(spender) from the owner's tokens on a future vault
   * @param spender - The contract/entity to which the allowance is set.
   * @param tokenAddress - The address of the token contract.
   * @param account - (optional) The token owner's wallet address
   * @returns - The allowance in TokenAmount.
   */
  async allowance(spender: string, tokenAddress: string, account?: string) {
    return fetchAllowance(this.provider, this.network, account ?? this.defaultUser, spender, tokenAddress)
  }

  /**
   * Fetch an aggregated Future construct by future vault index.
   * @param index - The index of the future to be fetched.
   * @returns - An aggregated object with future related data.
   */
  async fetchFutureAggregateFromIndex(index: number) {
    return fetchFutureAggregateFromIndex(this.provider, this.network, index)
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
   * Fetch all aggregated Future constructs on an AMM.
   * @returns - A collection of aggregated objects with future related data
   */
  async fetchAllFutureAggregates(amm:AMM) {
    return fetchAllFutureAggregates(this.provider, this.network, amm)
  }

  /**
   * Fetch all future vaults.
   * @returns - All FutureVault instances.
   */
  async fetchAllFutureVaults() {
    return fetchAllFutureVaults(this.provider, this.network)
  }

  /**
   * Check if the user needs to give approval to an entity, for an amount of a token.
   * @param tokenAddress - The address of the token.
   * @param amount - The amount in question.
   * @param spender - The entity of which the approval is being queried.
   * @param account - (optional) The owner of the tokens.
   * @returns - a boolean value.
   */
  async isApprovalNecessary(tokenAddress: string, amount: BigNumberish, spender: string, account?: string) {
    return isApprovalNecessary(this.signer, account ?? this.defaultUser, spender, tokenAddress, amount)
  }

  /**
   * Inspect LPToken approval status of an account.
   * @param amm - The amm on which to check LPToken approval status
   * @param account -  (optional) The user whose approval status is queried
   * @returns - a boolean value of the approval of this account for all LPs.
   */
  async isLPApprovedForAll(amm: AMM, account?: string) {
    return isLPApprovedForAll(this.provider, amm, account ?? this.defaultUser)
  }

  /**
   * Set LPToken approval status for an account.
   * @param amm - The AMM on which the approval will happen.
   * @param approval - Boolean value of the approval.
   * @returns - an SDK returnType which contains a transaction and/or an error.
   */
  async approveLPForAll(amm: AMM, approval: boolean = true) {
    return approveLPForAll(this.signer, amm, approval)
  }

  /**
   * Fetch an aggregated construct of an LPTokenPool
   * @param amm - The target AMM on which the tokenPool exists.
   * @param pairId - The pair id of the token pair, 0 or 1.
   * @param periodIndex (optional) anything from 0 to the current period index. Default is the current period.
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
   * @param0 - AddLiquidityParams: { amm, pairId, poolAmountOut, maxAmountsIn?, account?}
   * @param1 - (optional) Options: { autoApprove: boolean }
   * @returns - an SDK returnType which contains a transaction and/or an error.
   */
  async addLiquidity(params: AddLiquidityParams, options?: Options) {
    return addLiquidity({ signer: this.signer, ...params }, options)
  }

  /**
   * Remove liquidity from the target AMM for a user.
   * @param0 - RemoveLiquiditParams: { amm, pairid, poolAmountIn, minAmountsOut?, account? }
   * @param1 - (optional) Options: { autoApprove: boolean }
   * @returns - an SDK returnType which contains a transaction and/or an error.
   */
  async removeLiquidity(params: RemoveLiquidityParams, options?: Options) {
    return removeLiquidity({ signer: this.signer, ...params }, options)
  }

  /**
  * Update the spendable amount by another party(spender) from the owner's tokens on a future vault.
  * @param spender - The contract/entity for which the allowance will be updated.
  * @param tokenAddress - The address of the token contract.
  * @param amount - The amount of the allowance.
  * @param options - (optional) { autoApprove: boolean}
  * @returns - an SDK returnType which contains a transaction and/or an error.
  */
  async updateAllowance(spender: string, tokenAddress: string, amount: BigNumberish, options = { autoApprove: false }) {
    if (options.autoApprove) {
      this.approve(spender, tokenAddress, amount)
    }

    return updateAllowance(this.signer, spender, tokenAddress, amount)
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
      await this.approve(this.Controller.address, future.address, amount)
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
      await this.approve(this.Controller.address, future.address, amount)
    }

    return deposit(this.signer, this.network, future, amount)
  }

  /**
   * Swap by controlling the exact amount of tokens passed in.
   * @param params - SwapParams: from token, to token, amount, slippageTolerance (1 - 100%), deadline data, and an optional future.
   * @param options - partial SwapOptions: automatic approval.
   * @returns - either an error object, or a ContractTransaction
   */
  async swapIn(params: WithOptional<SwapParams, 'slippageTolerance' >, options: Options = { autoApprove: false }) {
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
  async swapOut(params: WithOptional<SwapParams, 'slippageTolerance'>, options: Options = { autoApprove: false }) {
    return swap('OUT', {
      slippageTolerance: this.defaultSlippage,
      signer: this.signer,
      network: this.network,
      ...params
    }, options)
  }
}

export default APWineSDK
