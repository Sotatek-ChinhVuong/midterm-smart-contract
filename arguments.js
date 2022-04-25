const { ethers } = require("hardhat")
const decimal = ethers.BigNumber.from(10).pow(18)

module.exports = [
    ethers.BigNumber.from(21000).mul(decimal),
];
