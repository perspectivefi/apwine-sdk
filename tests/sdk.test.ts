import path from 'path'
import dotenv from 'dotenv'
import { ethers, providers, Signer } from 'ethers'
import { AlchemyProvider } from '@ethersproject/providers'
import { SigningKey } from 'ethers/lib/utils'
import APWineSDK from '../src/sdk'

describe('APWineSDK', () => {
  let alchemyProvider: AlchemyProvider, signer: Signer, sdk: APWineSDK

  beforeAll(() => {
    dotenv.config({ path: path.resolve(__dirname, '../.env') })

    // url = `https://eth-kovan.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
    alchemyProvider = new providers.AlchemyProvider(
      'kovan',
      process.env.ALCHEMY_API_KEY
    )

    signer = new ethers.Wallet(
      (process.env.PRIVATE_KEY as unknown) as SigningKey,
      alchemyProvider
    )
  })

  beforeEach(() => {
    sdk = new APWineSDK({
      provider: alchemyProvider,
      signer,
      network: 'kovan'

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

  it('should  have the Controller contract instance set after asyncProps are loaded', async () => {
    expect(sdk.Controller).toBeNull()
    await sdk.ready
    expect(sdk.Controller).toBeDefined()
  })

  it('should  have the LPToken contract instance set after asyncProps are loaded', async () => {
    expect(sdk.LP).toBeNull()
    await sdk.ready
    expect(sdk.LP).toBeDefined()
  })
})
