import {
  AToken__factory,
  Controller__factory,
  FutureVault__factory,
  Registry__factory
} from '@apwine/protocol'
import { AMMRegistry__factory, AMMRouter__factory } from '@apwine/amm'
import { Provider } from '@ethersproject/providers'
import { Signer } from 'ethers'
import { Network } from './types'

import { getNetworkConfig } from './utils/general'

export const getRegistryContract = (
  signerOrProvider: Signer | Provider,
  network: Network
) =>
  Registry__factory.connect(
    getNetworkConfig(network).REGISTRY_ADDRESS,
    signerOrProvider
  )

export const getTokencontract = (signerOrProvider: Signer | Provider, tokenAddress: string) =>
  AToken__factory.connect(tokenAddress, signerOrProvider)

export const getAMMRouterContract = (
  signerOrProvider: Signer | Provider,
  network: Network
) =>
  AMMRouter__factory.connect(getNetworkConfig(network).AMM_ROUTER, signerOrProvider)

export const getAMMRegistryContract = (signerOrProvider: Signer | Provider, network: Network) =>
  AMMRegistry__factory.connect(getNetworkConfig(network).AMM_REGISTRY, signerOrProvider)

export const getControllerContract = async (
  signerOrProvider: Signer | Provider,
  network: Network

) => {
  const registry = getRegistryContract(signerOrProvider, network)
  const controllerAddress = await registry.getControllerAddress()

  return Controller__factory.connect(controllerAddress, signerOrProvider)
}

export const getFutureVaultContract = (
  signerOrProvider: Signer | Provider,
  address: string
) => FutureVault__factory.connect(address, signerOrProvider)
