
import { LPToken__factory } from '@apwine/amm'
import { BigNumberish, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import range from 'ramda/src/range'
import xprod from 'ramda/src/xprod'

import { Network, PAIR_IDS, PairId } from './constants'
import { getAMMContract } from './contracts'

export const getLPTokenContract = (
  signerOrProvider: Signer | Provider,
  address: string

) => {
  return LPToken__factory.connect(address, signerOrProvider)
}

export const isLPApprovedForAll = async (signerOrProvider: Signer | Provider, network: Network, account: string, operator: string) => {
  const token = getLPTokenContract(signerOrProvider, network)

  return token.isApprovedForAll(account, operator)
}

export const approveLPForAll = async (signerOrProvider: Signer | Provider, network: Network, operator: string, approved:boolean) => {
  const token = getLPTokenContract(signerOrProvider, network)

  return token.setApprovalForAll(operator, approved)
}

export const fetchLPTokenPool = async (
  signerOrProvider: Signer | Provider,
  network: Network,
  pairId: PairId,
  periodIndex?: BigNumberish
) => {
  const amm = await getAMMContract(signerOrProvider, network)
  const targetPeriodIndex = periodIndex ?? (await amm.currentPeriodIndex())
  const address = await amm.getPoolTokenAddress()
  const token = getLPTokenContract(signerOrProvider, address)
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
  const amm = await getAMMContract(signerOrProvider, network)
  const currentPeriodIndex = (await amm.currentPeriodIndex()).toNumber()
  const periods = range(0, currentPeriodIndex)
  return Promise.all(
    xprod(PAIR_IDS, periods).map(([pairId, periodIndex]) =>
      fetchLPTokenPool(signerOrProvider, network, pairId, periodIndex)
    )
  )
}
