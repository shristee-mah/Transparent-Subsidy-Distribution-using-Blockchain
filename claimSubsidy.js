const { ethers } = require("ethers");

require("dotenv").config();
const contractABI = require("../frontend/src/contractABI.json");

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

async function claimSubsidy(itemId) {
  try {
    const tx = await contract.claimSubsidy(itemId);
    console.log(`Claiming subsidy for item ${itemId}...`);
    await tx.wait();
    console.log("Subsidy claimed successfully!");
  } catch (error) {
    console.error("Error claiming subsidy:", error);
  }
}

async function main() {
  const itemId = 1; // Change to your desired item id
  await claimSubsidy(itemId);
}

main();
