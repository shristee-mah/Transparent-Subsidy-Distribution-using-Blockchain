const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    // Read the address from Environment Variable
    const targetAddress = process.env.USER_ADDRESS;
    if (!targetAddress || !ethers.isAddress(targetAddress)) {
        console.error("Usage: set USER_ADDRESS=<ADDR> && npx hardhat run scripts/grantRolesToUser.js --network localhost");
        process.exit(1);
    }

    // 1. Get Contract Address
    const addressPath = path.join(__dirname, '../deployedAddress.txt');
    if (!fs.existsSync(addressPath)) {
        console.error("deployedAddress.txt not found");
        process.exit(1);
    }
    const contractAddress = fs.readFileSync(addressPath, 'utf8').trim();

    // 2. Get Signer (Admin/Deployer)
    const [admin] = await ethers.getSigners();
    console.log(`Admin (${admin.address}) granting roles to: ${targetAddress}`);

    // 3. Attach Contract
    const TransparentSubsidySystem = await ethers.getContractFactory("TransparentSubsidySystem");
    const contract = TransparentSubsidySystem.attach(contractAddress);

    // 4. Grant Roles
    const PROCESSOR_ROLE = await contract.PROCESSOR_ROLE();
    const TRANSPORTER_ROLE = await contract.TRANSPORTER_ROLE();
    const DISTRIBUTOR_ROLE = await contract.DISTRIBUTOR_ROLE();

    console.log("Granting PROCESSOR_ROLE...");
    await (await contract.grantRole(PROCESSOR_ROLE, targetAddress)).wait();

    console.log("Granting TRANSPORTER_ROLE...");
    await (await contract.grantRole(TRANSPORTER_ROLE, targetAddress)).wait();

    console.log("Granting DISTRIBUTOR_ROLE...");
    await (await contract.grantRole(DISTRIBUTOR_ROLE, targetAddress)).wait();

    console.log(`\n🎉 Success! Address ${targetAddress} now has all roles.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
