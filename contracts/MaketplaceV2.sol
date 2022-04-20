// contracts/BoxV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
contract MaketplaceV2 is Initializable {
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
    // v2 update 
    address private _treasury;
    uint public fee;
    

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

    function initialize() public initializer {
        _orderId = 0;
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

}