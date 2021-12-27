# Getting Started

```
npm install @apwine/sdk
```

```ts
import APWineSDK from '@apwine/sdk'

const provider = new providers.AlchemyProvider('kovan', process.env.ALCHEMY_API_KEY)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, alchemyProvider)
// signer is not mandatory
const sdk =  new APWineSDK({ network: 'kovan', provider, signer })


// ... later
const vaults = await sdk.fetchAllFutureVaults()
const result = await sdk.withdraw(vaults[0], 100)

```