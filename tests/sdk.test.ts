import path from 'path'
import dotenv from 'dotenv'
import { ethers, providers, Signer } from 'ethers'
import { AlchemyProvider } from '@ethersproject/providers'
import { SigningKey } from 'ethers/lib/utils'
import APWineSDK from '../src/sdk'

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

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

  it('should eventually have the controller instance set', async () => {
    expect(sdk.Controller).toBeUndefined()
    await sdk.asyncProps
    expect(sdk.Controller).toBeDefined()
  })

  it('', async () => {
    const pt = await sdk.fetchPTTokens()

    const result = await Promise.all(pt.map(async (p) => (await p.balanceOf('0x11118ABa876b4550FAA71bb2F62E7c814F26753D')).toNumber()))
    console.log(result)

    // const lpIsAPPRoved = await sdk.isLPApprovedForAll('0x11118ABa876b4550FAA71bb2F62E7c814F26753D', )
    // console.log(lpIsAPPRoved)
  })
})
