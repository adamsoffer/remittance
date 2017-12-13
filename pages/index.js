import React from 'react'
import { default as contract } from 'truffle-contract'
import remittanceArtifacts from '../build/contracts/Remittance.json'
import web3 from '../lib/web3'
import Main from '../lib/layout'
import Button from '../components/Button'
import Textfield from '../components/Textfield'

const Remittance = contract(remittanceArtifacts)

Remittance.setProvider(web3.currentProvider)

export default class extends React.Component {
  static async getInitialProps({ pathname }) {
    const account = await getAccount()
    return {
      account
    }
  }

  deposit(event) {
    event.preventDefault()
    let deposit = web3.utils.toWei(event.target.deposit.value, 'ether')
    let beneficiary = event.target.beneficiary.value
    let password1 = event.target.password1.value
    let password2 = event.target.password2.value 
    let hashedPassword = web3.utils.soliditySha3(password1 + password2)

    Remittance.deployed()
    .then(instance => {
      return instance.deposit(beneficiary, hashedPassword, {
        from: this.props.account,
        value: deposit
      })
    })
    .then(instance => {
      console.log(instance)
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
    .then(instance => {
      return instance.withdraw(password1, password2, {
        from: this.props.account
      })
    })
    .then(instance => {
      console.log(instance)
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
            <Textfield
              label="Password 1"
              type="password"
              name="password1"
            />
            <Textfield
              label="Password 2"
              type="password"
              name="password2"
            />
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
            <Textfield
              label="Password 1"
              type="password"
              name="password1"
            />
            <Textfield
              label="Password 2"
              type="password"
              name="password2"
            />
            <Button type="submit">Withdraw</Button>
          </form>
        </div>
      </Main>
    )
  }
}

function getAccount() {
  return new Promise(function(resolve, reject) {
    web3.eth.getAccounts((err, accounts) => {
      if (err != null) {
        reject('There was an error fetching your accounts.')
      }
      if (accounts.length === 0) {
        reject(
          'Could not get any accounts! Make sure your Ethereum client is configured correctly.'
        )
        return
      }
      resolve(accounts[0])
    })
  })
}
