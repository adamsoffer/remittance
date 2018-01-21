pragma solidity ^0.4.4;

import "./Mortal.sol";


contract Remittance is Mortal {
  struct Fund {
    address beneficiary;
    address sender;
    uint amount;
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
  
  function deposit(address beneficiary, bytes32 hashedPassword) public payable returns (bool) {
    require(beneficiary != 0);
    
    // Prevents fund from being overwritten by making sure fund doesn't already exist
    require(funds[hashedPassword].sender == 0);

    require(msg.value > 0);
    
    funds[hashedPassword] = Fund({
      beneficiary: beneficiary,
      sender: msg.sender,
      amount: msg.value
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

    // Check whether the fund exists
    require(fund.sender != 0);

    // Make sure no one has already claimed the fund
    require(fund.amount != 0);

    // Only the beneficiary specified in the fund can claim
    require(msg.sender == fund.beneficiary);
    
    uint amount = fund.amount;
    
    require(amount > 0);

    fund.amount = 0;

    msg.sender.transfer(amount);

    LogWithdraw(msg.sender, amount, this.balance);

    return true;
  }

  // Fallback function
  function() public {
    revert();
  }
}
