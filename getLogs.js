//Script to fetch logs
const { ethers } = require("ethers");

require("dotenv").config();
const contractABI = require("../frontend/src/contractABI.json");

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

async function getLogs(itemId) {
  try {
    const logs = await contract.getLogs(itemId);
    console.log(`Logs for item ${itemId}:`);
    logs.forEach((log, index) => {
      const timestamp = new Date(log.timestamp.toNumber() * 1000).toLocaleString();
      console.log(`${index + 1}. [${timestamp}] Action: ${log.action}, Performed by: ${log.performedBy}`);
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
  }
}

async function main() {
  const itemId = 1; // Change as needed
  await getLogs(itemId);
}

main();
