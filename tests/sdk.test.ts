import path from 'path'
import dotenv from 'dotenv'
import { ethers, providers, Signer } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { parseUnits } from 'ethers/lib/utils'
import APWineSDK from '../src/sdk'
import { getTokencontract } from '../src/contracts'

jest.setTimeout(30000)

describe('APWineSDK', () => {
  let provider: JsonRpcProvider, signer: Signer, sdk: APWineSDK, ptAddress: string

  beforeAll(() => {
    dotenv.config({ path: path.resolve(__dirname, '../.env') })

    // url = `https://eth-kovan.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
    provider = new providers.JsonRpcProvider(
      `https://rpc.tenderly.co/fork/${process.env.TENDERLY_FORK_ID}`,
      'mainnet'
    )

    signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)
  })

  // afterAll(async () => {
  //   await sdk.ready
  //   sdk.swapIn({ from: 'Underlying', to: 'PT', amm: sdk.AMMs[0], amount: parseUnits('20', 18) }, { autoApprove: true })
  // })

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

  it('AMMs should be loaded eventually', async () => {
    await sdk.ready

    expect(sdk.AMMs.map((amm) => amm.address)).toEqual([
      '0x8A362AA1c81ED0Ee2Ae677A8b59e0f563DD290Ba',
      '0xc61C0F4961F2093A083f47a4b783ad260DeAF7eA',
      '0x1604C5e9aB488D66E983644355511DCEF5c32EDF',
      '0xA4085c106c7a9A7AD0574865bbd7CaC5E1098195',
      '0x0CC36e3cc5eACA6d046b537703ae946874d57299'
    ])
  })

  it('Should be able to swapIn', async () => {
    await sdk.ready

    const ptAddress = await sdk.AMMs[0].getPTAddress()
    const token = await getTokencontract(sdk.provider, ptAddress)
    const user = await signer.getAddress()
    const balance = await token.balanceOf(user)
    const swap = await sdk.swapIn({ from: 'PT', to: 'Underlying', amm: sdk.AMMs[0], amount: parseUnits('10', 18) }, { autoApprove: true })

    await swap.transaction?.wait()

    const newBalance = await token.balanceOf(user)

    expect(balance.gt(newBalance)).toBe(true)
  })

  it.only('Should be able to swapOut', async () => {
    await sdk.ready

    const ptAddress = await sdk.AMMs[0].getPTAddress()
    const token = await getTokencontract(sdk.provider, ptAddress)
    const user = await signer.getAddress()
    const balance = await token.balanceOf(user)

    const swap = await sdk.swapOut({ from: 'PT', to: 'Underlying', amm: sdk.AMMs[0], amount: parseUnits('10', 18) }, { autoApprove: true })
    await swap.transaction?.wait()

    const newBalance = await token.balanceOf(user)

    expect(balance.gt(newBalance)).toBe(true)
  })
})
