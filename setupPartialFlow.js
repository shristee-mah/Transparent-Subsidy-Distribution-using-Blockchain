const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const addressPath = path.join(__dirname, '../deployedAddress.txt');
    const contractAddress = fs.readFileSync(addressPath, 'utf8').trim();

    const TransparentSubsidySystem = await ethers.getContractFactory("TransparentSubsidySystem");
    const contract = TransparentSubsidySystem.attach(contractAddress);
    const [processor, beneficiary] = await ethers.getSigners();

    console.log("Creating Item...");
    await (await contract.createItem(beneficiary.address)).wait();
    const itemId = await contract.itemCount();
    console.log(`Item Created: ${itemId}`);

    console.log("Processing Item...");
    await (await contract.processItem(itemId, "QmProcessedHash")).wait();
    console.log(`Item ${itemId} Processed. Ready for Transport scan.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
