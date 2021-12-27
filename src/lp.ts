
import { LPToken__factory } from '@apwine/amm'
import { BigNumberish, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import range from 'ramda/src/range'
import xprod from 'ramda/src/xprod'

import { Network, PAIR_IDS, PairId } from './constants'
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
  periodIndex?: BigNumberish
) => {
  const amm = await getAMMContract(network, signerOrProvider)
  const targetPeriodIndex = periodIndex ?? (await amm.currentPeriodIndex())
  const address = await amm.getPoolTokenAddress()
  const token = getLPTokenContract(address, signerOrProvider)
  const id = await amm.getLPTokenId(
    await amm.ammId(),
    targetPeriodIndex,
    pairId
  )

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
  const periods = range(0, currentPeriodIndex)
  console.log(xprod(PAIR_IDS, periods))
  return Promise.all(
    xprod(PAIR_IDS, periods).map(([pairId, periodIndex]) =>
      fetchLPTokenPool(network, signerOrProvider, pairId, periodIndex)
    )
  )
}
