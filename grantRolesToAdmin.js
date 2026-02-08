const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    // 1. Get Contract Address
    const addressPath = path.join(__dirname, '../deployedAddress.txt');
    if (!fs.existsSync(addressPath)) {
        console.error("deployedAddress.txt not found");
        process.exit(1);
    }
    const contractAddress = fs.readFileSync(addressPath, 'utf8').trim();

    // 2. Get Signer (Admin/Deployer)
    const [admin] = await ethers.getSigners();
    console.log("Acting as Admin:", admin.address);

    // 3. Attach Contract
    const TransparentSubsidySystem = await ethers.getContractFactory("TransparentSubsidySystem");
    const contract = TransparentSubsidySystem.attach(contractAddress);

    // 4. Grant Roles
    const PROCESSOR_ROLE = await contract.PROCESSOR_ROLE();
    const TRANSPORTER_ROLE = await contract.TRANSPORTER_ROLE();
    const DISTRIBUTOR_ROLE = await contract.DISTRIBUTOR_ROLE();

    console.log("Granting roles to Admin...");
    await (await contract.grantRole(PROCESSOR_ROLE, admin.address)).wait();
    console.log("Granted PROCESSOR_ROLE");

    await (await contract.grantRole(TRANSPORTER_ROLE, admin.address)).wait();
    console.log("Granted TRANSPORTER_ROLE");

    await (await contract.grantRole(DISTRIBUTOR_ROLE, admin.address)).wait();
    console.log("Granted DISTRIBUTOR_ROLE");

    console.log("All roles granted to Admin for testing.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
