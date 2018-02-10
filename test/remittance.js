const Promise = require('bluebird')
const web3 = require('../lib/web3')
const Remittance = artifacts.require('./Remittance.sol')
const addEvmFunctions = require('../lib/evmFunctions.js')

contract('Remittance', function(accounts) {
  addEvmFunctions(web3)
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' })
  Promise.promisifyAll(web3.evm, { suffix: 'Promise' })

  let deposit = web3.utils.toWei('2', 'ether')
  let password1 = web3.utils.fromAscii('b9labs')
  let password2 = web3.utils.fromAscii('rules')
  let password3 = web3.utils.fromAscii('hello')
  let password4 = web3.utils.fromAscii('world')

  let hash1
  let hash2
  let remittance

  beforeEach('should deploy Remittance', async function() {
    remittance = await Remittance.new({ from: accounts[0] })
    hash1 = await remittance.generateHash(password1, password2)
    hash2 = await remittance.generateHash(password3, password4)
  })

  describe('deposit()', async function() {
    it('should send 2 Ether from Alice to Bob', async function() {
      let contractBalanceBefore = await web3.eth.getBalance(remittance.address)
      let fundAmountBeforeDeposit = await remittance.funds(hash1)
      let deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      await remittance.deposit(accounts[1], deadline, hash1, {
        from: accounts[0],
        value: deposit
      })

      let fundAmountAfterDeposit = await remittance.funds(hash1)
      assert.strictEqual(
        (Number(fundAmountBeforeDeposit[2]) + Number(deposit)).toString(10),
        fundAmountAfterDeposit[2].toString(10)
      )
      let contractBalanceAfter = await web3.eth.getBalance(remittance.address)
      assert.strictEqual(
        deposit.toString(10),
        (contractBalanceAfter - contractBalanceBefore).toString(10)
      )
      contractBalanceAfter = await web3.eth.getBalance(remittance.address)
      assert.strictEqual(
        deposit.toString(10),
        (contractBalanceAfter - contractBalanceBefore).toString(10)
      )
    })
  })

  describe('withdraw()', async function() {
    it('should withdraw 2 ether for bob', async function() {
      let deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      await remittance.deposit(accounts[1], deadline, hash1, {
        from: accounts[0],
        value: deposit
      })
      let contractBalanceBefore = await web3.eth.getBalance(remittance.address)
      let bobAccountBalanceBefore = await web3.eth.getBalance(accounts[1])
      let fundAmountBeforeWithdrawal = await remittance.funds(hash1)
      let gasPrice = await web3.eth.getGasPrice()
      let tx = await remittance.withdraw(password1, password2, {
        from: accounts[1],
        gas: '1500000',
        gasPrice
      })

      gasCost = web3.utils
        .toBN(gasPrice)
        .mul(web3.utils.toBN(tx.receipt.gasUsed))

      let fundAmountAfterWithdrawal = await remittance.funds(hash1)
      assert.strictEqual(
        fundAmountAfterWithdrawal[2].toString(10),
        (Number(fundAmountBeforeWithdrawal[2]) - Number(deposit)).toString(10)
      )
      let contractBalanceAfter = await web3.eth.getBalance(remittance.address)
      assert.strictEqual(
        deposit.toString(10),
        (contractBalanceBefore - contractBalanceAfter).toString(10)
      )

      let bobAccountBalanceAfter = await web3.eth.getBalance(accounts[1])

      assert.strictEqual(
        web3.utils
          .toBN(bobAccountBalanceBefore)
          .add(web3.utils.toBN(deposit))
          .toString(10),
        web3.utils
          .toBN(bobAccountBalanceAfter)
          .add(gasCost)
          .toString(10)
      )
    })
  })

  describe('reclaim()', async function() {
    it('should reclaim 2 ether after the deadline passes', async function() {
      let deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      await remittance.deposit(accounts[1], deadline, hash2, {
        from: accounts[0],
        value: deposit
      })

      let contractBalanceBeforeReclaim = await web3.eth.getBalance(
        remittance.address
      )
      let fundAmountBeforeReclaim = await remittance.funds(hash2)

      let aliceAccountBalanceBeforeReclaim = await web3.eth.getBalance(
        accounts[0]
      )

      await web3.evm.increaseTimePromise(4000)
      let gasPrice = await web3.eth.getGasPrice()
      let tx = await remittance.reclaim(hash2, {
        from: accounts[0],
        gas: '1500000',
        gasPrice
      })

      gasCost = web3.utils
        .toBN(gasPrice)
        .mul(web3.utils.toBN(tx.receipt.gasUsed))

      let fundAmountAfterReclaim = await remittance.funds(hash2)
      assert.strictEqual(
        fundAmountAfterReclaim[2].toString(10),
        (Number(fundAmountBeforeReclaim[2]) - Number(deposit)).toString(10)
      )

      let contractBalanceAfterReclaim = await web3.eth.getBalance(
        remittance.address
      )
      assert.strictEqual(
        deposit.toString(10),
        (contractBalanceBeforeReclaim - contractBalanceAfterReclaim).toString(
          10
        )
      )

      let aliceAccountBalanceAfterReclaim = await web3.eth.getBalance(
        accounts[0]
      )

      assert.strictEqual(
        web3.utils
          .toBN(aliceAccountBalanceBeforeReclaim)
          .add(web3.utils.toBN(deposit))
          .toString(10),
        web3.utils
          .toBN(aliceAccountBalanceAfterReclaim)
          .add(gasCost)
          .toString(10)
      )
    })
  })
})
