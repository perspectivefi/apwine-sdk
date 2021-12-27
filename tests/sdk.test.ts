import path from 'path'
import dotenv from 'dotenv'
import { ethers, providers, Signer } from 'ethers'
import APWineSDK from '../src/sdk'
import { AlchemyProvider, Provider } from '@ethersproject/providers'
import { SigningKey } from 'ethers/lib/utils'

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

describe('APWineSDK', () => {
  let url: string,
    provider: Provider,
    alchemyProvider: AlchemyProvider,
    signer: Signer,
    sdk: APWineSDK

  beforeAll(() => {
    dotenv.config({ path: path.resolve(__dirname, '../.env') })

    url = `https://eth-kovan.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
    alchemyProvider = new providers.AlchemyProvider(
      'kovan',
      process.env.ALCHEMY_API_KEY
    )

    signer = new ethers.Wallet(
      (process.env.PRIVATE_KEY as unknown) as SigningKey,
      alchemyProvider
    )

    sdk = new APWineSDK({
      provider: alchemyProvider,
      signer,
      network: 'mainnet'
    })
  })

  it('should have the network set', async () => {
    expect(sdk.network).toBe('kovan')
  })

  it('should have the signer or provider set', async () => {
    expect(sdk.provider).toBeDefined()
  })

  it('should have the amm instance set', async () => {
    expect(sdk.AMM).toBeDefined()
  })

  it('should have the registry instance set', async () => {
    expect(sdk.Registry).toBeDefined()
  })

  it('should eventually have the controller instance set', async () => {
    expect(sdk.Controller).toBeUndefined()
    await delay(2000)
    expect(sdk.Controller).toBeDefined()
  })

  it('should should', async () => {
    const vaults = await sdk.fetchAllFutureVaults()
    const result = await sdk.withdraw(vaults[0], 1)

    // console.log(result)

    const pools = await sdk.fetchAllLPTokenPools()
    console.log(pools)
  })
})
