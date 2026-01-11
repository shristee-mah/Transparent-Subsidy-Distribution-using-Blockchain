// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract TransparentSubsidySystem is AccessControl {
    // ---------------- ROLES ----------------
    bytes32 public constant ADMIN_ROLE        = keccak256("ADMIN_ROLE");
    bytes32 public constant PROCESSOR_ROLE    = keccak256("PROCESSOR_ROLE");
    bytes32 public constant TRANSPORTER_ROLE  = keccak256("TRANSPORTER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE  = keccak256("DISTRIBUTOR_ROLE");

    // ---------------- WORKFLOW ----------------
    enum Stage {
        Created,
        Processed,
        Transported,
        Distributed,
        Claimed,
        Cancelled
    }

    struct Item {
        address beneficiary;
        Stage stage;
        bool claimed;
    }

    uint256 public itemCount;

    mapping(uint256 => Item) public items;
    // itemDocuments definition moved below to use Struct

    // ---------------- EVENTS ----------------
    event ItemCreated(uint256 indexed itemId, address indexed beneficiary);
    event ItemProcessed(uint256 indexed itemId);
    event ItemTransported(uint256 indexed itemId);
    event ItemDistributed(uint256 indexed itemId);
    event SubsidyClaimed(uint256 indexed itemId, address indexed beneficiary, address claimedBy);
    event DocumentUploaded(uint256 indexed itemId, Stage stage, string ipfsHash, address uploader);
    event ItemCancelled(uint256 indexed itemId);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        _setRoleAdmin(PROCESSOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(TRANSPORTER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(DISTRIBUTOR_ROLE, ADMIN_ROLE);
    }

    // ---------------- ADMIN ----------------
    function createItem(address beneficiary)
        external
        onlyRole(PROCESSOR_ROLE)
    {
        require(beneficiary != address(0), "Invalid beneficiary");
        itemCount++;
        items[itemCount] = Item({
            beneficiary: beneficiary,
            stage: Stage.Created,
            claimed: false
        });

        emit ItemCreated(itemCount, beneficiary);
    }

    // ---------------- WORKFLOW ----------------
    function processItem(uint256 itemId)
        external
        onlyRole(PROCESSOR_ROLE)
    {
        require(items[itemId].stage == Stage.Created, "Invalid stage");
        items[itemId].stage = Stage.Processed;
        emit ItemProcessed(itemId);
    }

    function transportItem(uint256 itemId)
        external
        onlyRole(TRANSPORTER_ROLE)
    {
        require(items[itemId].stage == Stage.Processed, "Invalid stage");
        items[itemId].stage = Stage.Transported;
        emit ItemTransported(itemId);
    }

    function distributeItem(uint256 itemId)
        external
        onlyRole(DISTRIBUTOR_ROLE)
    {
        require(items[itemId].stage == Stage.Transported, "Invalid stage");
        items[itemId].stage = Stage.Distributed;
        emit ItemDistributed(itemId);
    }

    function claimSubsidy(uint256 itemId) external {
        Item storage item = items[itemId];

        // Allow Beneficiary OR Admin (acting as Relay) to claim
        bool isBeneficiary = msg.sender == item.beneficiary;
        bool isAdmin = hasRole(ADMIN_ROLE, msg.sender);
        
        require(isBeneficiary || isAdmin, "Not authorized to claim");
        require(!item.claimed, "Already claimed");
        require(item.stage == Stage.Distributed, "Not distributed");

        item.claimed = true;
        item.stage = Stage.Claimed;

        emit SubsidyClaimed(itemId, item.beneficiary, msg.sender);
    }

    function cancelItem(uint256 itemId) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        Item storage item = items[itemId];
        require(!item.claimed, "Already claimed");
        require(item.stage != Stage.Cancelled, "Already cancelled");
        
        item.stage = Stage.Cancelled;
        emit ItemCancelled(itemId);
    }

    // ---------------- DOCUMENT VERIFICATION ----------------
    struct Document {
        Stage stage;
        string ipfsHash;
    }
    mapping(uint256 => Document[]) private itemDocuments;

    function addDocument(uint256 itemId, Stage stage, string calldata ipfsHash) external {
        require(itemId > 0 && itemId <= itemCount, "Item does not exist");
        require(
            hasRole(PROCESSOR_ROLE, msg.sender) ||
            hasRole(TRANSPORTER_ROLE, msg.sender) ||
            hasRole(DISTRIBUTOR_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender), 
            "Not authorized"
        );

        itemDocuments[itemId].push(Document({
            stage: stage,
            ipfsHash: ipfsHash
        }));
        
        emit DocumentUploaded(itemId, stage, ipfsHash, msg.sender);
    }

    function getDocuments(uint256 itemId)
        external
        view
        returns (Document[] memory)
    {
        return itemDocuments[itemId];
    }
}
