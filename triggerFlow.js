const hre = require("hardhat");
require("dotenv").config();

const fs = require('fs');
const path = require('path');

async function main() {
    let contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
        const addressPath = path.join(__dirname, '../deployedAddress.txt');
        if (fs.existsSync(addressPath)) {
            contractAddress = fs.readFileSync(addressPath, 'utf8').trim();
            console.log(`Loaded contract address from file: ${contractAddress}`);
        } else {
            throw new Error("CONTRACT_ADDRESS not found in .env or deployedAddress.txt");
        }
    } else {
        console.log("Using Contract Address (from env):", contractAddress);
    }

    const TransparentSubsidySystem = await hre.ethers.getContractFactory("TransparentSubsidySystem");
    const contract = TransparentSubsidySystem.attach(contractAddress);

    const [admin, processor, transporter, distributor, beneficiary] = await hre.ethers.getSigners();

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    console.log("Creating Item...");
    const createTx = await contract.connect(processor).createItem(beneficiary.address);
    await createTx.wait();

    const itemId = await contract.itemCount();
    console.log(`Item Created: ${itemId}`);

    // --- PHASE 1: Processing ---
    console.log("\n[Scan] Handover from Creator -> Processor");
    console.log("[Work] Processing items... (2s delay)");
    await sleep(2000); // Simulate work
    console.log("[Anchor] Uploading Processed Documents...");
    await (await contract.connect(processor).processItem(itemId, "QmProcessedHash")).wait();
    console.log(">> Item Processed. Orchestrator should generate 'to_Transported' QR.");

    // --- PHASE 2: Transporting ---
    console.log("\n[Scan] Handover from Processor -> Transporter");
    console.log("[Work] Transporting goods... (2s delay)");
    await sleep(2000);
    console.log("[Anchor] Uploading Transport Documents...");
    await (await contract.connect(transporter).transportItem(itemId, "QmTransportedHash")).wait();
    console.log(">> Item Transported. Orchestrator should generate 'to_Distributed' QR.");

    // --- PHASE 3: Distributing ---
    console.log("\n[Scan] Handover from Transporter -> Distributor");
    console.log("[Work] Distributing goods... (2s delay)");
    await sleep(2000);
    console.log("[Anchor] Uploading Distribution Documents...");
    await (await contract.connect(distributor).distributeItem(itemId, "QmDistributedHash")).wait();
    console.log(">> Item Distributed. Orchestrator should generate 'to_Claimed' QR.");

    // --- PHASE 4: Claiming ---
    console.log("\n[Scan] Beneficiary Scans to Claim");
    console.log("[Work] Verifying Identity... (2s delay)");
    await sleep(2000);
    console.log("[Anchor] Claiming Subsidy...");
    await (await contract.connect(beneficiary).claimSubsidy(itemId)).wait();
    console.log(">> Item Claimed. Orchestrator should clean up final QR.");

}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
