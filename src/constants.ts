import { ContractTransaction } from 'ethers'
import config from './config.json'

export type Error = {
  error?: string
}

// Time constants
export const MINUTE = 60
export const HOUR = MINUTE * 60
export const DAY = HOUR * 24
export const WEEK = DAY * 7
export const YEAR = WEEK * 52

export const PAIR_IDS = [0, 1] as const
export type PairId = typeof PAIR_IDS[number]

export type Network = keyof typeof config.networks
export const NETWORKS = Object.keys(config.networks) as Network[]

export const CHAIN_IDS: Record<Network, number> = {
  kovan: 42,
  mainnet: 1,
  polygon: 137
}

export type APWToken = 'PT' | 'FYT' | 'Underlying'
export type Pool = [APWToken, APWToken]
export const pool1: Pool = ['PT', 'Underlying']
export const pool2: Pool = ['PT', 'FYT']

export type SDKFunctionReturnType<T> = Error & T
export type Transaction = { transaction?: ContractTransaction }
