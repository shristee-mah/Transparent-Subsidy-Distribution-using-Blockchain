const fs = require('fs');
const path = require('path');

const artifactPath = path.join(__dirname, '../artifacts/contracts/TransparentSubsidySystem.sol/TransparentSubsidySystem.json');
const outputPath = path.join(__dirname, '../frontend/src/contractABI.json');

try {
    const artifact = require(artifactPath);
    const abi = artifact.abi;

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
    console.log(`ABI extracted and saved to ${outputPath}`);
} catch (error) {
    console.error("Error updating ABI:", error);
    process.exit(1);
}
