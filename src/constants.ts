import config from './config.json'

export const PAIR_IDS = [0, 1] as const
export type PairId = typeof PAIR_IDS[number]

export type Network = keyof typeof config.networks
export const NETWORKS = Object.keys(config.networks) as Network[]

export const CHAIN_IDS: Record<Network, number> = {
  kovan: 42,
  mainnet: 1,
  polygon: 137
}
