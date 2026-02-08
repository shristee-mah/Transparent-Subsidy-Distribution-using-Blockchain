const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');
require("dotenv").config();

const contractABI = require("../frontend/src/contractABI.json");

// Define Role Mappings (Must match Contract)
const ROLES = {
    "Processed": "PROCESSOR_ROLE",
    "Transported": "TRANSPORTER_ROLE",
    "Distributed": "DISTRIBUTOR_ROLE",
    "Claimed": "BENEFICIARY" // Special case
};

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log("Usage: node scripts/scanAndAction.js <QR_JSON_FILE_PATH> <NEW_IPFS_CID>");
        process.exit(1);
    }

    const qrFilePath = args[0];
    const newIpfsCid = args[1];

    // 1. "Scan" the QR (Read JSON)
    if (!fs.existsSync(qrFilePath)) {
        console.error(`Error: QR Document not found at ${qrFilePath}`);
        process.exit(1);
    }
    const qrData = JSON.parse(fs.readFileSync(qrFilePath, 'utf8'));
    console.log(`\n🔍 Scanned QR Code:`);
    console.log(`   Item ID: ${qrData.itemId}`);
    console.log(`   Target Stage: ${qrData.nextStage}`);
    console.log(`   Prev Proof: ${qrData.ipfsCid}`);

    // 2. Setup Provider/Wallet
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");

    // Fallback private key (Hardhat #0 Admin), but USER should set their own in .env to simulate different roles
    const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`\n👤 Acting as: ${wallet.address}`);

    // Load Contract
    let contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
        const addressPath = path.join(__dirname, '../deployedAddress.txt');
        if (fs.existsSync(addressPath)) {
            contractAddress = fs.readFileSync(addressPath, 'utf8').trim();
        } else {
            console.error("Error: CONTRACT_ADDRESS missing.");
            process.exit(1);
        }
    }
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    // 3. Verify Role / "Unlock" Interface
    const requiredRoleName = ROLES[qrData.nextStage];
    if (!requiredRoleName) {
        console.error(`Error: Unknown stage '${qrData.nextStage}' in QR code.`);
        process.exit(1);
    }

    console.log(`🔒 Required Access: ${requiredRoleName}`);

    let isAuthorized = false;
    if (requiredRoleName === "BENEFICIARY") {
        // Check if item beneficiary == msg.sender
        const item = await contract.items(qrData.itemId);
        if (item.beneficiary === wallet.address) {
            isAuthorized = true;
        } else {
            // Check if Admin (Relay)
            const ADMIN_ROLE = await contract.ADMIN_ROLE();
            if (await contract.hasRole(ADMIN_ROLE, wallet.address)) {
                isAuthorized = true;
                console.log("   (Authorized as Admin Relay)");
            }
        }
    } else {
        // Check Role
        const roleHash = await contract[requiredRoleName]();
        isAuthorized = await contract.hasRole(roleHash, wallet.address);
    }

    if (!isAuthorized) {
        console.error(`\n❌ ACCESS DENIED. You do not have the ${requiredRoleName} interface.`);
        process.exit(1);
    }

    console.log(`✅ ACCESS GRANTED. Interface Unlocked.`);

    // 4. Perform Action (State Transition)
    console.log(`\n🚀 Executing Transition to '${qrData.nextStage}'...`);
    console.log(`   Uploading New Document: ${newIpfsCid}`);

    try {
        let tx;
        if (qrData.nextStage === "Processed") {
            tx = await contract.processItem(qrData.itemId, newIpfsCid);
        } else if (qrData.nextStage === "Transported") {
            tx = await contract.transportItem(qrData.itemId, newIpfsCid);
        } else if (qrData.nextStage === "Distributed") {
            tx = await contract.distributeItem(qrData.itemId, newIpfsCid);
        } else if (qrData.nextStage === "Claimed") {
            tx = await contract.claimSubsidy(qrData.itemId); // Claim might not take hash in current contract? logic check...
            // Contract claimSubsidy(itemId) does not take Hash.
            // But our script might want to verify something. The previous QR code had the hash.
            console.log("   (Claiming does not require new document upload in this contract version)");
        }

        if (tx) {
            await tx.wait();
            console.log(`\n🎉 SUCCESS! Item ${qrData.itemId} is now ${qrData.nextStage}.`);

            // Delete the utilized QR files
            try {
                if (fs.existsSync(qrFilePath)) {
                    fs.unlinkSync(qrFilePath);
                    console.log(`   Deleted scanned QR file (JSON): ${qrFilePath}`);
                }
                // Attempt to delete correspoding PNG
                const pngFilePath = qrFilePath.replace('.json', '.png');
                if (fs.existsSync(pngFilePath)) {
                    fs.unlinkSync(pngFilePath);
                    console.log(`   Deleted scanned QR file (PNG): ${pngFilePath}`);
                }
            } catch (cleanupErr) {
                console.error("   Warning: Failed to cleanup QR files:", cleanupErr.message);
            }
        }

    } catch (error) {
        console.error("\n❌ Transaction Failed:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
