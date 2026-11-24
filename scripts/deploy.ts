
import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("Deploying MediTrace to Sepolia...");

  const tracker = await ethers.deployContract("MedicineTracker");

  await tracker.waitForDeployment();

  const address = await tracker.getAddress();

  console.log("MediTrace deployed successfully!");
  console.log("Contract Address:", address);
}

await main();
