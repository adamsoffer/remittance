pragma solidity ^0.4.4;

import "./Mortal.sol";


contract Remittance is Mortal {
  struct Fund {
    address beneficiary;
    address sender;
    uint amount;
    bool exists; // used to check whether a key is already mapped
    bool claimed;
  }

  // Store funds in a mapping behind a hashed password so that the contract can
  // be used by anyone with an address
  mapping(bytes32 => Fund) private funds;
 
  Fund fund;
  
  function deposit(address beneficiary, bytes32 hashedPassword) public payable returns (bool) {
    require(beneficiary != 0);
    
    // Prevents fund from being overwritten
    require(!funds[hashedPassword].exists);

    require(msg.value > 0);
    
    funds[hashedPassword] = Fund({
      beneficiary: beneficiary,
      sender: msg.sender,
      amount: msg.value,
      exists: true,
      claimed: false
    });

    return true;
  }

  function withdraw(string password1, string password2) public returns (bool) {
    bytes32 key = keccak256(password1, password2);

    // variable is declared outside of function scope as to avoid
    // overwriting storage. (assigns by reference otherwise)
    fund = funds[key];

    // Make sure no one has already claimed the fund
    require(!fund.claimed);
    
    require(fund.exists);

    // Only the beneficiary specified in the fund can claim
    require(msg.sender == fund.beneficiary);
    
    uint amount = fund.amount;
    
    require(amount > 0);

    fund.amount = 0;
    fund.claimed = true;

    msg.sender.transfer(amount);

    return true;
  }

  // Fallback function
  function() public {
    revert();
  }
}
