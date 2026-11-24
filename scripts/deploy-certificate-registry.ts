
import { network } from "hardhat";

const { ethers } = await network.connect();

// Newly deployed MedicineTracker contract on Sepolia.
const MEDICINE_TRACKER_ADDRESS =
    "0x79efC2414cb43d3c190fA62463Ca46a1513d9D59";

async function main() {

    console.log("Deploying Medicine Certificate Registry...");

    const registry = await ethers.deployContract(
        "MedicineCertificateRegistry",
        [MEDICINE_TRACKER_ADDRESS]
    );

    await registry.waitForDeployment();

    const address = await registry.getAddress();

    console.log("Certificate Registry deployed successfully!");
    console.log("Registry Address:", address);
    console.log("Connected MedicineTracker:", MEDICINE_TRACKER_ADDRESS);
}

await main();
