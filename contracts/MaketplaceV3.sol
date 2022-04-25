// contracts/BoxV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ERC20Mintable is IERC20 {
    function mint(address to, uint amount) external;
    function checkMinable() external view returns(bool);

}
contract MaketplaceV3 is Initializable {
    enum OrderStatus {
        Active,
        Sold,
        Cancelled
    }

    struct Order {
        OrderStatus status;
        address seller;
        address token;
        uint tokenId;
        uint price;
    }
     // v3 update
    struct StakeNFT {
        uint tokenId;
        uint timestamp;
    }
     

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    

    event Listed (uint orderId, address seller, address token, uint tokenId, uint price);

    event Sale (uint orderId, address buyer, address token, uint tokenId, uint price);

    event Cancel (uint orderId, address seller);

    event Staked(address indexed user, uint256 tokenId);
    
    event Withdrawn(address indexed user, uint256 amount);
    
    event UnStaked(address indexed user, uint256 tokenId, uint256 reward);
    
    uint private _orderId;
    mapping(uint => Order) private _orders;
    // v2 update 
    address private _treasury;
    uint public fee;

    // v3 update
    mapping(uint256 => uint256) private hashrate;
    ERC20Mintable public rewardsToken;
    IERC721 public stakingNFT;
    mapping(uint => address) private nftToUser;
    mapping(uint => StakeNFT) private stakingItems;
    address private _owner;
    function setTreasury(address treasury) public {
        _treasury = treasury;
    }

    function getTreasury() public view returns (address) {
        return _treasury;
    }

    function setFee(uint _fee) external {
        fee = _fee;
    }

    function getFee() public view returns (uint){
        return fee;
    }
    // update v3
    function initialize(address _rewardsToken, address _stakingToken) public initializer {
        _orderId = 0;
        rewardsToken = ERC20Mintable(_rewardsToken);
        stakingNFT = IERC721(_stakingToken);
        _orderId = 0;
        _owner = msg.sender;
    }

    modifier orderIdExist(uint orderId_) {
        require(orderId_ <= _orderId, "Order is not exist");
        _;

    }
    
    function createOrder(address token, uint tokenId, uint price) external {
        // send nft to address of contract
        require(IERC721(token).ownerOf(tokenId) == msg.sender, "Only owner can order token");
        require(IERC721(token).getApproved(tokenId) == address(this), "Token must be approved to the contract");
        
        IERC721(token).transferFrom(msg.sender, address(this), tokenId);
        Order memory order = Order(
            OrderStatus.Active,
            msg.sender,
            token,
            tokenId,
            price
        );
        _orderId++;
        _orders[_orderId] = order;

        emit Listed(_orderId, msg.sender, token, tokenId, price);
    }
    function getLastOrderId() public view returns  (uint){
        return _orderId;
    }

    function getOrder(uint orderId) public orderIdExist(orderId) view returns  (Order memory){
        return _orders[orderId];
    }

    function buyToken(uint orderId) external orderIdExist(orderId) payable {
        
        Order storage order = _orders[orderId];
        require(msg.sender != order.seller, "Seller cannot be buyer");
        require(order.status == OrderStatus.Active, "Order is not active");

        require(msg.value >= order.price * (1 + 2*fee/100), "Insufficient payment");

        order.status == OrderStatus.Sold;

        IERC721(order.token).transferFrom(address(this), msg.sender, order.tokenId);

        payable(order.seller).transfer(order.price * (1 - fee / 100));
        payable(_treasury).transfer(order.price * (2*fee / 100));

        // fee and treasury address
        emit Sale(orderId, msg.sender, order.token, order.tokenId, order.price);
    }

    // cancel order
    function cancel(uint orderId) public orderIdExist(orderId) {
		Order storage order = _orders[orderId];

		require(msg.sender == order.seller, "Only seller can cancel order");
		require(order.status == OrderStatus.Active, "Order is not active");

		order.status = OrderStatus.Cancelled;
	
		IERC721(order.token).transferFrom(address(this), msg.sender, order.tokenId);
		emit Cancel(orderId, order.seller);
	}

   

    function getHashRate(uint tokenId) public view returns (uint) {
        return hashrate[tokenId];
    }

    function setHashRate(uint tokenId, uint rate) public onlyOwner {
        hashrate[tokenId] = rate;
    }




    function stake(uint tokenId) external {
        require(hashrate[tokenId] >= 0, "This NFT can not stake.");
        require(stakingNFT.ownerOf(tokenId) == msg.sender, "You is not owner of this nft.");
        require(stakingNFT.getApproved(tokenId)  == address(this), "The NFT need aprove to this contract.");
        require(nftToUser[tokenId] == address(0), "This nft was staked");
        StakeNFT memory stakeItem = StakeNFT(
            tokenId,
            block.timestamp
        );
        nftToUser[tokenId] = msg.sender;   
        stakingItems[tokenId] = stakeItem;
        stakingNFT.transferFrom(msg.sender, address(this), tokenId);
        
        emit Staked(msg.sender, tokenId);
    }

    function unStake(uint tokenId) external{
        require(nftToUser[tokenId] == msg.sender, "You are not owner of this nft");
        require(rewardsToken.checkMinable(), "Contract not mintable token");
        uint reward = hashrate[tokenId] * (block.timestamp - stakingItems[tokenId].timestamp); 
        stakingNFT.safeTransferFrom(address(this), msg.sender, tokenId);
        nftToUser[tokenId] = address(0);
        rewardsToken.mint(msg.sender, reward);
        emit UnStaked(msg.sender, tokenId,  reward);
    }

    function getStakeItem(uint tokenId) public view returns(StakeNFT memory) {
        return stakingItems[tokenId];
    }


    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }
}