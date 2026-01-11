const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // 1. Read the deployed contract address from file
  const deployedAddress = fs.readFileSync("deployedAddress.txt", "utf-8").trim();
  console.log(`Using deployed contract address: ${deployedAddress}`);

  // 2. Get the signers/accounts from Hardhat environment
  const [owner, processor, transporter, distributor, beneficiary] = await hre.ethers.getSigners();
  console.log("Signers obtained:");
  console.log(`Owner/Admin: ${owner.address}`);
  console.log(`Processor (Node1): ${processor.address}`);
  console.log(`Transporter (Node2): ${transporter.address}`);
  console.log(`Distributor (Node3): ${distributor.address}`);
  console.log(`Beneficiary: ${beneficiary.address}`);

  // 3. Attach the contract instance
  const TransparentSubsidySystem = await hre.ethers.getContractFactory("TransparentSubsidySystem");
  const subsidySystem = TransparentSubsidySystem.attach(deployedAddress).connect(owner);

  console.log("\nSTEP 1 — Assigning Roles (Node Registration)");

  // Hardcoded role hashes to bypass ABI decoding issues
  const PROCESSOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("PROCESSOR_ROLE"));
  const TRANSPORTER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("TRANSPORTER_ROLE"));
  const DISTRIBUTOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));

  console.log("Granting PROCESSOR_ROLE to Node1...");
  await (await subsidySystem.grantRole(PROCESSOR_ROLE, processor.address)).wait();
  console.log(`✔ Node1 (${processor.address}) registered as PROCESSOR.`);

  console.log("Granting TRANSPORTER_ROLE to Node2...");
  await (await subsidySystem.grantRole(TRANSPORTER_ROLE, transporter.address)).wait();
  console.log(`✔ Node2 (${transporter.address}) registered as TRANSPORTER.`);

  console.log("Granting DISTRIBUTOR_ROLE to Node3...");
  await (await subsidySystem.grantRole(DISTRIBUTOR_ROLE, distributor.address)).wait();
  console.log(`✔ Node3 (${distributor.address}) registered as DISTRIBUTOR.`);

  console.log("\n✅ All nodes registered successfully with correct roles!");
}

// Run the script and catch errors
main().catch((error) => {
  console.error("Error in script execution:", error);
  process.exit(1);
});
