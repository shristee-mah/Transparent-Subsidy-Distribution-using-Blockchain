const { ethers } = require("ethers");

require("dotenv").config();
const contractABI = require("../frontend/src/contractABI.json");

const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

// NodeType enum mapping from your contract
const roles = {
  NONE: 0,
  STORAGE: 1,
  PROCESSING: 2,
  TRANSPORT: 3,
  DISTRIBUTION: 4,
  BENEFICIARY: 5,
};

async function registerNode(nodeAddress, role) {
  try {
    const tx = await contract.registerNode(nodeAddress, role);
    console.log(`Registering node ${nodeAddress} with role ${role}...`);
    await tx.wait();
    console.log("Node registered successfully!");
  } catch (error) {
    console.error("Error registering node:", error);
  }
}

async function main() {
  // Replace with real node addresses from your accounts or environment
  const nodesToRegister = [
    { address: wallet.address, role: roles.STORAGE },
    // Add more nodes if you want, example:
    // { address: "0x123...abc", role: roles.PROCESSING },
  ];

  for (const node of nodesToRegister) {
    await registerNode(node.address, node.role);
  }
}

main();
