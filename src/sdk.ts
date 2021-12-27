import { BigNumberish, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { Network, PairId } from './constants'
import { Controller, FutureVault, Registry } from '@apwine/protocol'
import { AMM } from '@apwine/amm'

import {
  deposit,
  fetchAllFutureVaults,
  fetchFutureFromAddress,
  fetchFutureFromIndex,
  withdraw
} from './futures'
import { fetchAllLPTokenPools, fetchLPTokenPool } from './lp'
import {
  getAMMContract,
  getControllerContract,
  getRegistryContract
} from './contracts'
import { error } from './utils'

type ConstructorProps = {
  network: Network
  provider: Provider
  signer?: Signer
}

class APWineSDK {
  provider: Provider
  signer?: Signer
  network: Network

  AMM: AMM
  Registry: Registry
  Controller?: Controller

  constructor({ network, signer, provider }: ConstructorProps) {
    this.provider = provider
    this.network = network

    if (signer) {
      this.signer = signer
    }

    this.AMM = getAMMContract(this.network, this.provider)
    this.Registry = getRegistryContract(this.network, this.provider)

    getControllerContract(network, this.provider).then(
      controller => (this.Controller = controller)
    )
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

  async fetchFutureFromIndex(index: number) {
    return fetchFutureFromIndex(this.network, this.provider, index)
  }

  async fetchFutureFromAddress(futureAddress: string) {
    fetchFutureFromAddress(this.network, this.provider, futureAddress)
  }

  async fetchAllFutureVaults() {
    return fetchAllFutureVaults(this.network, this.provider)
  }

  async fetchLPTokenPool(pairId: PairId, periodIndex?: number) {
    return fetchLPTokenPool(this.network, this.provider, pairId, periodIndex)
  }

  async fetchAllLPTokenPools() {
    return fetchAllLPTokenPools(this.network, this.provider)
  }

  async withdraw(future: FutureVault, amount: BigNumberish) {
    if (this.signer) {
      return withdraw(this.network, this.signer, future, amount)
    }

    return error('NoSigner')
  }

  async deposit(future: FutureVault, amount: BigNumberish) {
    if (this.signer) {
      return deposit(this.network, this.signer, future, amount)
    }

    return error('NoSigner')
  }
}

export default APWineSDK
