// contracts/BoxV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
contract MaketplaceV1 is Initializable {
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

    event Listed (uint orderId, address seller, address token, uint tokenId, uint price);

    event Sale (uint orderId, address buyer, address token, uint tokenId, uint price);

    event Cancel (uint orderId, address seller);
    uint private _orderId;
    mapping(uint => Order) private _orders;

    modifier orderIdExist(uint orderId_) {
        require(orderId_ <= _orderId, "Order is not exist");
        _;

    }
    
    function initialize() public initializer {
        _orderId = 0;
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

        require(msg.value >= order.price, "Insufficient payment");

        order.status == OrderStatus.Sold;
        // console.log("Contract ", IERC721(token).ownerOf(order.tokenId));
        // console.log("This", address(this));
        IERC721(order.token).transferFrom(address(this), msg.sender, order.tokenId);
        payable(order.seller).transfer(order.price);
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

}