
import { AMM, LPToken__factory } from '@apwine/amm'
import { BigNumberish, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import range from 'ramda/src/range'
import xprod from 'ramda/src/xprod'

import { PAIR_IDS, PairId, Transaction, Options, SDKFunctionReturnType, TransactionParams } from './constants'
import { error } from './utils/general'
import { isApprovalNecessary } from './futures'
import { getPoolTokens } from './utils/swap'

export const getLPTokenContract = (
  signerOrProvider: Signer | Provider,
  address: string

) => {
  return LPToken__factory.connect(address, signerOrProvider)
}

export const isLPApprovedForAll = async (signerOrProvider: Signer | Provider, amm:AMM, account: string) => {
  const lpAddress = await amm.getPoolTokenAddress()
  const lp = getLPTokenContract(signerOrProvider, lpAddress)

  return lp.isApprovedForAll(account, amm.address)
}

export const approveLPForAll = async (signer: Signer, amm: AMM, approved:boolean): Promise<SDKFunctionReturnType<Transaction>> => {
  const lpAddress = await amm.getPoolTokenAddress()

  const token = getLPTokenContract(signer, lpAddress)
  const transaction = await token.setApprovalForAll(amm.address, approved)

  return {
    transaction
  }
}

export type AddLiquidityParams = {
  amm: AMM,
  pairId: PairId,
  poolAmountOut: BigNumberish,
  maxAmountsIn: [BigNumberish, BigNumberish],
}

export const addLiquidity = async (params: AddLiquidityParams & TransactionParams, options: Options = {}): Promise<SDKFunctionReturnType<Transaction>> => {
  const { signer, amm, pairId, poolAmountOut, maxAmountsIn } = params

  const [token1, token2] = await getPoolTokens(signer, amm, pairId)
  const user = await signer.getAddress()

  if (options.autoApprove) {
    const [maxAmountT1, maxAmountT2] = maxAmountsIn

    const needsApprovalForT1 = await isApprovalNecessary(signer, user, amm.address, token1.address, maxAmountT1)
    const needsApprovalForT2 = await isApprovalNecessary(signer, user, amm.address, token2.address, maxAmountT2)

    if (needsApprovalForT1) {
      await token1.approve(amm.address, maxAmountT1)
    }

    if (needsApprovalForT2) {
      await token2.approve(amm.address, maxAmountT2)
    }
  }

  const transaction = await amm.addLiquidity(pairId, poolAmountOut, maxAmountsIn)

  return { transaction }
}

export type RemoveLiquidityParams = {
  amm: AMM,
  pairId: PairId,
  poolAmountIn: BigNumberish,
  minAmountsOut: [BigNumberish, BigNumberish],
  account?: string
}

export const removeLiquidity = async (params: RemoveLiquidityParams & TransactionParams, options: Options = {}): Promise<SDKFunctionReturnType<Transaction>> => {
  const { signer, amm, pairId, poolAmountIn, minAmountsOut } = params

  if (!signer) {
    return error('NoSigner')
  }

  const user = await signer.getAddress()

  if (options.autoApprove) {
    const isApproved = await isLPApprovedForAll(signer, amm, user)

    if (!isApproved) {
      await approveLPForAll(signer, amm, true)
    }
  }

  const transaction = await amm.removeLiquidity(pairId, poolAmountIn, minAmountsOut, { from: user })

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
