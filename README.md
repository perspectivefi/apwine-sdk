# Getting Started

```
npm install @apwine/sdk
```

```ts
import APWineSDK from '@apwine/sdk'

const provider = new providers.AlchemyProvider('kovan', process.env.ALCHEMY_API_KEY)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, alchemyProvider)
const sender = '0xdf3d1C11752B35A5a3d984cC86E5A535745412Fe'

// signer is not mandatory if you only want to fetch data, for transactions it's required

const sdk =  new APWineSDK({ network: 'kovan', provider, signer, sender })


// ... later
const vaults = await sdk.fetchAllFutureVaults()
const result = await sdk.withdraw(vaults[0], 100)

```