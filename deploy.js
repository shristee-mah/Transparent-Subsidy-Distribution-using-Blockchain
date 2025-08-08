const hre = require("hardhat");

async function main() {
  const TransparentSubsidySystem = await hre.ethers.getContractFactory("TransparentSubsidySystem");
  const subsidySystem = await TransparentSubsidySystem.deploy();

  await subsidySystem.waitForDeployment(); // ✅ use this instead of .deployed()

  const address = await subsidySystem.getAddress();
  console.log(`Contract deployed at: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
