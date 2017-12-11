# Splitter

## Requirements

1. Node
2. testrpc & Metamask
3. Truffle

## Building and the frontend

1. Run `testrpc`
2. Point Metamask to your local network `http://localhost:8545`
3. Import account generated by testrpc into Metamask
4. Clone project at https://github.com/ads1018/splitter
5. Run `npm install` to install the dependencies
6. Inside the project root run `truffle compile`, then run `truffle migrate` to
   deploy the contracts to the local network.
7. Run `npm run build` and then `npm start` to build the app and serve it on
   http://localhost:5000
