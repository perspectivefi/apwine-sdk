import config from './config.json'
import { Network, Pool } from './types'

export const MINUTE = 60
export const HOUR = MINUTE * 60
export const DAY = HOUR * 24
export const WEEK = DAY * 7
export const YEAR = WEEK * 52

export const PAIR_IDS = [0, 1] as const

export const NETWORKS = Object.keys(config.networks) as Network[]

export const CHAIN_IDS = {
  kovan: 42,
  mainnet: 1,
  polygon: 137
} as const

export const APW_TOKENS = ['PT', 'Underlying', 'FYT'] as const

export const POOL_ONE: Pool = ['PT', 'Underlying']
export const POOL_TWO: Pool = ['PT', 'FYT']
