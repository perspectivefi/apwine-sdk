<div id="top"></div>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/APwine/apwine-sdk">
    <img src="https://app.apwine.fi/_next/image?url=%2Fimages%2Ftokens%2Fapw.png&w=3840&q=75" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">APWine SDK</h3>

<!--   <p align="center">
    An awesome README template to jumpstart your projects!
    <br />
    <a href="https://github.com/othneildrew/Best-README-Template"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/othneildrew/Best-README-Template">View Demo</a>
    ·
    <a href="https://github.com/othneildrew/Best-README-Template/issues">Report Bug</a>
    ·
    <a href="https://github.com/othneildrew/Best-README-Template/issues">Request Feature</a>
  </p> -->
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

This is the SDK which lets you interact with the APWine protocol, and the contracts.

#### For more detailed information, visit the [documentation][docs-url] page.

<p align="right">(<a href="#top">back to top</a>)</p>



### Built With

* [Typescript](https://www.typescriptlang.org/)
* [Ethers](https://docs.ethers.io/)
* [TSDX](https://tsdx.io/)
* [Ramda](https://ramdajs.com/)


<p align="right">(<a href="#top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

* npm
  ```sh
  npm install @apwine/sdk
  ```
* yarn
  ```sh
  yarn add @apwine/sdk
  ```
###### Note: You can access the raw typechain output of our contracts by installing ```@apwine/protocol & @apwine/amm```

<!-- USAGE EXAMPLES -->
## Usage

```ts

import APWineSDK from '@apwine/sdk'
import ethers from 'ethers'
// ...

// You will need a provider for queries.
// Note: Providers will automatically get wrapped into a MulticallProvider.
const alchemyProvider = new ethers.providers.AlchemyProvider(
  'kovan',
  #YOUR ALCHEMY API KEY
)

// You will need a signer for transactions.
// Note: if you want to fetch data only, this can be omitted.
const signer = new ethers.Wallet(
  #YOUR PRIVATE KEY,
  alchemyProvider


// Create an SDK instance

const sdk = new APWineSDK({
  provider: alchemyProvider,
  signer,
  network: 'kovan'
})

// Fetch all future vaults, then inspect and withdraw from one

  await sdk.ready // ready signifies, that we loaded all asynchronous props, like the Controller, or the LP.
  const vaults = await sdk.fetchAllFutureVaults()
  const { 
    ibtAddress,
    apwibtAddress,
    period,
    platform,
    depositsPaused,
    withdrawalsPaused,
    nextPeriodIndex,
    nextPeriodTimestamp
  } = await sdk.fetchFutureAggregateFromAddress(vaults[0].address)

  const receipt = await sdk.withdraw(vaults[0], 1000)
}

```

```ts
import { howToSwap } from '@apwine/sdk/utils/swap'

// get swap information
const { namedTokenPath } = howToSwap('FYT', 'Underlying')
console.log(namedTokenPath)) // ['FYT', 'PT', 'PT', 'Underlying']

// fetch all AMMs 
const amms = await sdk.fetchAllAMMs()

// swap some tokens

const transaction = 
    await sdk.swapIn({
        amm: amms[0],
        from: 'FYT',
        to: 'PT'
        amount: 100
        deadline: (new Date(Date.now() + 60 * 1000)).getTime()
    }, { autoApprove: true })

```

#### For transactions you will need a signer, if you want to just read information, a provider is enough.
<!-- _For more examples, please refer to the [Documentation](https://example.com)_
 -->
<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap
- [x] Add support for deposit & withdraw
- [x] Add support for token swaps
- [x] Add support for spot price
- [x] Add support for distinct import routes
- [ ] Add support for stats fetching
- [ ] Add support for zaps

See the [open issues](https://github.com/othneildrew/Best-README-Template/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

APWine Finance - [@APWineFinance](https://twitter.com/APWineFinance) - support@apwine.com

Project Link: [https://github.com/APWine/apwine-sdk](https://github.com/APWine/apwine-sdk)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[docs-url]: https://apwine-sdk.vercel.app/
[contributors-shield]: https://img.shields.io/github/contributors/APWine/apwine-sdk.svg?style=for-the-badge
[contributors-url]: https://github.com/APWine/apwine-sdk/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/APWine/apwine-sdk.svg?style=for-the-badge
[forks-url]: https://github.com/apwine/apwine-sdk/network/members
[stars-shield]: https://img.shields.io/github/stars/APWine/apwine-sdk.svg?style=for-the-badge
[stars-url]:https://github.com/APWine/apwine-sdk/stargazers
[issues-shield]: https://img.shields.io/github/issues/APWine/apwine-sdk.svg?style=for-the-badge
[issues-url]: https://github.com/APWine/apwine-sdk/issues
[license-shield]: https://img.shields.io/github/license/APWine/apwine-sdk.svg?style=for-the-badge
[license-url]: https://github.com/APWine/apwine-sdk/blob/master/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/company/apwine/
