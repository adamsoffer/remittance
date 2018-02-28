import React from 'react'
import { default as contract } from 'truffle-contract'
import Promise from 'bluebird'
import moment from 'moment'
import remittanceArtifacts from '../build/contracts/Remittance.json'
import web3 from '../lib/web3'
import Main from '../lib/layout'
import Button from '../components/Button'
import Textfield from '../components/Textfield'

const Remittance = contract(remittanceArtifacts)

web3.eth.getTransactionReceiptMined = require('../lib/getTransactionReceiptMined.js')

if (typeof web3.eth.getBlockPromise !== 'function') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' })
}

Remittance.setProvider(web3.currentProvider)

export default class extends React.Component {
  componentDidMount() {
    this.setAccount()
    this.onWithdraw()
  }

  async setAccount() {
    let accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
  }

  deposit(event) {
    event.preventDefault()
    let deposit = web3.utils.toWei(event.target.deposit.value, 'ether')
    let beneficiary = event.target.beneficiary.value
    let deadline = moment(event.target.deadline.value).unix()
    let password1 = event.target.password1.value
    let password2 = event.target.password2.value
    Remittance.deployed()
      .then(async instance => {
        let hash = await instance.generateHash(
          password1,
          password2,
          beneficiary
        )
        return instance.deposit.sendTransaction(deadline, hash, {
          from: this.state.account,
          value: deposit
        })
      })
      .then(function(txHashes) {
        console.log('pending confirmation...')
        return web3.eth.getTransactionReceiptMined(txHashes)
      })
      .then(function(receipts) {
        console.log('confirmed')
      })
      .catch(e => {
        console.log(e)
      })
  }

  withdraw(event) {
    event.preventDefault()
    let password1 = event.target.password1.value
    let password2 = event.target.password2.value
    Remittance.deployed()
      .then(async instance => {
        let gasPrice = await web3.eth.getGasPrice()
        return instance.withdraw.sendTransaction(password1, password2, {
          from: this.state.account,
          gas: '1500000',
          gasPrice
        })
      })
      .then(function(txHashes) {
        console.log('pending confirmation...')
        return web3.eth.getTransactionReceiptMined(txHashes)
      })
      .then(function(receipts) {
        console.log('confirmed')
      })
      .catch(e => {
        console.log(e)
      })
  }

  onWithdraw() {
    return Remittance.deployed().then(async instance => {
      let event = instance.LogWithdraw({}, { fromBlock: 0, toBlock: 'latest' })
      event.watch(async (error, e) => {
        if (!error) {
          console.log(e.args.amount.toString(10), e.args.ownersFee.toString(10))
        } else {
          console.log(error)
        }
      })
    })
  }

  reclaim(event) {
    event.preventDefault()
    let password1 = event.target.password1.value
    let password2 = event.target.password2.value

    Remittance.deployed()
      .then(async instance => {
        let hash = await instance.generateHash(
          password1,
          password2,
          this.state.account
        )
        let gasPrice = await web3.eth.getGasPrice()
        return instance.reclaim.sendTransaction(hash, {
          from: this.state.account,
          gas: '1500000',
          gasPrice
        })
      })
      .then(function(txHashes) {
        console.log('pending confirmation...')
        return web3.eth.getTransactionReceiptMined(txHashes)
      })
      .then(function(receipts) {
        console.log('confirmed')
      })
      .catch(e => {
        console.log(e)
      })
  }

  render() {
    return (
      <Main>
        <div style={{ maxWidth: '500px', margin: '50px auto 0 auto' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Remittance</h1>
          <form
            onSubmit={this.deposit.bind(this)}
            style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Deposit</h2>
            <Textfield label="Password 1" type="password" name="password1" />
            <Textfield label="Password 2" type="password" name="password2" />
            <Textfield label="Deadline" type="datetime-local" name="deadline" />
            <Textfield
              placeholder="ie: 0x22B544D19fFe43c6083327271D9F39020da30C65"
              label="Beneficiary address"
              type="text"
              name="beneficiary"
            />
            <Textfield
              placeholder="ex: 10"
              step="any"
              label="Deposit Amount"
              type="number"
              name="deposit"
            />
            <Button type="submit">Deposit</Button>
          </form>
          <form
            onSubmit={this.withdraw.bind(this)}
            style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Withdraw</h2>
            <Textfield label="Password 1" type="password" name="password1" />
            <Textfield label="Password 2" type="password" name="password2" />
            <Button type="submit">Withdraw</Button>
          </form>
          <form onSubmit={this.reclaim.bind(this)}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>
              Reclaim Funds
            </h2>
            <Textfield label="Password 1" type="password" name="password1" />
            <Textfield label="Password 2" type="password" name="password2" />
            <Button type="submit">Reclaim</Button>
          </form>
        </div>
      </Main>
    )
  }
}
