import { AMM } from '@apwine/amm'
import { PT__factory } from '@apwine/protocol'
import { Provider } from '@ethersproject/providers'
import { Signer } from 'ethers'
import { Network } from './types'
import { fetchAllFutureAggregates } from './futures'

export const fetchPTTokens = async (signerOrProvider: Signer | Provider, network: Network, amm: AMM) => {
  const futureAggregates = await fetchAllFutureAggregates(signerOrProvider, network, amm)

  return futureAggregates.map((fa) => PT__factory.connect(fa.ibtAddress, signerOrProvider))
}
