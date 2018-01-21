import React from 'react'
import { default as contract } from 'truffle-contract'
import Promise from 'bluebird'
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
  static async getInitialProps({ pathname }) {
    const accounts = await web3.eth.getAccounts()
    return {
      accounts
    }
  }

  deposit(event) {
    event.preventDefault()
    let deposit = web3.utils.toWei(event.target.deposit.value, 'ether')
    let beneficiary = event.target.beneficiary.value
    let password1 = web3.utils.fromAscii(event.target.password1.value)
    let password2 = web3.utils.fromAscii(event.target.password2.value)
    let hashedPassword = web3.utils.soliditySha3(
      { t: 'bytes32', v: password1 },
      { t: 'bytes32', v: password2 }
    )

    Remittance.deployed()
      .then(instance => {
        return instance.deposit.sendTransaction(beneficiary, hashedPassword, {
          from: this.props.accounts[0],
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
    let password1 = web3.utils.fromAscii(event.target.password1.value)
    let password2 = web3.utils.fromAscii(event.target.password2.value)

    Remittance.deployed()
      .then(instance => {
        return instance.withdraw.sendTransaction(password1, password2, {
          from: this.props.accounts[0]
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
          <form onSubmit={this.deposit.bind(this)}>
            <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Deposit</h2>
            <Textfield label="Password 1" type="password" name="password1" />
            <Textfield label="Password 2" type="password" name="password2" />
            <Textfield
              placeholder="ex: 10"
              step="any"
              label="Deposit Amount"
              type="number"
              name="deposit"
            />
            <Textfield
              placeholder="ie: 0x22B544D19fFe43c6083327271D9F39020da30C65"
              label="Beneficiary address"
              type="text"
              name="beneficiary"
            />
            <Button type="submit">Deposit</Button>
          </form>
          <form onSubmit={this.withdraw.bind(this)}>
            <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Withdraw</h2>
            <Textfield label="Password 1" type="password" name="password1" />
            <Textfield label="Password 2" type="password" name="password2" />
            <Button type="submit">Withdraw</Button>
          </form>
        </div>
      </Main>
    )
  }
}
