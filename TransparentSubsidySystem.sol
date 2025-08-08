// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TransparentSubsidySystem {

    address public admin;

    enum NodeType { NONE, STORAGE, PROCESSING, TRANSPORT, DISTRIBUTION, BENEFICIARY }

    struct Node {
        NodeType role;
        bool isRegistered;
    }

    struct ItemLog {
        uint256 timestamp;
        string action;
        address performedBy;
    }

    mapping(address => Node) public nodes;
    mapping(uint => ItemLog[]) public itemLogs;
    mapping(uint => bool) public isClaimed;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyRole(NodeType _role) {
        require(nodes[msg.sender].role == _role, "Unauthorized role");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerNode(address _node, NodeType _role) external onlyAdmin {
        nodes[_node] = Node(_role, true);
    }

    function logEvent(uint itemId, string memory action) external {
        require(nodes[msg.sender].isRegistered, "Node not registered");

        itemLogs[itemId].push(ItemLog({
            timestamp: block.timestamp,
            action: action,
            performedBy: msg.sender
        }));
    }

    function claimSubsidy(uint itemId) external onlyRole(NodeType.BENEFICIARY) {
        require(!isClaimed[itemId], "Already claimed");
        isClaimed[itemId] = true;

        itemLogs[itemId].push(ItemLog({
            timestamp: block.timestamp,
            action: "Claimed",
            performedBy: msg.sender
        }));
    }

    function getLogs(uint itemId) external view returns (ItemLog[] memory) {
        return itemLogs[itemId];
    }
}
