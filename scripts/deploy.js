const { ethers, upgrades } = require("hardhat")

async function main() {
	const MaketplaceV1 = await ethers.getContractFactory("MaketplaceV1")
	const maketplaceV1 = await upgrades.deployProxy(MaketplaceV1)
	console.log("MaketplaceV1 deployed to:", maketplaceV1.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
