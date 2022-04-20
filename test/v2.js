const { ethers } = require('hardhat');
const { BigNumber } = require("ethers")
const chai = require('chai');
const { expect } = chai;
let maketplaceV2;
let MaketplaceV2;
let NFT;
let nft;
const metaDataURI =
	"https://be.api.paceart.sotatek.works/api/v1/nfts/metadata/pace/31"
const priceOrder = 1

describe('MaketplaceV2', () => {
    beforeEach(async () => {
        MaketplaceV2 = await ethers.getContractFactory('MaketplaceV2')
        maketplaceV2 = await MaketplaceV2.deploy()
        await maketplaceV2.deployed()
        // console.log("marketplace ver 1", maketplaceV2.address)
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
            maketplaceV2.createOrder(
                nft.address,
                1,
                priceOrder
            )
        ).to.be.reverted;

		await nft.approve(maketplaceV2.address, 1)
        //  check not owner
        await expect(
            maketplaceV2.connect(addr1).createOrder(
                nft.address,
                1,
                priceOrder
            )
        ).to.be.reverted;
        await maketplaceV2.createOrder(
			nft.address,
			1,
			priceOrder
		)

		let res = await maketplaceV2.getOrder(1)
        expect(res.status).to.equal(0)

        expect((await maketplaceV2.getLastOrderId()).toString()).to.equal('1')
    })

    it("check buy token", async () => {
        // list token
        const [owner, addr1 ] = await ethers.getSigners()

		await nft.mintNFT(owner.address, metaDataURI)
        // console.log("owner", owner.address)
		await nft.approve(maketplaceV2.address, 1)
        
        await maketplaceV2.createOrder(
			nft.address,
			1,
			priceOrder
		)

		let res = await maketplaceV2.getOrder(1)
        expect(res.status).to.equal(0)
        
        // buy by another not enough value 
        await expect(
            maketplaceV2.connect(addr1).buyToken(1, {
                value: ethers.utils.parseEther("0")
            })
        ).to.be.reverted;
        

        // buy by another doesn't exists
        await expect(
            maketplaceV2.connect(addr1).buyToken(2, {
                value: ethers.utils.parseEther("1.5")
            })
        ).to.be.reverted;
        // buy by owner
        await expect(
            maketplaceV2.connect(owner).buyToken(2, {
                value: ethers.utils.parseEther("1.5")
            })
        ).to.be.reverted;

        await maketplaceV2.connect(addr1).buyToken(1, {
            value: ethers.utils.parseEther("1.5")
        })

        expect((await nft.ownerOf(1))).to.be.equal(addr1.address)
    })
    it ("check getOrder", async () => {
        // list token
        const [owner, addr1 ] = await ethers.getSigners()

		await nft.mintNFT(owner.address, metaDataURI)
        // console.log("owner", owner.address)
		await nft.approve(maketplaceV2.address, 1)
        
        await maketplaceV2.createOrder(
			nft.address,
			1,
			priceOrder
		)

		let res = await maketplaceV2.getOrder(1)
        expect(res.status).to.equal(0)

        await expect(
            maketplaceV2.getOrder(2)
        ).to.be.reverted;
    })

    it("check cancel listing", async () => {
        const [owner, addr1] = await ethers.getSigners()

		await nft.mintNFT(owner.address, metaDataURI)
        console.log("owner", owner.address)

		await nft.approve(maketplaceV2.address, 1)
        
        console.log((await nft.getApproved(1)), maketplaceV2.address)
        await maketplaceV2.createOrder(
			nft.address,
			1,
			priceOrder
		)
            // does not exist
        await expect(
            maketplaceV2.cancel(2)
        ).to.be.reverted;
            //  not owner
        await expect(
            maketplaceV2.connect(addr1).cancel(1)
        ).to.be.reverted;

        await maketplaceV2.cancel(1)
        res = await maketplaceV2.getOrder(1)
        expect(res.status).to.equal(2)

        await expect(
            maketplaceV2.connect(addr1).buyToken(1, {
                value: ethers.utils.parseEther("1.5")
            })
        ).to.be.reverted;

        await expect(
            maketplaceV2.cancel(1)
        ).to.be.reverted;

    })

    it("check setFee", async () => {
        await maketplaceV2.setFee(25);
        const fee = await maketplaceV2.getFee()
        expect(fee.toString()).to.equal('25')
    })

    it("check treasury", async () => {
        const [owner, addr1 ] = await ethers.getSigners()
        await maketplaceV2.setTreasury(owner.address);

        expect((await maketplaceV2.getTreasury())).to.equal(owner.address)
    })

    
    it("check initialize", async () => {
    
        await maketplaceV2.initialize();
        const res = await maketplaceV2.getLastOrderId()
        expect(res.toString()).to.equal('0');
    })
})