const { ethers, upgrades } = require("hardhat")
require("dotenv").config(__dirname + "/../.env")

const PROXY_ADDRESS = process.env.PROXY_ADDRESS

console.log(PROXY_ADDRESS)

async function main() {
	// // // Upgrade
	const MaketplaceV2 = await ethers.getContractFactory("MaketplaceV2")
	const maketplaceV2 = await upgrades.upgradeProxy(PROXY_ADDRESS, MaketplaceV2)
	console.log("Marketplace upgraded ", maketplaceV2.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})