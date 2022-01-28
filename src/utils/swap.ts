import { bidirectional, edgePathFromNodePath } from 'graphology-shortest-path'
import { BigNumber, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { AMM } from '@apwine/amm'
import { FutureYieldToken__factory, IERC20__factory, PT__factory } from '@apwine/protocol'
import { PairId, APWToken } from '../types'
import pools from './pools'

/**
 * Show different representations, of how to swap one token to another.
 * @param from - APWToken, PT, Underlying or FYT.
 * @param to - APWToken, PT, Underlying or FYT.
 * @returns - searchResult, a  tokenPath, and a namedTokenPath.
 */
export const findTokenPath = (from: APWToken, to: APWToken) => {
  const graphSearchResult = bidirectional(pools, from, to)
  const namedTokenPath = graphSearchResult?.reduce<string[]>((acc, curr, i, arr) => {
    if (i % 2 && i !== arr.length - 1) {
      return [...acc, curr, curr]
    }

    return [...acc, curr]
  }, []) as APWToken[]

  const tokenPath = namedTokenPath?.map((nodeId) => pools.getNodeAttributes(nodeId).index) as PairId[]

  return {
    graphSearchResult,
    namedTokenPath,
    tokenPath
  }
}

/**
 * Show how many pools a swap involves.
 * @param shortestPath - a token path.
 * @returns - a pool path.
 */
export const findPoolPath = (shortestPath: string[] | null): number[] | null => {
  if (!shortestPath) {
    return null
  }

  return edgePathFromNodePath(pools, shortestPath).map((eid) => pools.getEdgeAttributes(eid).pair)
}

export const findSwapPath = (from: APWToken, to: APWToken) => {
  const { tokenPath, graphSearchResult } = findTokenPath(from, to)
  const poolPath = findPoolPath(graphSearchResult)

  return {
    tokenPath,
    poolPath
  }
}

/**
 * Apply slippage to a BigNumber
 * @param n - the input number
 * @param slippagePercentage - the percentage applied, can be positive or negative.
 * @returns - a BigNumber with applied slippage.
 */
export const applySlippage = (n: BigNumber, slippagePercentage: number) =>
  n.mul(10000 + slippagePercentage * 100).div(10000)

/**
 * Shows all necessary information of a swap.
 * @param from - APWToken, PT, Underlying or FYT.
 * @param to - APWToken, PT, Underlying or FYT.
 * @returns - a tokenPath, a namedTokenPath, a poolPath, and a visual representation of the tokenPath.
 */
export const howToSwap = (from: APWToken, to: APWToken) => {
  const { tokenPath, namedTokenPath, graphSearchResult } = findTokenPath(from, to)
  const poolPath = findPoolPath(graphSearchResult)

  return {
    tokenPath,
    poolPath,
    namedTokenPath,
    visual: graphSearchResult?.join('->')
  }
}

/**
 * Return the Token contract instances of an amm.
 * @param signerOrProvider
 * @param amm - AMM instance on which the pool tokens are required.
 * @param pairId - token pair id - 0 or 1
 * @returns - a tuple of token contracts.
 */
export const getPoolTokens = async (signerOrProvider: Signer | Provider, amm: AMM, pairId: PairId) => {
  const [ptAddress, underlyingAddress, fytAddress] = await Promise.all([
    amm.getPTAddress(),
    amm.getUnderlyingOfIBTAddress(),
    amm.getFYTAddress()
  ])

  const tokens = {
    PT: PT__factory.connect(ptAddress, signerOrProvider),
    Underlying: IERC20__factory.connect(underlyingAddress, signerOrProvider),
    FYT: FutureYieldToken__factory.connect(fytAddress, signerOrProvider)
  }

  const pool = pools.findEdge((edge) => pools.getEdgeAttributes(edge).pair === pairId)

  const token1 = pools.source(pool) as APWToken
  const token2 = pools.target(pool) as APWToken

  return [
    tokens[token1],
    tokens[token2]
  ]
}
