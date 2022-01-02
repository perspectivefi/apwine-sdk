import { FutureYieldToken__factory } from '@apwine/protocol'
import { Provider } from '@ethersproject/providers'
import { Signer } from 'ethers'
import { Network } from './constants'
import { fetchAllFutureVaults } from './futures'

export const fetchFYTTokens = async (signerOrProvider: Signer | Provider, network: Network) => {
  const vaults = await fetchAllFutureVaults(signerOrProvider, network)

  return vaults.map((v) => FutureYieldToken__factory.connect(v.address, signerOrProvider))
}
