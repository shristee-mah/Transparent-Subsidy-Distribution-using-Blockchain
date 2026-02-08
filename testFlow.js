const hre = require("hardhat");

async function main() {
    // Get signers from the local Hardhat node (admin/deployer is usually index 0)
    const [admin, processor, beneficiary] = await hre.ethers.getSigners();

    console.log("STEP 1 — Get Contract Factory");
    const ContractFactory = await hre.ethers.getContractFactory("TransparentSubsidySystem");

    console.log("\nSTEP 2 — Deploy Contract");
    const contract = await ContractFactory.deploy();
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log("✔ Contract deployed at:", contractAddress);

    console.log("\nSTEP 3 — Assign All Roles to Processor");
    // Fetch unique byte32 identifier hashes for roles defined in the contract
    const PROCESSOR_ROLE = await contract.PROCESSOR_ROLE();
    const TRANSPORTER_ROLE = await contract.TRANSPORTER_ROLE();
    const DISTRIBUTOR_ROLE = await contract.DISTRIBUTOR_ROLE();

    // Grant roles: Admin uses the AccessControl 'grantRole' to authorize the processor account
    await (await contract.grantRole(PROCESSOR_ROLE, processor.address)).wait();
    await (await contract.grantRole(TRANSPORTER_ROLE, processor.address)).wait();
    await (await contract.grantRole(DISTRIBUTOR_ROLE, processor.address)).wait();
    console.log("✔ All workflow roles granted to processor");

    console.log("\nSTEP 4 — Create Item");
    // Only an account with PROCESSOR_ROLE can initialize a new subsidy item
    const createTx = await contract.connect(processor).createItem(beneficiary.address);
    await createTx.wait();

    // Retrieve the auto-incremented ID from the contract's public mapping key
    const itemId = await contract.itemCount();
    console.log(`✔ Item created for beneficiary. Item ID: ${itemId}`);

    console.log("\nSTEP 5 — Move Through Workflow");
    // State machine logic: Items must move sequentially through enums to reach 'Distributed'

    // Transition: Created (0) -> Processed (1)
    await (await contract.connect(processor).processItem(itemId, "CID_PROCESSED_123")).wait();
    console.log("✔ Item Processed");

    // Transition: Processed (1) -> Transported (2)
    await (await contract.connect(processor).transportItem(itemId, "CID_TRANSPORTED_456")).wait();
    console.log("✔ Item Transported");

    // Transition: Transported (2) -> Distributed (3)
    await (await contract.connect(processor).distributeItem(itemId, "CID_DISTRIBUTED_789")).wait();
    console.log("✔ Item Distributed (Ready for claim)");

    console.log("\nSTEP 6 — Document Verification (Atomic)");
    // Documents are now added automatically during transitions.
    // We can verify them at the end.

    console.log("\nSTEP 7 — Claim Subsidy");
    try {
        // Contract checks: msg.sender MUST be the beneficiary OR Admin
        const claimTx = await contract.connect(beneficiary).claimSubsidy(itemId);
        await claimTx.wait();
        console.log("✔ SUCCESS: Subsidy claimed by beneficiary!");
    } catch (error) {
        // Log contract state (Stage and Claimed bool) if the transaction reverts
        console.log("❌ Claim Failed. Checking item state...");
        const item = await contract.items(itemId);
        console.log("Item State in Contract:", item);
        throw error;
    }

    console.log("\nSTEP 8 — Verify Final State");
    // Confirm the 'claimed' boolean is now true in the mapping
    const finalItem = await contract.items(itemId);
    console.log(`✔ Item ID ${itemId} claimed status:`, finalItem.claimed);

    console.log("\nSTEP 9 - Verify Document Storage");
    const docs = await contract.getDocuments(itemId);
    console.log("✔ Documents retrieved:", docs);

    // Explicitly exit to prevent the script from hanging in the terminal
    process.exit(0);
}

main().catch((error) => {
    console.error("\n❌ Script Failed:");
    console.error(error);
    process.exit(1);
});
