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
  let hashedPassword1 = web3.utils.soliditySha3(
    { t: 'bytes32', v: password1 },
    { t: 'bytes32', v: password2 }
  )
  let password3 = web3.utils.fromAscii('hello')
  let password4 = web3.utils.fromAscii('world')
  let hashedPassword2 = web3.utils.soliditySha3(
    { t: 'bytes32', v: password3 },
    { t: 'bytes32', v: password4 }
  )

  let remittance
  let contractBalanceBefore
  let contractBalanceAfter

  before('should deploy Remittance', async function() {
    remittance = await Remittance.new({ from: accounts[0] })
  })

  describe('deposit()', async function() {
    it('should send 2 Ether from Alice to Bob with hash 1', async function() {
      contractBalanceBefore = await web3.eth.getBalance(remittance.address)
      let fundAmountBeforeDeposit = await remittance.funds(hashedPassword1)
      let deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      await remittance.deposit(accounts[1], deadline, password1, password2, {
        from: accounts[0],
        value: deposit
      })

      let fundAmountAfterDeposit = await remittance.funds(hashedPassword1)
      assert.strictEqual(
        (Number(fundAmountBeforeDeposit[2]) + Number(deposit)).toString(10),
        fundAmountAfterDeposit[2].toString(10)
      )
    })

    it('should deposit 2 ether to the contract', async function() {
      contractBalanceAfter = await web3.eth.getBalance(remittance.address)
      assert.strictEqual(
        deposit.toString(10),
        (contractBalanceAfter - contractBalanceBefore).toString(10)
      )
    })
  })

  describe('withdraw()', async function() {
    it('should withdraw 2 ether for bob with hash1', async function() {
      contractBalanceBefore = await web3.eth.getBalance(remittance.address)
      let fundAmountBeforeWithdrawal = await remittance.funds(hashedPassword1)

      await remittance.withdraw(password1, password2, {
        from: accounts[1]
      })

      let fundAmountAfterWithdrawal = await remittance.funds(hashedPassword1)
      assert.strictEqual(
        fundAmountAfterWithdrawal[2].toString(10),
        (Number(fundAmountBeforeWithdrawal[2]) - Number(deposit)).toString(10)
      )
    })
    it('should withdraw 2 ether from the contract', async function() {
      contractBalanceAfter = await web3.eth.getBalance(remittance.address)
      assert.strictEqual(
        deposit.toString(10),
        (contractBalanceBefore - contractBalanceAfter).toString(10)
      )
    })
  })

  describe('reclaim()', async function() {
    it('should send another 2 Ether from Alice to Bob with hash 1', async function() {
      contractBalanceBefore = await web3.eth.getBalance(remittance.address)
      let fundAmountBeforeDeposit = await remittance.funds(hashedPassword2)
      let deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      await remittance.deposit(accounts[1], deadline, password3, password4, {
        from: accounts[0],
        value: deposit
      })

      let fundAmountAfterDeposit = await remittance.funds(hashedPassword2)
      assert.strictEqual(
        (Number(fundAmountBeforeDeposit[2]) + Number(deposit)).toString(10),
        fundAmountAfterDeposit[2].toString(10)
      )
    })

    it('should reclaim 2 ether after the deadline passes', async function() {
      let contractBalanceBefore = await web3.eth.getBalance(remittance.address)
      let fundAmountBeforeReclaim = await remittance.funds(hashedPassword2)
      let result = await web3.evm.increaseTimePromise(4000)
      await remittance.reclaim(password3, password4, {
        from: accounts[0]
      })

      let fundAmountAfterReclaim = await remittance.funds(hashedPassword2)
      assert.strictEqual(
        fundAmountAfterReclaim[2].toString(10),
        (Number(fundAmountBeforeReclaim[2]) - Number(deposit)).toString(10)
      )

      let contractBalanceAfter = await web3.eth.getBalance(remittance.address)
      assert.strictEqual(
        deposit.toString(10),
        (contractBalanceBefore - contractBalanceAfter).toString(10)
      )
    })
  })
})
