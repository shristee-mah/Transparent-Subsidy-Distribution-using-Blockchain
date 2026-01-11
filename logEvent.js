const { ethers } = require("ethers");

require("dotenv").config();
const contractABI = require("../frontend/src/contractABI.json");

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

async function logEvent(itemId, action) {
  try {
    const tx = await contract.logEvent(itemId, action);
    console.log(`Logging event for item ${itemId}: "${action}"`);
    await tx.wait();
    console.log("Event logged successfully!");
  } catch (error) {
    console.error("Error logging event:", error);
  }
}

async function main() {
  // Example usage
  const itemId = 1;
  const action = "Stored at warehouse";

  await logEvent(itemId, action);
}

main();
