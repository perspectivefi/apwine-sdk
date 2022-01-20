
import { AMM, LPToken__factory } from '@apwine/amm'
import { BigNumberish, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import range from 'ramda/src/range'
import xprod from 'ramda/src/xprod'

import { Network, PAIR_IDS, PairId, Transaction } from './constants'
import { error } from './utils/general'
import { SDKFunctionReturnType } from '.'

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

export const approveLPForAll = async (signer: Signer | undefined, network: Network, operator: string, approved:boolean): Promise<SDKFunctionReturnType<Transaction>> => {
  if (!signer) {
    return error('NoSigner')
  }

  const token = getLPTokenContract(signer, network)
  const transaction = await token.setApprovalForAll(operator, approved)

  return {
    transaction
  }
}

export const addLiquidity = async (
  signer: Signer | undefined,
  network:Network,
  amm: AMM,
  pairId: PairId,
  poolAmountOut: BigNumberish,
  maxAmountsIn: [BigNumberish, BigNumberish],
  account?: string
): Promise<SDKFunctionReturnType<Transaction>> => {
  if (!signer) {
    return error('NoSigner')
  }

  const isApproved = await isLPApprovedForAll(signer, network, account ?? await signer.getAddress(), amm.address)

  if (!isApproved) {
    return error('LPAddNotApproved')
  }
  const transaction = await amm.addLiquidity(pairId, poolAmountOut, maxAmountsIn)

  return { transaction }
}

export const removeLiquidity = async (
  signer: Signer | undefined,
  network:Network,
  amm: AMM,
  pairId: PairId,
  poolAmountOut: BigNumberish,
  maxAmountsIn: [BigNumberish, BigNumberish],
  account?: string

): Promise<SDKFunctionReturnType<Transaction>> => {
  if (!signer) {
    return error('NoSigner')
  }

  const isApproved = await isLPApprovedForAll(signer, network, account ?? await signer.getAddress(), amm.address)

  if (!isApproved) {
    return error('LPRemovalNotApproved')
  }

  const transaction = await amm.removeLiquidity(pairId, poolAmountOut, maxAmountsIn)

  return { transaction }
}

export const fetchLPTokenPool = async (
  signerOrProvider: Signer | Provider,
  amm: AMM,
  pairId: PairId,
  periodIndex?: BigNumberish
) => {
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
  signerOrProvider: Signer | Provider,
  amm: AMM
) => {
  const currentPeriodIndex = (await amm.currentPeriodIndex()).toNumber()
  const periods = range(0, currentPeriodIndex)
  return Promise.all(
    xprod(PAIR_IDS, periods).map(([pairId, periodIndex]) =>
      fetchLPTokenPool(signerOrProvider, amm, pairId, periodIndex)
    )
  )
}
