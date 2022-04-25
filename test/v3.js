const { ethers } = require('hardhat');
const { BigNumber } = require("ethers")
const chai = require('chai');
const { expect } = chai;
let maketplaceV3;
let MaketplaceV3;
let NFT;
let nft;
let Token;
let token;
const decimal = BigNumber.from(10).pow(18)

const metaDataURI =
	"https://be.api.paceart.sotatek.works/api/v1/nfts/metadata/pace/31"
const priceOrder = 1

describe('MaketplaceV3', () => {
    beforeEach(async () => {
        MaketplaceV3 = await ethers.getContractFactory('MaketplaceV3')
        maketplaceV3 = await MaketplaceV3.deploy()
        await maketplaceV3.deployed()
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
            maketplaceV3.createOrder(
                nft.address,
                1,
                priceOrder
            )
        ).to.be.reverted;

		await nft.approve(maketplaceV3.address, 1)
        //  check not owner
        await expect(
            maketplaceV3.connect(addr1).createOrder(
                nft.address,
                1,
                priceOrder
            )
        ).to.be.reverted;
        await maketplaceV3.createOrder(
			nft.address,
			1,
			priceOrder
		)

		let res = await maketplaceV3.getOrder(1)
        expect(res.status).to.equal(0)

        expect((await maketplaceV3.getLastOrderId()).toString()).to.equal('1')
    })

    it("check buy token", async () => {
        // list token
        const [owner, addr1 ] = await ethers.getSigners()

		await nft.mintNFT(owner.address, metaDataURI)
        // console.log("owner", owner.address)
		await nft.approve(maketplaceV3.address, 1)
        
        await maketplaceV3.createOrder(
			nft.address,
			1,
			priceOrder
		)

		let res = await maketplaceV3.getOrder(1)
        expect(res.status).to.equal(0)
        
        // buy by another not enough value 
        await expect(
            maketplaceV3.connect(addr1).buyToken(1, {
                value: ethers.utils.parseEther("0")
            })
        ).to.be.reverted;
        

        // buy by another doesn't exists
        await expect(
            maketplaceV3.connect(addr1).buyToken(2, {
                value: ethers.utils.parseEther("1.5")
            })
        ).to.be.reverted;
        // buy by owner
        await expect(
            maketplaceV3.connect(owner).buyToken(2, {
                value: ethers.utils.parseEther("1.5")
            })
        ).to.be.reverted;

        await maketplaceV3.connect(addr1).buyToken(1, {
            value: ethers.utils.parseEther("1.5")
        })

        expect((await nft.ownerOf(1))).to.be.equal(addr1.address)
    })
    it ("check getOrder", async () => {
        // list token
        const [owner, addr1 ] = await ethers.getSigners()

		await nft.mintNFT(owner.address, metaDataURI)
        // console.log("owner", owner.address)
		await nft.approve(maketplaceV3.address, 1)
        
        await maketplaceV3.createOrder(
			nft.address,
			1,
			priceOrder
		)

        await expect(
            maketplaceV3.getOrder(2)
        ).to.be.reverted;

		let res = await maketplaceV3.getOrder(1)
        expect(res.status).to.equal(0)

        
    })

    it("check cancel listing", async () => {
        const [owner, addr1] = await ethers.getSigners()

		await nft.mintNFT(owner.address, metaDataURI)
        // console.log("owner", owner.address)

		await nft.approve(maketplaceV3.address, 1)
        
        // console.log((await nft.getApproved(1)), maketplaceV3.address)
        await maketplaceV3.createOrder(
			nft.address,
			1,
			priceOrder
		)
            // does not exist
        await expect(
            maketplaceV3.cancel(2)
        ).to.be.reverted;
            //  not owner
        await expect(
            maketplaceV3.connect(addr1).cancel(1)
        ).to.be.reverted;

        await maketplaceV3.cancel(1)
        res = await maketplaceV3.getOrder(1)
        expect(res.status).to.equal(2)
        await expect(
            maketplaceV3.cancel(1)
        ).to.be.reverted;

        await expect(
            maketplaceV3.connect(addr1).buyToken(1, {
                value: ethers.utils.parseEther("1.5")
            })
        ).to.be.reverted;

       

    })

    it("check setFee", async () => {
        await maketplaceV3.setFee(25);
        const fee = await maketplaceV3.getFee()
        expect(fee.toString()).to.equal('25')
    })

    it("check treasury", async () => {
        const [owner, addr1 ] = await ethers.getSigners()
        await maketplaceV3.setTreasury(owner.address);

        expect((await maketplaceV3.getTreasury())).to.equal(owner.address)
    })

    describe("check stake", async () => {
        beforeEach(async () => {
           
            Token = await ethers.getContractFactory('HPToken')
            token = await Token.deploy(BigNumber.from(21000).mul(decimal))
            await token.deployed()
            // console.log(nft.address , "address nft")
            await maketplaceV3.initialize(token.address, nft.address);
        })

        it("check set hashrate", async () => {
            await maketplaceV3.setHashRate(1, 100)
            let res = await maketplaceV3.getHashRate(1)
            expect(res).to.equal(100)
            await maketplaceV3.setHashRate(1, 200)
            res = await maketplaceV3.getHashRate(1)
            expect(res).to.equal(200)
        })
        describe("check stake fail", async () => {
           
            it("hashrate = 0", async ()  => {
                await expect(
                    maketplaceV3.stake(1)
                ).to.be.reverted
           })
           it("hashrate 200 but not owner", async ()  => {
                const [owner, addr1 ] = await ethers.getSigners()
                await maketplaceV3.setHashRate(1, 200)
                await nft.mintNFT(owner.address, metaDataURI)
                await expect(
                    maketplaceV3.connect(addr1).stake(1)
                ).to.be.reverted
            })

           it("hashrate 200 owner but not aprove", async ()  => {
                const [owner, addr1 ] = await ethers.getSigners()
                await maketplaceV3.setHashRate(1, 200)
                await nft.mintNFT(owner.address, metaDataURI)
                // await nft.approve(maketplaceV3.address, 1)
                await expect(
                    maketplaceV3.stake(1)
                ).to.be.reverted
            })
            it("hashrate 200 owner aproved but staked", async ()  => {
                const [owner, addr1 ] = await ethers.getSigners()
                await maketplaceV3.setHashRate(1, 200)
                await nft.mintNFT(owner.address, metaDataURI)
                await nft.approve(maketplaceV3.address, 1)

                await maketplaceV3.stake(1)
                let o = await nft.ownerOf(1)
                expect(o).to.equal(maketplaceV3.address);

                await expect(
                    maketplaceV3.stake(1)
                ).to.be.reverted
                
            })
        })

        it("check stake success", async () => {
            const [owner ] = await ethers.getSigners()
            await nft.mintNFT(owner.address, metaDataURI)
            await nft.approve(maketplaceV3.address, 1)
            await maketplaceV3.setHashRate(1, 200)        
            await maketplaceV3.stake(1)
            let o = await nft.ownerOf(1)
            expect(o).to.equal(maketplaceV3.address);
            
            // await maketplaceV3.unStake(1)

            // await maketplaceV3.stake(1)
            // o = await nft.ownerOf(1)
            // expect(o).to.equal(maketplaceV3.address);

        })

    })

    describe("check unstake", async () => {
        beforeEach(async () => {
            Token = await ethers.getContractFactory('HPToken')
            token = await Token.deploy(BigNumber.from(21000).mul(decimal))
            await token.deployed()
            // console.log(nft.address , "address nft")
            await maketplaceV3.initialize(token.address, nft.address);
        })
        it("contract canot mint => unstake ", async () => {
            const [owner, addr1 ] = await ethers.getSigners()
            await nft.mintNFT(owner.address, metaDataURI)
            await nft.approve(maketplaceV3.address, 1)
            await maketplaceV3.setHashRate(1, 200)        
            await maketplaceV3.stake(1)

            await expect(
                maketplaceV3.connect(addr1).unStake(1)
            ).to.be.reverted;
        })
        it("check not owner unstake", async () => {
            await token.setMinterAddress(maketplaceV3.address, true)
            const [owner, addr1 ] = await ethers.getSigners()
            await nft.mintNFT(owner.address, metaDataURI)
            await nft.approve(maketplaceV3.address, 1)
            await maketplaceV3.setHashRate(1, 200)        
            await maketplaceV3.stake(1)

            await expect(
                maketplaceV3.connect(addr1).unStake(1)
            ).to.be.reverted;
        })
        it("check owner unstake", async () => {
            await token.setMinterAddress(maketplaceV3.address, true)
            const [owner, addr1 ] = await ethers.getSigners()
            await nft.mintNFT(owner.address, metaDataURI)
            await nft.approve(maketplaceV3.address, 1)
            await maketplaceV3.setHashRate(1, 200)        
            await maketplaceV3.stake(1)
            let ownerNft = await nft.ownerOf(1)
            let balanceB = await token.balanceOf(owner.address)
            expect(ownerNft).to.equal(maketplaceV3.address) 
            
            await maketplaceV3.unStake(1)
            ownerNft = await nft.ownerOf(1)
            let balanceA = await token.balanceOf(owner.address)
            expect(balanceA).to.above(balanceB)
            expect(ownerNft).to.equal(owner.address) 

            await expect(
                maketplaceV3.unStake(1)
            ).to.be.reverted;

        })

    })
})