pragma solidity ^0.4.4;

import "./Mortal.sol";


contract Remittance is Mortal {
  struct Fund {
    address beneficiary;
    address sender;
    uint amount;
    uint256 deadline;
  }

  // Store funds in a mapping behind a hashed password so that the contract can
  // be used by anyone with an address
  mapping(bytes32 => Fund) public funds;

  event LogDeposit(
    address indexed sender,
    address indexed beneficiary,
    uint amount,
    uint contractBalance
  );

  event LogWithdraw(
    address indexed recipient,
    uint amount,
    uint contractBalance
  );

  event LogReclaim(
    address indexed recipient,
    uint amount,
    uint contractBalance
  );
  
  function deposit(address beneficiary, uint256 deadline, bytes32 password1, bytes32 password2) public payable returns (bool) {
    require(beneficiary != 0);
    
    bytes32 hashedPassword = keccak256(password1, password2);

    // Prevent fund from being overwritten by ensuring it doesn't already exist
    require(funds[hashedPassword].sender == 0);

    // Ensure deadline is set to sometime in the future
    require(deadline > now);

    require(msg.value > 0);
    
    funds[hashedPassword] = Fund({
      beneficiary: beneficiary,
      sender: msg.sender,
      amount: msg.value,
      deadline: deadline
    });

    LogDeposit(msg.sender, beneficiary, msg.value, this.balance);
    return true;
  }

  function withdraw(bytes32 password1, bytes32 password2) public returns (bool) {
    bytes32 key = keccak256(password1, password2);

    // Struct type, Fund, is assigned to a local variable (of the default storage data location).
    // This does not copy the struct but only stores a reference so that assignments to members
    // of the local variable actually write to the state.
    Fund storage fund = funds[key];

    // Ensure the fund exists
    require(fund.sender != 0);

    // Ensure the deadline hasn't past
    require(now < fund.deadline);

    // Ensure no one has already claimed the fund
    require(fund.amount != 0);

    // Ensure that only the beneficiary specified in the fund can claim
    require(msg.sender == fund.beneficiary);
    
    uint amount = fund.amount;
    
    require(amount > 0);

    fund.amount = 0;

    msg.sender.transfer(amount);

    LogWithdraw(msg.sender, amount, this.balance);

    return true;
  }


  /**
  * Allows sender to reclaim the funds if the deadline is passed.
  */
  function reclaim(bytes32 password1, bytes32 password2) public returns (bool) {
    bytes32 key = keccak256(password1, password2);

    Fund storage fund = funds[key];

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

    LogReclaim(msg.sender, amount, this.balance);

    return true;
  }

  // Fallback function
  function() public {
    revert();
  }
}
