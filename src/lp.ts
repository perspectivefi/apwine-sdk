
import { AMM, LPToken__factory } from '@apwine/amm'
import { BigNumber, BigNumberish, ethers, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import range from 'ramda/src/range'
import xprod from 'ramda/src/xprod'

import { PAIR_IDS } from './constants'
import { PairId, Transaction, Options, SDKFunctionReturnType, TransactionParams, RemoveLiquidityParams, AddLiquidityParams } from './types'
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

export const addLiquidity = async (params: AddLiquidityParams & TransactionParams, options: Options = {}): Promise<SDKFunctionReturnType<Transaction>> => {
  const { signer, amm, pairId, amount, maxAmountsIn, account } = params

  const defaultMaxAmountsIn: [BigNumberish, BigNumberish] = [ethers.constants.MaxInt256, ethers.constants.MaxInt256]
  const [token1, token2] = await getPoolTokens(signer, amm, pairId)
  const user = account ?? await signer.getAddress()

  if (options.autoApprove) {
    const [maxAmountT1, maxAmountT2] = maxAmountsIn ?? defaultMaxAmountsIn

    const needsApprovalForT1 = await isApprovalNecessary(signer, user, amm.address, token1.address, maxAmountT1)
    const needsApprovalForT2 = await isApprovalNecessary(signer, user, amm.address, token2.address, maxAmountT2)

    if (needsApprovalForT1) {
      await token1.approve(amm.address, maxAmountT1)
    }

    if (needsApprovalForT2) {
      await token2.approve(amm.address, maxAmountT2)
    }
  }

  const transaction = await amm.addLiquidity(pairId, amount, maxAmountsIn ?? defaultMaxAmountsIn)

  return { transaction }
}

export const removeLiquidity = async (params: RemoveLiquidityParams & TransactionParams, options: Options = {}): Promise<SDKFunctionReturnType<Transaction>> => {
  const { signer, amm, pairId, amount, minAmountsOut, account } = params

  const defaultMinAmountsOut: [BigNumberish, BigNumberish] = [BigNumber.from('0'), BigNumber.from('0')]
  const user = account ?? await signer.getAddress()

  if (options.autoApprove) {
    const isApproved = await isLPApprovedForAll(signer, amm, user)

    if (!isApproved) {
      await approveLPForAll(signer, amm, true)
    }
  }

  const transaction = await amm.removeLiquidity(pairId, amount, minAmountsOut ?? defaultMinAmountsOut, { from: user })

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
