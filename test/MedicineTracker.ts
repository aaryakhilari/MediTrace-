
import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

describe("MedicineTracker", function () {

  it("Should register a new medicine", async function () {
    const tracker = await ethers.deployContract("MedicineTracker");

    const expiryDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 30);

    await tracker.registerMedicine(
      "BATCH001",
      "Paracetamol",
      "ABC Pharma",
      expiryDate
    );

    const medicine = await tracker.verifyMedicine("BATCH001");

    expect(medicine[0]).to.equal("BATCH001");
    expect(medicine[1]).to.equal("Paracetamol");
    expect(medicine[2]).to.equal("ABC Pharma");
    expect(medicine[4]).to.equal("Manufactured");
    expect(medicine[5]).to.equal(true);
  });

  it("Should update medicine supply chain stage", async function () {
    const tracker = await ethers.deployContract("MedicineTracker");

    const expiryDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 30);

    await tracker.registerMedicine(
      "BATCH002",
      "Vitamin C",
      "XYZ Pharma",
      expiryDate
    );

    await tracker.updateStage("BATCH002", "Distributed");

    const medicine = await tracker.verifyMedicine("BATCH002");

    expect(medicine[4]).to.equal("Distributed");
  });

  it("Should prevent duplicate batch registration", async function () {
    const tracker = await ethers.deployContract("MedicineTracker");

    const expiryDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 30);

    await tracker.registerMedicine(
      "BATCH003",
      "Paracetamol",
      "ABC Pharma",
      expiryDate
    );

    await expect(
      tracker.registerMedicine(
        "BATCH003",
        "Vitamin C",
        "XYZ Pharma",
        expiryDate
      )
    ).to.be.revertedWith("Batch already registered");
  });

    it("Should detect expired medicine", async function () {
    const tracker = await ethers.deployContract("MedicineTracker");

    const expiryDate = BigInt(Math.floor(Date.now() / 1000) + 86400);

    await tracker.registerMedicine(
      "BATCH004",
      "Test Medicine",
      "ABC Pharma",
      expiryDate
    );

    expect(await tracker.isExpired("BATCH004")).to.equal(false);

    await networkHelpers.time.increase(86400 * 2);

    expect(await tracker.isExpired("BATCH004")).to.equal(true);
  });

});
