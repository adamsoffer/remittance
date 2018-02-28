pragma solidity ^0.4.4;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./Mortal.sol";


contract Remittance is Mortal {
  using SafeMath for uint;

  struct Fund {
    address sender;
    uint amount;
    uint256 deadline;
  }

  // Store funds in a mapping behind a hashed password so that the contract can
  // be used by anyone with an address
  mapping(bytes32 => Fund) public funds;

  uint constant PERCENTAGE_CUT = 1;

  uint ownersBalance = 0;

  event LogDeposit(
    address indexed sender,
    uint amount,
    bytes32 indexed hash
  );

  event LogWithdraw(
    address indexed recipient,
    uint amount,
    bytes32 indexed hash,
    uint ownersFee
  );

  event LogOwnersBalanceWithdraw(
    uint amount
  );

  event LogReclaim(
    address indexed recipient,
    uint amount,
    bytes32 indexed hash
  );

  /**
    * Generates hash for client side applications and testing
    */
  function generateHash(bytes32 password1, bytes32 password2, address beneficiary) public pure returns (bytes32) {
    return keccak256(password1, password2, beneficiary);
  }
  
  function deposit(uint256 deadline, bytes32 hash) public payable returns (bool) {

    // Prevent fund from being overwritten by ensuring it doesn't already exist
    require(funds[hash].sender == 0);

    // Ensure deadline is set to sometime in the future, but not too far into the future (no more than 5 years)
    require(deadline > now && deadline < now + 157700000);

    require(msg.value > 0);
    
    funds[hash] = Fund({
      sender: msg.sender,
      amount: msg.value,
      deadline: deadline
    });

    LogDeposit(msg.sender, msg.value, hash);
    return true;
  }

  function withdraw(bytes32 password1, bytes32 password2) public returns (bool) {
    bytes32 hash = keccak256(password1, password2, msg.sender);
    
    // Struct type, Fund, is assigned to a local variable (of the default storage data location).
    // This does not copy the struct but only stores a reference so that assignments to members
    // of the local variable actually write to the state.
    Fund storage fund = funds[hash];

    // Ensure the fund exists
    require(fund.sender != 0);

    // Anyone in possession of the two passwords *except* for the original 
    // depositer is allowed to withdraw the funds (the depositer can use the
    // reclaim function after the deadline passes if no one withdraws the fund).
    require(fund.sender != msg.sender);

    // Ensure the deadline hasn't past
    require(now <= fund.deadline);

    // Ensure no one has already claimed the fund
    require(fund.amount != 0);
    
    uint amount = fund.amount;

    require(amount > 0);

    uint ownersFee = amount.mul(PERCENTAGE_CUT).div(100);
    
    uint amountMinusOwnersFee = amount.sub(ownersFee);

    fund.amount = 0;

    ownersBalance.add(ownersFee);
    
    msg.sender.transfer(amountMinusOwnersFee);

    LogWithdraw(msg.sender, amountMinusOwnersFee, hash, ownersFee);

    return true;
  }


  /**
  * Allows sender to reclaim the funds if the deadline is passed.
  */
  function reclaim(bytes32 hash) public returns (bool) {
    Fund storage fund = funds[hash];

    // Ensure the fund exists
    require(fund.sender != 0);

    // Ensure the deadline is passed
    require(now > fund.deadline);

    // Ensure no one has already claimed the fund
    require(fund.amount != 0);

    // Ensure that only the sender specified in the fund can reclaim
    require(msg.sender == fund.sender);
    
    uint amount = fund.amount;
    
    require(amount > 0);

    fund.amount = 0;

    msg.sender.transfer(amount);

    LogReclaim(msg.sender, amount, hash);

    return true;
  }

  function withdrawOwnersBalance() public returns (bool) {
    require(msg.sender == owner);
    require(ownersBalance > 0);
    uint balance = ownersBalance;
    ownersBalance = 0;
    msg.sender.transfer(balance);
    return true;
  }

  // Fallback function
  function() public {
    revert();
  }
}
