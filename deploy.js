const { ethers } = require("hardhat");

async function main() {
  // Get accounts from Hardhat node
  const [
    admin,
    processor,
    transporter,
    distributor,
    beneficiary
  ] = await ethers.getSigners();

  console.log("Deploying with admin:", admin.address);

  // Deploy contract (NO constructor arguments)
  const ContractFactory = await ethers.getContractFactory("TransparentSubsidySystem");
  const contract = await ContractFactory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("Contract deployed at:", contractAddress);

  // Fetch role identifiers from contract
  const ADMIN_ROLE = await contract.ADMIN_ROLE();
  const PROCESSOR_ROLE = await contract.PROCESSOR_ROLE();
  const TRANSPORTER_ROLE = await contract.TRANSPORTER_ROLE();
  const DISTRIBUTOR_ROLE = await contract.DISTRIBUTOR_ROLE();

  // Grant roles
  await contract.grantRole(ADMIN_ROLE, admin.address);
  await contract.grantRole(PROCESSOR_ROLE, processor.address);
  await contract.grantRole(TRANSPORTER_ROLE, transporter.address);
  await contract.grantRole(DISTRIBUTOR_ROLE, distributor.address);

  console.log("Roles assigned:");
  console.log("ADMIN_ROLE       ->", admin.address);
  console.log("PROCESSOR_ROLE   ->", processor.address);
  console.log("TRANSPORTER_ROLE ->", transporter.address);
  console.log("DISTRIBUTOR_ROLE ->", distributor.address);
  console.log("Beneficiary      ->", beneficiary.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
