import range from 'ramda/src/range'
import {
  Controller__factory,
  FutureVault__factory,
  Registry__factory
} from '@apwine/protocol'
import { AMM__factory } from '@apwine/amm'
import { Provider } from '@ethersproject/providers'
import { Signer } from 'ethers'

import { Network } from './constants'
import config from './config.json'

export const getRegistryContract = (
  network: Network,
  signerOrProvider: Signer | Provider
) =>
  Registry__factory.connect(
    config.networks[network].REGISTRY_ADDRESS,
    signerOrProvider
  )

export const getAMMContract = (
  network: Network,
  signerOrProvider: Signer | Provider
) =>
  AMM__factory.connect(config.networks[network].AMM_ADDRESS, signerOrProvider)

export const getControllerContract = async (
  network: Network,
  signerOrProvider: Signer | Provider
) => {
  const registry = getRegistryContract(network, signerOrProvider)
  const controllerAddress = await registry.getControllerAddress()

  return Controller__factory.connect(controllerAddress, signerOrProvider)
}

export const getFutureVaultContract = (
  address: string,
  signerOrProvider: Signer | Provider
) => FutureVault__factory.connect(address, signerOrProvider)
