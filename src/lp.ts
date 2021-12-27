import range from 'ramda/src/range'
import xprod from 'ramda/src/xprod'
import { LPToken__factory } from '@apwine/amm'
import { Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'

import { PairId, PAIR_IDS } from './constants'
import { Network } from './constants'
import { getAMMContract } from './contracts'

export const getLPTokenContract = (
  address: string,
  signerOrProvider: Signer | Provider
) => {
  return LPToken__factory.connect(address, signerOrProvider)
}

export const fetchLPTokenPool = async (
  network: Network,
  signerOrProvider: Signer | Provider,
  pairId: PairId,
  periodIndex?: number
) => {
  const amm = await getAMMContract(network, signerOrProvider)
  const targetPeriodIndex = periodIndex ?? (await amm.currentPeriodIndex())
  const address = await amm.getPoolTokenAddress()
  const token = getLPTokenContract(address, signerOrProvider)
  const id = await amm.getLPTokenId(amm.id, targetPeriodIndex, pairId)

  return {
    address,
    token,
    id,
    pairId,
    periodIndex
  }
}

export const fetchAllLPTokenPools = async (
  network: Network,
  signerOrProvider: Signer | Provider
) => {
  const amm = await getAMMContract(network, signerOrProvider)
  const currentPeriodIndex = (await amm.currentPeriodIndex()).toNumber()
  const periods = range(0, currentPeriodIndex + 1)
  return Promise.all(
    xprod(PAIR_IDS, periods).map(([pairId, periodIndex]) =>
      fetchLPTokenPool(network, signerOrProvider, pairId, periodIndex)
    )
  )
}
