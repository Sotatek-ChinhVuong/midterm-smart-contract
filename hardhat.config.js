// hardhat.config.js
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');
require("dotenv").config()
require('solidity-coverage')
/**
 * @type import('hardhat/config').HardhatUserConfig
*/
module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`${process.env.PRIVATE_KEY}`]
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
  
};