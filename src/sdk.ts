import { BigNumberish, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { providers } from '@0xsequence/multicall'
import { Controller, FutureVault, Registry } from '@apwine/protocol'
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

class APWineSDK {
  asyncProps: ReturnType<APWineSDK['initAsyncProps']>

  provider: Provider
  signer?: Signer
  network: Network

  AMM: AMM
  Registry: Registry

  // async props
  LP?: LPToken
  Controller?: Controller

  constructor({ network, signer, provider }: ConstructorProps) {
    this.provider = new providers.MulticallProvider(provider)
    this.network = network

    if (signer) {
      this.signer = signer
    }

    this.AMM = getAMMContract(provider, network)
    this.Registry = getRegistryContract(provider, network)

    this.asyncProps = this.initAsyncProps()
  }

  private async initAsyncProps() {
    return Promise.all([
      getControllerContract(this.provider, this.network).then(
        controller => (this.Controller = controller)
      ),
      this.AMM.getPoolTokenAddress().then((lpTokenAddress) =>
        (this.LP = getLPTokenContract(this.provider, lpTokenAddress))
      )
    ])
  }

  updateSigner(signer: Signer) {
    this.signer = signer
  }

  updateProvider(provider: Provider) {
    this.provider = provider
  }

  updateNetwork(network: Network) {
    this.network = network
  }

  async approve(future: FutureVault, spender: string, amount: BigNumberish) {
    return approve(this.signer, spender, future, amount)
  }

  async fetchAllowance(owner: string, spender: string, future: FutureVault) {
    return fetchAllowance(this.provider, owner, spender, future)
  }

  async fetchFutureAggregateFromIndex(index: number) {
    return fetchFutureAggregateFromIndex(this.network, this.provider, index)
  }

  async fetchFutureAggregateFromAddress(futureAddress: string) {
    return fetchFutureAggregateFromAddress(this.network, this.provider, futureAddress)
  }

  async fetchAllFutureAggregates() {
    return fetchAllFutureAggregates(this.provider, this.network)
  }

  async fetchFutureToken(future: FutureVault) {
    return fetchFutureToken(this.provider, future)
  }

  async fetchAllFutureVaults() {
    return fetchAllFutureVaults(this.provider, this.network)
  }

  async fetchPTTokens() {
    return fetchPTTokens(this.provider, this.network)
  }

  async isLPApprovedForAll(account: string, operator: string) {
    return isLPApprovedForAll(this.provider, this.network, account, operator)
  }

  async approveLPForAll(account: string, approval: boolean = true) {
    return approveLPForAll(this.signer, this.network, account, approval)
  }

  async fetchFYTTokens() {
    return fetchFYTTokens(this.provider, this.network)
  }

  async fetchLPTokenPool(pairId: PairId, periodIndex?: number) {
    return fetchLPTokenPool(this.provider, this.network, pairId, periodIndex)
  }

  async fetchAllLPTokenPools() {
    return fetchAllLPTokenPools(this.network, this.provider)
  }

  async updateAllowance(spender: string, future: FutureVault, amount: BigNumberish) {
    return updateAllowance(this.signer, spender, future, amount)
  }

  async withdraw(future: FutureVault, amount: BigNumberish) {
    return withdraw(this.signer, this.network, future, amount)
  }

  async deposit(future: FutureVault, amount: BigNumberish) {
    return deposit(this.signer, this.network, future, amount)
  }
}

export default APWineSDK
