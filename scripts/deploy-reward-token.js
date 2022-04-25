const { ethers, upgrades } = require("hardhat")

async function main() {
	const Hp  = await ethers.getContractFactory("HPToken")
	const decimal = ethers.BigNumber.from(10).pow(18)
	console.log(decimal)
	const hp = await Hp.deploy(ethers.BigNumber.from(21000).mul(decimal))
	await hp.deployed()

	console.log("collection deployed to:", hp.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})