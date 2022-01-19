import { FutureVault, FutureYieldToken__factory, IERC20__factory, PT__factory } from '@apwine/protocol'
import { BigNumberish, Signer } from 'ethers'

import { APWToken, Network } from './constants'
import { getAMMContract, getAMMRouterContract } from './contracts'
import { error, isError } from './utils/general'
import { findSwapPath } from './utils/swap'

export type SwapOptions = {
    autoApprove: boolean
}

export type SwapParams = {
    from: APWToken
    to: APWToken
    amount:BigNumberish
    slippageTolerance: number
    future?: FutureVault
    deadline?: Date
}

export type SwapParamsFull = SwapParams & {
    signer?: Signer
    network: Network
}

const approveSwap = async (signer: Signer, network: Network, user: string, token: APWToken, amount: BigNumberish, future?: FutureVault) => {
  const amm = getAMMContract(signer, network)

  const [ibtAddress, underlyingAddress] = await Promise.all([
    amm.getIBTAddress(),
    amm.getUnderlyingOfIBTAddress()
  ])

  switch (token) {
    case 'FYT':
      return future ? FutureYieldToken__factory.connect(future.address, signer).approve(user, amount) : error('NoFuture')
    case 'PT':
      return PT__factory.connect(ibtAddress, signer).approve(user, amount)

    case 'Underlying':
      return await IERC20__factory.connect(underlyingAddress, signer).approve(user, amount)
    default:
      return error('NoSuchToken')
  }
}

export const swap = async (direction: 'IN' | 'OUT', params: SwapParamsFull) => {
  const { signer, network, from, to, amount, slippageTolerance, deadline } = params

  if (!signer) {
    return error('NoSigner')
  }

  const amm = getAMMContract(signer, network)
  const router = getAMMRouterContract(signer, network)
  const user = await signer.getAddress()
  const { poolPath, tokenPath } = findSwapPath(from, to)

  if (poolPath && tokenPath) {
    const tokenAmountIn = await router.getAmountIn(amm.address, poolPath, tokenPath, amount)
    const tokenAmountOut = await router.getAmountOut(amm.address, poolPath, tokenPath, amount)

    if (slippageTolerance > 100 || slippageTolerance < 1) {
      return error('FaultySlippage')
    }

    const amountOut = tokenAmountIn.mul(100 + slippageTolerance).div(100)
    const amountIn = tokenAmountOut.mul(100 - slippageTolerance).div(100)

    return await direction === 'IN'
      ? router.swapExactAmountIn(amm.address, poolPath, tokenPath, amount, amountOut, user, deadline?.getTime() ?? Date.now())
      : router.swapExactAmountOut(amm.address, poolPath, tokenPath, amount, amountIn, user, deadline?.getTime() ?? Date.now())
  }

  return error('InvalidSwapRoute')
}

export const swapIn = async (params: SwapParamsFull, options: SwapOptions) => {
  const { signer, network, amount, future } = params

  if (!signer) {
    return error('NoSigner')
  }

  const user = await signer.getAddress()

  if (options.autoApprove) {
    const result = await approveSwap(signer, network, user, params.from, amount, future)

    console.log(result)

    if (isError(result)) {
      return result
    }
  }

  return swap('IN', params)
}

export const swapOut = async (params: SwapParamsFull, options: SwapOptions) => {
  const { signer, network, amount, future } = params

  if (!signer) {
    return error('NoSigner')
  }

  const user = await signer.getAddress()

  if (options.autoApprove) {
    const result = await approveSwap(signer, network, user, params.from, amount, future)

    if (isError(result)) {
      return result
    }
  }

  return swap('OUT', params)
}
