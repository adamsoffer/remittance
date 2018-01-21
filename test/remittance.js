const web3 = require('../lib/web3')
const Remittance = artifacts.require('./Remittance.sol')

contract('Remittance', function(accounts) {
  let deposit = web3.utils.toWei('2', 'ether')
  let password1 = 'b9labs'
  let password2 = 'rules'
  let hashedPassword = web3.utils.soliditySha3(password1 + password2)
  let remittance
  let contractBalanceBefore
  let contractBalanceAfter

  before('should deploy Remittance', async function() {
    remittance = await Remittance.new({ from: accounts[0] })
  })

  describe('deposit()', async function() {
    it('should deposit 2 ether to the fund', async function() {
      contractBalanceBefore = await web3.eth.getBalance(remittance.address)
      let fundAmountBeforeDeposit = await remittance.funds(hashedPassword)

      await remittance.deposit(accounts[1], hashedPassword, {
        from: accounts[0],
        value: deposit
      })

      let fundAmountAfterDeposit = await remittance.funds(hashedPassword)
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
    it('should withdraw 2 ether from the fund', async function() {
      contractBalanceBefore = await web3.eth.getBalance(remittance.address)
      let fundAmountBeforeWithdrawal = await remittance.funds(hashedPassword)

      await remittance.withdraw(password1, password2, {
        from: accounts[1]
      })

      let fundAmountAfterWithdrawal = await remittance.funds(hashedPassword)
      assert.strictEqual(
        (Number(fundAmountBeforeWithdrawal[2]) - Number(deposit)).toString(10),
        fundAmountAfterWithdrawal[2].toString(10)
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
})
