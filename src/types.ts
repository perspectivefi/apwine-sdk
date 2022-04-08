import { BigNumber, BigNumberish, ContractTransaction, Signer } from 'ethers'
import { Provider } from '@ethersproject/providers'
import { AMM } from '@apwine/amm'
import { FutureVault } from '@apwine/protocol'
import { APW_TOKENS, PAIR_IDS, CHAIN_IDS } from './constants'

export type Error = {
  error?: string
}

export type Options = {
  autoApprove?: boolean
}

export type PairId = typeof PAIR_IDS[number]
export type Network =
  | keyof typeof CHAIN_IDS
  | typeof CHAIN_IDS[keyof typeof CHAIN_IDS]
  | BigNumber

export type QueryParams = {
  signerOrProvider: Signer | Provider
}

export type TransactionParams = {
  signer: Signer
}

export type WithNetwork = {
  network: Network
}

export type APWToken = typeof APW_TOKENS[number]
export type Pool = [APWToken, APWToken]

export type SDKFunctionReturnType<T> = Error & T
export type Transaction = { transaction?: ContractTransaction }

export type RequireExclusive<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]

export type SDKProps = {
  network: Network
  provider: Provider
  signer?: Signer | null
  defaultSlippage?: number
}

export type SDKOptions = {
  initialize: boolean
}

export type FutureAggregate = {
  amm: AMM
  vault: FutureVault
  address: string
  ibtAddress: string
  ptAddress: string
  period: BigNumber
  platform: string
  depositsPaused: boolean
  withdrawalsPaused: boolean
  nextPeriodIndex: BigNumber
  nextPeriodTimestamp: BigNumber
}

export type SwapParams = {
  amm: AMM
  from: APWToken
  to: APWToken
  amount: BigNumberish
  slippageTolerance: number
  deadline?: Date
}

export type RemoveLiquidityParams = {
  amm: AMM
  pairId: PairId
  amount: BigNumberish
  minAmountsOut?: [BigNumberish, BigNumberish]
  account?: string
}

export type AddLiquidityParams = {
  amm: AMM
  pairId: PairId
  amount: BigNumberish
  maxAmountsIn?: [BigNumberish, BigNumberish]
  account?: string
}

export type WithOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>
