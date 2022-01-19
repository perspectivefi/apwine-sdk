import { bidirectional, edgePathFromNodePath } from 'graphology-shortest-path'
import { PairId } from '..'
import { APWToken } from '../constants'
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
