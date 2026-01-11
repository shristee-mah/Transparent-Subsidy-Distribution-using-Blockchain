const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TransparentSubsidySystem", function () {
  let contract;
  let admin, processor, transporter, distributor, beneficiary, attacker;

  beforeEach(async () => {
    [admin, processor, transporter, distributor, beneficiary, attacker] =
      await ethers.getSigners();

    const Contract = await ethers.getContractFactory(
      "TransparentSubsidySystem"
    );
    contract = await Contract.deploy();
    await contract.waitForDeployment();

    await contract.grantRole(await contract.ADMIN_ROLE(), admin.address);
    await contract.grantRole(await contract.PROCESSOR_ROLE(), processor.address);
    await contract.grantRole(await contract.TRANSPORTER_ROLE(), transporter.address);
    await contract.grantRole(await contract.DISTRIBUTOR_ROLE(), distributor.address);
  });

  it("Should assign admin role correctly", async () => {
    expect(
      await contract.hasRole(
        await contract.DEFAULT_ADMIN_ROLE(),
        admin.address
      )
    ).to.equal(true);
  });

  it("Should follow correct workflow", async () => {
    await contract.connect(processor).createItem(beneficiary.address);
    await contract.connect(processor).processItem(1);
    await contract.connect(transporter).transportItem(1);
    await contract.connect(distributor).distributeItem(1);
    await contract.connect(beneficiary).claimSubsidy(1);

    expect((await contract.items(1)).stage).to.equal(4);
  });

  it("Should reject wrong role actions", async () => {
    await contract.connect(processor).createItem(beneficiary.address);

    await expect(
      contract.connect(attacker).processItem(1)
    ).to.be.revertedWithCustomError(
      contract,
      "AccessControlUnauthorizedAccount"
    );
  });

  it("Should reject stage skips", async () => {
    await contract.connect(processor).createItem(beneficiary.address);

    await expect(
      contract.connect(transporter).transportItem(1)
    ).to.be.reverted;
  });

  it("Should allow authorized document uploads", async () => {
    await contract.connect(processor).createItem(beneficiary.address);

    await contract
      .connect(processor)
      .addDocument(1, 1, "ipfs://processing-doc");

    const docs = await contract.getDocuments(1);
    expect(docs.length).to.equal(1);
  });

  it("Should reject unauthorized document uploads", async () => {
    await contract.connect(processor).createItem(beneficiary.address);

    await expect(
      contract.connect(attacker).addDocument(1, 1, "ipfs://fake-doc")
    ).to.be.revertedWith("Not authorized");
  });

  it("Should not allow double claim", async () => {
    await contract.connect(processor).createItem(beneficiary.address);
    await contract.connect(processor).processItem(1);
    await contract.connect(transporter).transportItem(1);
    await contract.connect(distributor).distributeItem(1);

    await contract.connect(beneficiary).claimSubsidy(1);

    await expect(
      contract.connect(beneficiary).claimSubsidy(1)
    ).to.be.revertedWith("Already claimed");
  });
});
