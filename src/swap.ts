import { AMM } from '@apwine/amm'
import { FutureVault, FutureYieldToken__factory, IERC20__factory, PT__factory } from '@apwine/protocol'
import { BigNumber, BigNumberish, Signer } from 'ethers'

import { APWToken, Network, MINUTE, SDKFunctionReturnType, Transaction } from './constants'
import { getAMMRouterContract } from './contracts'
import { error, isApprovalNecessary } from './utils/general'
import { applySlippage, findSwapPath } from './utils/swap'
import config from './config.json'

export type SwapOptions = {
    autoApprove: boolean
}

export type SwapParams = {
    amm: AMM
    from: APWToken
    to: APWToken
    amount:BigNumberish
    slippageTolerance: number
    deadline?: Date
}

export type SwapParamsFull = SwapParams & {
    signer?: Signer
    network: Network
}

const approveSwap = async (signer: Signer, network: Network, amm: AMM, token: APWToken, amount: BigNumberish) => {
  const [ptAddress, underlyingAddress, fytAddress] = await Promise.all([
    amm.getPTAddress(),
    amm.getUnderlyingOfIBTAddress(),
    amm.getFYTAddress()
  ])

  const spender = config.networks[network].AMM_ROUTER

  if (token === 'PT') {
    const needsApproval = await isApprovalNecessary(signer, config.networks[network].AMM_ROUTER, ptAddress, amount)

    return needsApproval && PT__factory.connect(ptAddress, signer).approve(spender, amount)
  }

  if (token === 'Underlying') {
    const needsApproval = await isApprovalNecessary(signer, config.networks[network].AMM_ROUTER, underlyingAddress, amount)

    return needsApproval && IERC20__factory.connect(underlyingAddress, signer).approve(spender, amount)
  }

  if (token === 'FYT') {
    const needsApproval = await isApprovalNecessary(signer, config.networks[network].AMM_ROUTER, underlyingAddress, amount)

    return needsApproval && FutureYieldToken__factory.connect(fytAddress, signer).approve(spender, amount)
  }

  return error('NoSuchToken')
}

export const swap = async (swapType: 'IN' | 'OUT', params: SwapParamsFull, options: SwapOptions): Promise<SDKFunctionReturnType<Transaction>> => {
  const { signer, network, amm, from, to, amount: rawAmount, slippageTolerance, deadline } = params
  const amount = BigNumber.from(rawAmount)

  if (!signer) {
    return error('NoSigner')
  }

  const router = getAMMRouterContract(signer, network)
  const user = await signer.getAddress()
  const { poolPath, tokenPath } = findSwapPath(from, to)

  if (poolPath && tokenPath) {
    const getAmount = swapType === 'IN' ? router.getAmountOut : router.getAmountIn
    const tokenAmount = await getAmount(amm.address, poolPath, tokenPath, amount)
    const tokenAmountWithSlippage = swapType === 'IN' ? applySlippage(tokenAmount, -slippageTolerance) : applySlippage(tokenAmount, slippageTolerance)

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

    const swap = swapType === 'IN' ? router.swapExactAmountIn : router.swapExactAmountOut

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
