// contracts/HPToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HPToken is ERC20, Ownable {
    mapping(address => bool) public mintableAddress;

    constructor(uint256 initialSupply) ERC20("Happee Bug", "HPB") {
        _mint(msg.sender, initialSupply);
    }

    function setMinterAddress(address add, bool _mintable) public onlyOwner {
        mintableAddress[add] = _mintable;
    }
    function checkMinable() external view returns(bool){
        return mintableAddress[msg.sender];
    }


    modifier mintable() {
        require(msg.sender == owner() || mintableAddress[msg.sender], "You can not mintable");
        _;
    }

    function mint(address to, uint amount) public mintable {
        _mint(to, amount);
    }
}