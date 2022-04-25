const { ethers, upgrades } = require("hardhat")
require("dotenv").config(__dirname + "/../.env")

const PROXY_ADDRESS = process.env.PROXY_ADDRESS

console.log(PROXY_ADDRESS)

async function main() {
	// // // Upgrade
	const MaketplaceV3 = await ethers.getContractFactory("MaketplaceV3")
	const maketplaceV3 = await upgrades.upgradeProxy(PROXY_ADDRESS, MaketplaceV3)
	console.log("Marketplace upgraded ", maketplaceV3.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})