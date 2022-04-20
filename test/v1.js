const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BigNumber } = require("ethers")

let maketplaceV1;
let MaketplaceV1;
let NFT;
let nft;
const metaDataURI =
	"https://be.api.paceart.sotatek.works/api/v1/nfts/metadata/pace/31"
const priceOrder = 1

describe('MaketplaceV1', () => {
    beforeEach(async () => {
        MaketplaceV1 = await ethers.getContractFactory('MaketplaceV1')
        maketplaceV1 = await MaketplaceV1.deploy()
        await maketplaceV1.deployed()
        // console.log("marketplace ver 1", maketplaceV1.address)
        NFT = await ethers.getContractFactory('Hp');
        nft = await NFT.deploy()
        await nft.deployed()
        // console.log("nft address", nft.address) 
    })

    it('check list token', async function () {
        const [owner, addr1 ] = await ethers.getSigners()

		await nft.mintNFT(owner.address, metaDataURI)
        // console.log("owner", owner.address)
        // check not aprove
        await expect(
            maketplaceV1.createOrder(
                nft.address,
                1,
                priceOrder
            )
        ).to.be.reverted;

		await nft.approve(maketplaceV1.address, 1)
        //  check not owner
        await expect(
            maketplaceV1.connect(addr1).createOrder(
                nft.address,
                1,
                priceOrder
            )
        ).to.be.reverted;
        await maketplaceV1.createOrder(
			nft.address,
			1,
			priceOrder
		)

		let res = await maketplaceV1.getOrder(1)
        expect(res.status).to.equal(0)

        expect((await maketplaceV1.getLastOrderId()).toString()).to.equal('1')
    })

    it("check buy token", async () => {
        // list token
        const [owner, addr1 ] = await ethers.getSigners()

		await nft.mintNFT(owner.address, metaDataURI)
        // console.log("owner", owner.address)
		await nft.approve(maketplaceV1.address, 1)
        
        await maketplaceV1.createOrder(
			nft.address,
			1,
			priceOrder
		)

		let res = await maketplaceV1.getOrder(1)
        expect(res.status).to.equal(0)
        
        // buy by another not enough value 
        await expect(
            maketplaceV1.connect(addr1).buyToken(1, {
                value: ethers.utils.parseEther("0")
            })
        ).to.be.reverted;
        

        // buy by another doesn't exists
        await expect(
            maketplaceV1.connect(addr1).buyToken(2, {
                value: ethers.utils.parseEther("1.5")
            })
        ).to.be.reverted;
        // buy by owner
        await expect(
            maketplaceV1.connect(owner).buyToken(2, {
                value: ethers.utils.parseEther("1.5")
            })
        ).to.be.reverted;

        await maketplaceV1.connect(addr1).buyToken(1, {
            value: ethers.utils.parseEther("1.5")
        })

        expect((await nft.ownerOf(1))).to.be.equal(addr1.address)
    })
    it ("check getOrder", async () => {
        // list token
        const [owner, addr1 ] = await ethers.getSigners()

		await nft.mintNFT(owner.address, metaDataURI)
        // console.log("owner", owner.address)
		await nft.approve(maketplaceV1.address, 1)
        
        await maketplaceV1.createOrder(
			nft.address,
			1,
			priceOrder
		)

		let res = await maketplaceV1.getOrder(1)
        expect(res.status).to.equal(0)

        await expect(
            maketplaceV1.getOrder(2)
        ).to.be.reverted;
    })

    it ("check buy token", async () => {
        // list token
        const [owner, addr1 ] = await ethers.getSigners()

		await nft.mintNFT(owner.address, metaDataURI)
        console.log("owner", owner.address)
        // const res = await nft.ownerOf(1)
        // console.log(res)
		await nft.approve(maketplaceV1.address, 1)
        
        await maketplaceV1.createOrder(
			nft.address,
			1,
			priceOrder
		)

		let res = await maketplaceV1.getOrder(1)
        expect(res.status).to.equal(0)

        // buy 
        res = await maketplaceV1.connect(addr1).buyToken(1, {
            value: ethers.utils.parseEther("1.0")
        })


    })

    it("check cancel listing", async () => {
        const [owner, addr1] = await ethers.getSigners()

		await nft.mintNFT(owner.address, metaDataURI)
        console.log("owner", owner.address)

		await nft.approve(maketplaceV1.address, 1)
        
        console.log((await nft.getApproved(1)), maketplaceV1.address)
        await maketplaceV1.createOrder(
			nft.address,
			1,
			priceOrder
		)
            // does not exist
        await expect(
            maketplaceV1.cancel(2)
        ).to.be.reverted;
            //  not owner
        await expect(
            maketplaceV1.connect(addr1).cancel(1)
        ).to.be.reverted;

        await maketplaceV1.cancel(1)
        res = await maketplaceV1.getOrder(1)
        expect(res.status).to.equal(2)

        await expect(
            maketplaceV1.connect(addr1).buyToken(1, {
                value: ethers.utils.parseEther("1.5")
            })
        ).to.be.reverted;

        await expect(
            maketplaceV1.cancel(1)
        ).to.be.reverted;

    })
})