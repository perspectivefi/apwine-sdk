import { PT__factory } from '@apwine/protocol'
import { Provider } from '@ethersproject/providers'
import { Signer } from 'ethers'
import { Network } from './constants'
import { fetchAllFutureAggregates } from './futures'

export const fetchPTTokens = async (network: Network, signerOrProvider: Signer | Provider) => {
  const futureAggregates = await fetchAllFutureAggregates(network, signerOrProvider)

  return futureAggregates.map((fa) => PT__factory.connect(fa.ibtAddress, signerOrProvider))
}
