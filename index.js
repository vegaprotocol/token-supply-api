const express = require('express');
const Web3 = require('web3');
const token_abi = require('./token_abi.js');
const vesting_abi = require('./vesting_abi.js');

const INFURA_KEY = process.env.INFURA_KEY;

const web3 = new Web3(`https://mainnet.infura.io/v3/${INFURA_KEY}`);

const token_contract = new web3.eth.Contract(token_abi, '0xcB84d72e61e383767C4DFEb2d8ff7f4FB89abc6e');
const vesting_contract = new web3.eth.Contract(vesting_abi, '0x23d1bFE8fA50a167816fBD79D7932577c06011f4');

const app = express();
const port = 3000;

const get_total_supply = async () => {
  return Number(web3.utils.fromWei(await token_contract.methods.totalSupply().call()));
};

const get_total_unlocked = async () => {
  const tranche_created = await vesting_contract.getPastEvents('Tranche_Created', {
    fromBlock: 12834523,
    toBlock: 'latest'
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
    fromBlock: 12834523, 
    toBlock: 'latest'
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

app.get('/circulating', async (req, res) => {
  const unlocked = await get_total_unlocked();
  res.send(unlocked.toString());
});

app.get('/total', async (req, res) => {
  const total_supply = await get_total_supply();
  res.send(total_supply.toString());
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
