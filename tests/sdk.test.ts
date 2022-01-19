import path from 'path'
import dotenv from 'dotenv'
import { providers, Signer } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import APWineSDK from '../src/sdk'

describe('APWineSDK', () => {
  let provider: JsonRpcProvider, signer: Signer, sdk: APWineSDK

  beforeAll(() => {
    dotenv.config({ path: path.resolve(__dirname, '../.env') })

    // url = `https://eth-kovan.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
    provider = new providers.JsonRpcProvider(
      `https://rpc.tenderly.co/fork/${process.env.TENDERLY_FORK_ID}`,
      'mainnet'
    )

    signer = provider.getSigner()
  })

  beforeEach(() => {
    sdk = new APWineSDK({
      provider,
      signer,
      network: 'mainnet'

    })
  })

  it('should have the network set', async () => {
    expect(sdk.network).toBe('mainnet')
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

  it('should  have the Controller contract instance set after asyncProps are loaded', async () => {
    expect(sdk.Controller).toBeNull()
    await sdk.ready
    expect(sdk.Controller).toBeDefined()
  })

  it('should be able to tell how to swap tokens', () => {
    expect(sdk.howToSwap('Underlying', 'FYT')).toEqual(['Underlying', 'PT', 'PT', 'FYT'])
  })

  it('load vaults', async () => {
    await sdk.ready

    const vaults = await sdk.fetchAllFutureVaults()

    console.log(vaults)
  })
})
