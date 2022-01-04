import { BigNumberish, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { providers } from '@0xsequence/multicall'
import { Controller, FutureVault, FutureYieldToken, PT, Registry } from '@apwine/protocol'
import { AMM, LPToken } from '@apwine/amm'
import { Network, PairId } from './constants'

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
  fetchAllowance
} from './futures'
import { approveLPForAll, fetchAllLPTokenPools, fetchLPTokenPool, getLPTokenContract, isLPApprovedForAll } from './lp'
import {
  getAMMContract,
  getControllerContract,
  getRegistryContract
} from './contracts'
import { fetchPTTokens } from './pt'
import { fetchFYTTokens } from './fyt'

type ConstructorProps = {
  network: Network
  provider: Provider
  signer?: Signer
}

type ConstructorOptions = {
  initialize: boolean
}

class APWineSDK {
  ready: ReturnType<APWineSDK['initialize']> | boolean = false

  network: Network
  provider: Provider
  signer?: Signer

  AMM: AMM
  Registry: Registry

  // async props
  PTs: PT[] | null = null
  FYTs: FutureYieldToken[] | null = null
  LP: LPToken | null = null
  Controller: Controller | null = null

  /**
   *Creates a new APWine SDK instance.
   * @param param0{ConstructorProps} - An object containing a network a spender,  a provider
     and an optional signer.
   */
  constructor({ network, signer, provider }: ConstructorProps, options: ConstructorOptions = { initialize: true }) {
    this.provider = new providers.MulticallProvider(provider)
    this.network = network

    if (signer) {
      this.signer = signer
    }

    this.AMM = getAMMContract(provider, network)
    this.Registry = getRegistryContract(provider, network)

    if (options.initialize) {
      this.initialize()
    }
  }

  /**
   * Initializes all asynchronous properties, and sets the resulting promise in this.asyncProps
   * @returns - A Promise of a collection of asynchronous props wrapped into Promise.all
   */
  async initialize() {
    const ready = Promise.all([
      getControllerContract(this.provider, this.network).then(
        controller => (this.Controller = controller)
      ),
      fetchPTTokens(this.provider, this.network).then((pts) => (this.PTs = pts)),
      fetchFYTTokens(this.provider, this.network).then((fyts) => (this.FYTs = fyts)),
      this.AMM.getPoolTokenAddress().then((lpTokenAddress) =>
        (this.LP = getLPTokenContract(this.provider, lpTokenAddress))
      )
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
    return fetchFutureAggregateFromAddress(this.network, this.provider, futureAddress)
  }

  /**
   * Fetch all aggregated Future constructs.
   * @returns - A collection of aggregated objects with future related data
   */
  async fetchAllFutureAggregates() {
    return fetchAllFutureAggregates(this.provider, this.network)
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
   * @param pairId - 0 or 1
   * @param periodIndex anything from 0 to the current period index. Default is the current period.
   * @returns - An aggregated construct with LPTokenPool related data.
   */
  async fetchLPTokenPool(pairId: PairId, periodIndex?: number) {
    return fetchLPTokenPool(this.provider, this.network, pairId, periodIndex)
  }

  /**
   * Fetch an aggregated construct collection of all LPTokenPools.
   * @returns - A collection of aggregated constructs with LPTokenPool related data.
   */
  async fetchAllLPTokenPools() {
    return fetchAllLPTokenPools(this.network, this.provider)
  }

  /**
  * Update the spendable amount by another party(spender) from the owner's tokens on a future vault.
  * @param spender - The contract/entity for which the allowance will be updated.
  * @param future - The future on which the allowance is being set.
  * @param amount - The amount of the allowance.
  * @returns - Either an error, or the Transaction receipt.
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
   * @returns - Either an error, or the Transaction receipt.
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
   * @returns - Either an error, or the Transaction receipt.
   */
  async deposit(future: FutureVault, amount: BigNumberish, options = { autoApprove: false }) {
    if (options.autoApprove && this.Controller) {
      await this.approve(this.Controller.address, future, amount)
    }

    return deposit(this.signer, this.network, future, amount)
  }
}

export default APWineSDK
