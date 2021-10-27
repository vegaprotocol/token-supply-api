# Token Supply APY

This API returns the circulating supply of VEGA tokens by reading directly from the [VEGA token contract](https://etherscan.io/address/0xcb84d72e61e383767c4dfeb2d8ff7f4fb89abc6e) and the [VEGA vesting contract](https://etherscan.io/address/0x23d1bfe8fa50a167816fbd79d7932577c06011f4).

## Build and Run

The easiest way to build and run this app is using Docker:

1. Copy `.env.sample` to `.env` and provide values for the defined variables
2. Run `docker build -t token-supply-api .`
3. Run `docker run -p 8080:8080 --env-file ./.env token-supply-api`
