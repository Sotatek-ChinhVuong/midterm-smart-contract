// test/MaketplaceV1.proxy.js
// Load dependencies
const { expect } = require('chai');
 
let MaketplaceV1;
let maketplaceV1;
 
// Start test block
describe('MaketplaceV1 (proxy)', function () {
  beforeEach(async function () {
    MaketplaceV1 = await ethers.getContractFactory("MaketplaceV1");
    maketplaceV1 = await upgrades.deployProxy(MaketplaceV1, [], {initializer: 'initialize'});
    console.log(maketplaceV1.address)
  });
 
  // Test case
  it('retrieve returns a value previously initialized', async function () {
    // Test if the returned value is the same one
    // Note that we need to use strings to compare the 256 bit integers
    expect((await maketplaceV1.getLastOrderId()).toString()).to.equal('0');
  });
});