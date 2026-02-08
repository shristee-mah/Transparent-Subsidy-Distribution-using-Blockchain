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
    function processItem(uint256 itemId, string calldata ipfsHash)
        external
        onlyRole(PROCESSOR_ROLE)
    {
        require(items[itemId].stage == Stage.Created, "Invalid stage");
        items[itemId].stage = Stage.Processed;
        
        itemDocuments[itemId].push(Document({
            stage: Stage.Processed,
            ipfsHash: ipfsHash
        }));
        
        emit ItemProcessed(itemId);
        emit DocumentUploaded(itemId, Stage.Processed, ipfsHash, msg.sender);
    }

    function transportItem(uint256 itemId, string calldata ipfsHash)
        external
        onlyRole(TRANSPORTER_ROLE)
    {
        require(items[itemId].stage == Stage.Processed, "Invalid stage");
        items[itemId].stage = Stage.Transported;

        itemDocuments[itemId].push(Document({
            stage: Stage.Transported,
            ipfsHash: ipfsHash
        }));

        emit ItemTransported(itemId);
        emit DocumentUploaded(itemId, Stage.Transported, ipfsHash, msg.sender);
    }

    function distributeItem(uint256 itemId, string calldata ipfsHash)
        external
        onlyRole(DISTRIBUTOR_ROLE)
    {
        require(items[itemId].stage == Stage.Transported, "Invalid stage");
        items[itemId].stage = Stage.Distributed;

        itemDocuments[itemId].push(Document({
            stage: Stage.Distributed,
            ipfsHash: ipfsHash
        }));

        emit ItemDistributed(itemId);
        emit DocumentUploaded(itemId, Stage.Distributed, ipfsHash, msg.sender);
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
        // Emit DocumentUploaded to trigger orchestrator cleanup of the "Distributed" QR
        emit DocumentUploaded(itemId, Stage.Claimed, "Claimed", msg.sender);
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
    // ---------------- BATCH LOGIC ----------------
    struct Batch {
        uint256 id;
        uint256[] itemIds;
        Stage stage;
        string currentLocation; // Could be IPFS hash or plain text location data
    }

    uint256 public batchCount;
    mapping(uint256 => Batch) public batches;
    
    // Mapping to track which batch an item belongs to (0 if none)
    mapping(uint256 => uint256) public itemToBatch;

    event BatchCreated(uint256 indexed batchId, uint256[] itemIds);
    event BatchTransported(uint256 indexed batchId);
    event BatchDistributed(uint256 indexed batchId);

    function createBatch(uint256[] calldata _itemIds, string calldata location)
        external
        onlyRole(PROCESSOR_ROLE)
    {
        require(_itemIds.length > 0, "No items in batch");
        batchCount++;
        
        Batch storage newBatch = batches[batchCount];
        newBatch.id = batchCount;
        newBatch.stage = Stage.Processed; // Assumes batch creation happens at Processing stage
        newBatch.currentLocation = location;
        newBatch.itemIds = _itemIds;

        for (uint256 i = 0; i < _itemIds.length; i++) {
            uint256 itemId = _itemIds[i];
            require(items[itemId].stage == Stage.Created, "Item not in Created stage");
            require(itemToBatch[itemId] == 0, "Item already in a batch");

            // Update Item State
            items[itemId].stage = Stage.Processed;
            itemToBatch[itemId] = batchCount;
            
            // Log document/event for item?
            // Optionally we can emit ItemProcessed here too, or rely on Batch event
            emit ItemProcessed(itemId); 
        }

        emit BatchCreated(batchCount, _itemIds);
    }

    function transportBatch(uint256 batchId, string calldata ipfsHash)
        external
        onlyRole(TRANSPORTER_ROLE)
    {
        Batch storage batch = batches[batchId];
        require(batch.stage == Stage.Processed, "Invalid batch stage");
        
        batch.stage = Stage.Transported;
        
        // Update all items
        for (uint256 i = 0; i < batch.itemIds.length; i++) {
            uint256 itemId = batch.itemIds[i];
            // Sanity check: ensure item is still in sync?
            if (items[itemId].stage == Stage.Processed) {
                items[itemId].stage = Stage.Transported;
                emit ItemTransported(itemId);
                
                // Add document to item history
                itemDocuments[itemId].push(Document({
                    stage: Stage.Transported,
                    ipfsHash: ipfsHash
                }));
            }
        }

        emit BatchTransported(batchId);
    }

    function distributeBatch(uint256 batchId, string calldata ipfsHash)
        external
        onlyRole(DISTRIBUTOR_ROLE)
    {
        Batch storage batch = batches[batchId];
        require(batch.stage == Stage.Transported, "Invalid batch stage");
        
        batch.stage = Stage.Distributed;
        
        // Update all items
        for (uint256 i = 0; i < batch.itemIds.length; i++) {
            uint256 itemId = batch.itemIds[i];
            if (items[itemId].stage == Stage.Transported) {
                items[itemId].stage = Stage.Distributed;
                emit ItemDistributed(itemId);

                itemDocuments[itemId].push(Document({
                    stage: Stage.Distributed,
                    ipfsHash: ipfsHash
                }));
            }
        }

        emit BatchDistributed(batchId);
    }

    // "Disaggregation" / Verification Step
    // Allows Distributor to verify/unlock an item for claiming
    function verifyIndividualClaim(uint256 batchId, uint256 itemId) 
        external 
        onlyRole(DISTRIBUTOR_ROLE) 
    {
        require(itemToBatch[itemId] == batchId, "Item not in this batch");
        require(batches[batchId].stage == Stage.Distributed, "Batch not distributed");
        
        Item storage item = items[itemId];
        require(item.stage == Stage.Distributed, "Item not ready");
        require(!item.claimed, "Already claimed");

        // Logic choice: Does this mark it as 'Claimed' directly? 
        // Or just 'Ready'? 
        // User VerifyIndividualClaim description: "allows the Distributor to mark an individual item as 'Claimed' without affecting the rest of the batch."
        
        item.claimed = true;
        item.stage = Stage.Claimed;
        
        emit SubsidyClaimed(itemId, item.beneficiary, msg.sender);
    }
}
