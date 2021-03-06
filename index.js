const express = require('express');
const Web3 = require('web3');
const token_abi = require('./token_abi.js');
const vesting_abi = require('./vesting_abi.js');
const cache = require('memory-cache');

const START_BLOCK = process.env.START_BLOCK;
const END_BLOCK = process.env.END_BLOCK;
const PROVIDER_URL = process.env.PROVIDER_URL;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const VESTING_ADDRESS = process.env.VESTING_ADDRESS;
const CACHE_DURATION = process.env.CACHE_DURATION;

if(!START_BLOCK) {
  console.error("$START_BLOCK must be defined");
  process.exit(1);
}

if(!END_BLOCK) {
  console.error("$END_BLOCK must be defined");
  process.exit(1);
}


if(!PROVIDER_URL) {
  console.error("$PROVIDER_URL must be defined");
  process.exit(1);
}


if(!TOKEN_ADDRESS) {
  console.error("$TOKEN_ADDRESS must be defined");
  process.exit(1);
}


if(!VESTING_ADDRESS) {
  console.error("$VESTING_ADDRESS must be defined");
  process.exit(1);
}

if(!CACHE_DURATION) {
  console.error("$CACHE_DURATION must be defined");
  process.exit(1);
}

const web3 = new Web3(PROVIDER_URL);

const token_contract = new web3.eth.Contract(token_abi, TOKEN_ADDRESS);
const vesting_contract = new web3.eth.Contract(vesting_abi, VESTING_ADDRESS);

const app = express();
const port = 8080;

const memCache = new cache.Cache();
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key =  '__express__' + req.originalUrl || req.url;
    const cacheContent = memCache.get(key);
    if(cacheContent) {
      res.send(cacheContent);
      return;
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        memCache.put(key, body, duration*1000);
        res.sendResponse(body)
      };
      next();
    }
  };
};

const get_total_supply = async () => {
  return Number(web3.utils.fromWei(await token_contract.methods.totalSupply().call()));
};

const get_total_unlocked = async () => {
  const tranche_created = await vesting_contract.getPastEvents('Tranche_Created', {
    fromBlock: START_BLOCK,
    toBlock: END_BLOCK
  });
  const tranches = {};
  tranche_created.forEach((e) => {
    const cliff_start = Number(e.returnValues.cliff_start);
    const duration = Number(e.returnValues.duration);
    const ts = Math.round(new Date().getTime() / 1000);
    const complete_ratio = Math.min(Math.max((ts - cliff_start) / duration, 0), 1);
    tranches[e.returnValues.tranche_id] = {
      cliff_start,
      duration,
      complete_ratio
    }
  });
  const tranche_balance_added = await vesting_contract.getPastEvents('Tranche_Balance_Added', {
    fromBlock: START_BLOCK, 
    toBlock: END_BLOCK
  });
  let unlocked = 0;
  tranche_balance_added.forEach((e) => {
    const tranche = tranches[e.returnValues.tranche_id];
    const amount = Number(web3.utils.fromWei(e.returnValues.amount));
    if(tranche) {
      unlocked += amount * tranche.complete_ratio;
    }
  });
  return unlocked;
};

app.get('/circulating', cacheMiddleware(CACHE_DURATION), async (req, res) => {
  const unlocked = await get_total_unlocked();
  res.send(unlocked.toString());
});

app.get('/total', cacheMiddleware(CACHE_DURATION), async (req, res) => {
  const total_supply = await get_total_supply();
  res.send(total_supply.toString());
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
