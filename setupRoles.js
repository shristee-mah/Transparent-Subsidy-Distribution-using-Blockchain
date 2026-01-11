async function main() {
  const contractAddress = "DEPLOYED_ADDRESS";
  const contract = await ethers.getContractAt("TransparentSubsidySystem", contractAddress);

  await contract.registerNode("0xStorageAddress", 1);
  await contract.registerNode("0xBeneficiaryAddress", 5);

  console.log("Roles assigned");
}

main();

