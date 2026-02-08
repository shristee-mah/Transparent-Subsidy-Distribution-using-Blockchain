
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
require("dotenv").config();

async function main() {
    let contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
        const addressPath = path.join(__dirname, '../deployedAddress.txt');
        if (fs.existsSync(addressPath)) {
            contractAddress = fs.readFileSync(addressPath, 'utf8').trim();
        } else {
            throw new Error("CONTRACT_ADDRESS not found");
        }
    }

    const TransparentSubsidySystem = await hre.ethers.getContractFactory("TransparentSubsidySystem");
    const contract = TransparentSubsidySystem.attach(contractAddress);

    // Get signers - Admin usually has all roles in our test setup, or used specifically
    const [admin] = await hre.ethers.getSigners();

    console.log("Creating a new Item...");
    // Admin has PROCESSOR_ROLE from grantRolesToAdmin.js
    const tx = await contract.connect(admin).createItem(admin.address);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();

    const itemId = await contract.itemCount();
    console.log(`\nSuccess! Item ID ${itemId} Created.`);
    console.log(`Wait for logEvent.js to generate: qrcodes/qr_item_${itemId}_to_Processed.json`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
