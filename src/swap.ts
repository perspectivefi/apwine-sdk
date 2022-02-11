import { AMM, AMMRegistry__factory, AMMRouter__factory } from '@apwine/amm'
import {
  FutureVault,
  FutureYieldToken__factory,
  IERC20__factory,
  PT__factory
} from '@apwine/protocol'
import { BigNumber, BigNumberish, ethers, Signer } from 'ethers'

import { Provider } from '@ethersproject/providers'
import { MINUTE } from './constants'
import {
  APWToken,
  Network,
  SDKFunctionReturnType,
  Transaction,
  Options,
  TransactionParams,
  WithNetwork,
  SwapParams
} from './types'
import { getAMMRouterContract } from './contracts'
import { error, getNetworkConfig } from './utils/general'
import { applySlippage, findSwapPath } from './utils/swap'
import { isApprovalNecessary } from './futures'

export type SwapParamsFull = SwapParams & TransactionParams & WithNetwork

const approveSwap = async (
  signer: Signer,
  network: Network,
  amm: AMM,
  token: APWToken,
  amount: BigNumberish
) => {
  const [ptAddress, underlyingAddress, fytAddress] = await Promise.all([
    amm.getPTAddress(),
    amm.getUnderlyingOfIBTAddress(),
    amm.getFYTAddress()
  ])

  const spender = getNetworkConfig(network).AMM_ROUTER
  const user = await signer.getAddress()

  if (token === 'PT') {
    const needsApproval = await isApprovalNecessary(
      signer,
      user,
      spender,
      ptAddress,
      amount
    )

    return (
      needsApproval &&
      PT__factory.connect(ptAddress, signer).approve(spender, amount)
    )
  }

  if (token === 'Underlying') {
    const needsApproval = await isApprovalNecessary(
      signer,
      user,
      spender,
      underlyingAddress,
      amount
    )

    return (
      needsApproval &&
      IERC20__factory.connect(underlyingAddress, signer).approve(
        spender,
        amount
      )
    )
  }

  if (token === 'FYT') {
    const needsApproval = await isApprovalNecessary(
      signer,
      user,
      spender,
      underlyingAddress,
      amount
    )

    return (
      needsApproval &&
      FutureYieldToken__factory.connect(fytAddress, signer).approve(
        spender,
        amount
      )
    )
  }

  return error('NoSuchToken')
}

export const swap = async (
  swapType: 'IN' | 'OUT',
  params: SwapParamsFull,
  options: Options
): Promise<SDKFunctionReturnType<Transaction>> => {
  const {
    signer,
    network,
    amm,
    from,
    to,
    amount: rawAmount,
    slippageTolerance,
    deadline
  } = params

  if (!signer) {
    return error('NoSigner')
  }

  const amount = BigNumber.from(rawAmount)
  const router = getAMMRouterContract(signer, network)
  const user = await signer.getAddress()
  const { poolPath, tokenPath } = findSwapPath(from, to)

  if (poolPath && tokenPath) {
    const getAmount =
      swapType === 'IN' ? router.getAmountOut : router.getAmountIn
    const tokenAmount = await getAmount(
      amm.address,
      poolPath,
      tokenPath,
      amount
    )
    const tokenAmountWithSlippage =
      swapType === 'IN'
        ? applySlippage(tokenAmount, -slippageTolerance)
        : applySlippage(tokenAmount, slippageTolerance)

    const amountIn = swapType === 'IN' ? amount : tokenAmountWithSlippage
    const amountOut = swapType === 'IN' ? tokenAmountWithSlippage : amount

    if (slippageTolerance > 100 || slippageTolerance < 0.1) {
      return error('FaultySlippage')
    }

    if (options.autoApprove) {
      await (swapType === 'IN'
        ? approveSwap(signer, network, amm, from, amount)
        : approveSwap(signer, network, amm, from, tokenAmountWithSlippage))
    }

    const swap =
      swapType === 'IN' ? router.swapExactAmountIn : router.swapExactAmountOut

    const transaction = await swap(
      amm.address,
      poolPath,
      tokenPath,
      amountIn,
      amountOut,
      user,
      deadline?.getTime() ?? Date.now() + MINUTE
    )

    return { transaction }
  }

  return error('InvalidSwapRoute')
}

export const fetchSpotPrice = async (
  signerOrProvider: Signer | Provider,
  network: Network,
  future: FutureVault,
  from: APWToken,
  to: APWToken
) => {
  const router = AMMRouter__factory.connect(
    getNetworkConfig(network).AMM_ROUTER,
    signerOrProvider
  )
  const ammRegistry = AMMRegistry__factory.connect(
    getNetworkConfig(network).AMM_REGISTRY,
    signerOrProvider
  )

  const { poolPath, tokenPath } = findSwapPath(from, to)

  if (poolPath && tokenPath) {
    const ammAddress = await ammRegistry.getFutureAMMPool(future.address)
    return router.getSpotPrice(ammAddress, poolPath, tokenPath)
  }

  return error('InvalidSwapRoute')
}
