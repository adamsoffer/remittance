const web3 = require('../lib/web3')
const Remittance = artifacts.require('./Remittance.sol')

contract('Remittance', function(accounts) {
  let deposit = web3.utils.toWei('2', 'ether')
  let password1 = 'b9labs'
  let password2 = 'rules'
  let remittance
  before('should deploy Remittance', async function() {
    remittance = await Remittance.new({ from: accounts[0] })
  })

  describe('deposit()', async function() {
    it('should deposit 2 ether to beneficary', async function() {
      let hashedPassword = web3.utils.soliditySha3(password1 + password2)
      let tx = await remittance.deposit(accounts[1], hashedPassword, {
        from: accounts[0],
        value: deposit
      })
      assert.strictEqual(
        tx.logs[0].args.amount.toString(10),
        deposit.toString(10)
      )
    })
  })

  describe('withdraw()', async function() {
    it('should withdraw 2 ether from fund', async function() {
      let tx = await remittance.withdraw(password1, password2, {
        from: accounts[1]
      })
      assert.strictEqual(
        tx.logs[0].args.amount.toString(10),
        deposit.toString(10)
      )
    })
  })
})
