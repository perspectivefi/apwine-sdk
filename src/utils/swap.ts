import { bidirectional, edgePathFromNodePath } from 'graphology-shortest-path'
import { BigNumber, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { AMM } from '@apwine/amm'
import { FutureYieldToken__factory, IERC20__factory, PT__factory } from '@apwine/protocol'
import { PairId, APWToken } from '../constants'
import pools from './pools'

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

export const applySlippage = (n: BigNumber, slippagePercentage: number) =>
  n.mul(10000 + slippagePercentage * 100).div(10000)

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
