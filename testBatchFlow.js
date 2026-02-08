const hre = require("hardhat");
const { expect } = require("chai");

async function main() {
    console.log("Starting Batch Flow Test...");

    // 1. Setup
    const [admin, processor, transporter, distributor, beneficiary1, beneficiary2, beneficiary3] = await hre.ethers.getSigners();
    const TransparentSubsidySystem = await hre.ethers.getContractFactory("TransparentSubsidySystem");
    // Deploy new contract for testing
    const contract = await TransparentSubsidySystem.deploy();
    await contract.waitForDeployment();
    console.log("Contract deployed to:", await contract.getAddress());

    // Grant roles
    const PROCESSOR_ROLE = await contract.PROCESSOR_ROLE();
    const TRANSPORTER_ROLE = await contract.TRANSPORTER_ROLE();
    const DISTRIBUTOR_ROLE = await contract.DISTRIBUTOR_ROLE();

    await contract.grantRole(PROCESSOR_ROLE, processor.address);
    await contract.grantRole(TRANSPORTER_ROLE, transporter.address);
    await contract.grantRole(DISTRIBUTOR_ROLE, distributor.address);

    // 2. Create Individual Items
    console.log("\n--- Creating Items ---");
    await contract.connect(processor).createItem(beneficiary1.address); // Item 1
    await contract.connect(processor).createItem(beneficiary2.address); // Item 2
    await contract.connect(processor).createItem(beneficiary3.address); // Item 3
    console.log("Items 1, 2, 3 created.");

    // 3. Create Batch
    console.log("\n--- Creating Batch ---");
    const itemIds = [1, 2, 3];
    // batchId should be 1
    await contract.connect(processor).createBatch(itemIds, "Warehouse A");
    console.log("Batch #1 created with items:", itemIds);

    let batch = await contract.batches(1);
    console.log(`Batch Stage: ${batch.stage} (Expected: 1 - Processed)`);

    // Check Item Status (should be Processed)
    let item1 = await contract.items(1);
    console.log(`Item 1 Stage: ${item1.stage} (Expected: 1 - Processed)`);

    // 4. Transport Batch
    console.log("\n--- Transporting Batch ---");
    await contract.connect(transporter).transportBatch(1, "QmTransportBatchHash");
    console.log("Batch Transported.");

    batch = await contract.batches(1);
    console.log(`Batch Stage: ${batch.stage} (Expected: 2 - Transported)`);
    item1 = await contract.items(1);
    console.log(`Item 1 Stage: ${item1.stage} (Expected: 2 - Transported)`);

    // 5. Distribute Batch
    console.log("\n--- Distributing Batch ---");
    await contract.connect(distributor).distributeBatch(1, "QmDistributeBatchHash");
    console.log("Batch Distributed.");

    batch = await contract.batches(1);
    console.log(`Batch Stage: ${batch.stage} (Expected: 3 - Distributed)`);
    item1 = await contract.items(1);
    console.log(`Item 1 Stage: ${item1.stage} (Expected: 3 - Distributed)`);

    // 6. Individual Claim (Disaggregation)
    console.log("\n--- Verifying Individual Claim (Item 2) ---");
    // Distributor verifies/claims for beneficiary 2
    await contract.connect(distributor).verifyIndividualClaim(1, 2);
    console.log("Item 2 Claim Verified by Distributor.");

    let item2 = await contract.items(2);
    console.log(`Item 2 Claimed: ${item2.claimed}`);
    console.log(`Item 2 Stage: ${item2.stage} (Expected: 4 - Claimed)`);

    // Verify Item 1 is still just Distributed (not claimed)
    item1 = await contract.items(1);
    console.log(`Item 1 Claimed: ${item1.claimed} (Expected: false)`);

    console.log("\nBatch Flow Test Complete!");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
