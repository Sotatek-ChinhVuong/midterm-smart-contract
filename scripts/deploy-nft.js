const { ethers, upgrades } = require("hardhat")

async function main() {
	const Hp  = await ethers.getContractFactory("Hp")
	const hp = await Hp.deploy()
	await hp.deployed()

	console.log("collection deployed to:", hp.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})