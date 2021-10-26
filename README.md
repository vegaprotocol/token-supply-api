# Token Supply APY

This API returns the circulating supply of VEGA tokens by reading directly from the [VEGA token contract](https://etherscan.io/address/0xcb84d72e61e383767c4dfeb2d8ff7f4fb89abc6e) and the [VEGA vesting contract](https://etherscan.io/address/0x23d1bfe8fa50a167816fbd79d7932577c06011f4).

## Build and Run

This app is a simple Node.js Express API. You can build and run the service by running `yarn install` followed by `node index.js`.

The API exposes two endpoints:

* http://localhost:3000/circulating
* http://localhost:3000/total

## Environment

This app requires the following environment variables to be set:

* `INFURA_KEY`
