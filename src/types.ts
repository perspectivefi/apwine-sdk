import { BigNumber, BigNumberish, ContractTransaction, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { AMM } from '@apwine/amm'
import { apwTokens, PAIR_IDS } from './constants'
import config from './config.json'

export type Error = {
    error?: string
  }

export type Options = {
    autoApprove?: boolean
  }

export type PairId = typeof PAIR_IDS[number]
export type Network = keyof typeof config.networks

export type QueryParams = {
    signerOrProvider: Signer | Provider
  }

export type TransactionParams = {
    signer: Signer
  }

export type WithNetwork = {
    network: Network
  }

export type APWToken = typeof apwTokens[number]
export type Pool = [APWToken, APWToken]

export type SDKFunctionReturnType<T> = Error & T
export type Transaction = { transaction?: ContractTransaction }

export type FutureAggregate = {
    address: string
    ibtAddress: string
    apwibtAddress: string
    period: BigNumber
    platform: string
    depositsPaused: boolean
    withdrawalsPaused: boolean
    nextPeriodIndex: BigNumber
    nextPeriodTimestamp: BigNumber
}

export type RemoveLiquidityParams = {
    amm: AMM,
    pairId: PairId,
    amount: BigNumberish,
    minAmountsOut?: [BigNumberish, BigNumberish],
    account?: string
}

export type AddLiquidityParams = {
    amm: AMM,
    pairId: PairId,
    amount: BigNumberish,
    maxAmountsIn?: [BigNumberish, BigNumberish],
    account?: string
}
