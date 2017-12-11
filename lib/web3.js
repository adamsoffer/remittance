import Web3 from 'web3'

export default new Web3(Web3.givenProvider || "http://localhost:8545");
