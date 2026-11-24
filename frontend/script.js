
// ==========================================
// MediTrace - Medicine + Certificate System
// Ethereum Sepolia | ethers.js v6
// ==========================================

// NEW DEPLOYED CONTRACT ADDRESSES

const CONTRACT_ADDRESS =
    "0x79efC2414cb43d3c190fA62463Ca46a1513d9D59";

const CERTIFICATE_REGISTRY_ADDRESS =
    "0x0F0acd0CD3A0616A22635A6a1f40450ec5671fB7";

const SEPOLIA_CHAIN_ID = "0xaa36a7";

const BACKEND_UPLOAD_URL =
    "http://localhost:5000/api/certificates/upload";

const IPFS_GATEWAY =
    "https://gateway.pinata.cloud/ipfs/";

let provider;
let signer;
let contract;
let certificateContract;
let userAddress = "";

const connectWalletBtn =
    document.getElementById("connectWalletBtn");


// ==========================================
// COMMON FUNCTIONS
// ==========================================

function setMessage(id, message, isError = false) {
    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#ff7777" : "#16c6b0";
}

function getErrorMessage(error) {
    return (
        error?.shortMessage ||
        error?.reason ||
        error?.info?.error?.message ||
        error?.message ||
        "Something went wrong. Check the browser console."
    );
}

async function checkConnection() {
    if (
        !window.ethereum ||
        !signer ||
        !contract ||
        !certificateContract
    ) {
        alert("Connect your MetaMask wallet first.");
        return false;
    }

    const network = await provider.getNetwork();

    if (network.chainId !== 11155111n) {
        alert("Please connect to Ethereum Sepolia Testnet.");
        return false;
    }

    return true;
}


// ==========================================
// CONNECT METAMASK WALLET
// ==========================================

async function connectWallet() {
    try {
        if (!window.ethereum) {
            throw new Error(
                "MetaMask is not installed. Please install MetaMask."
            );
        }

        connectWalletBtn.textContent = "Connecting...";

        const chainId = await window.ethereum.request({
            method: "eth_chainId"
        });

        if (chainId !== SEPOLIA_CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: SEPOLIA_CHAIN_ID }]
                });
            } catch (error) {
                throw new Error(
                    "Switch MetaMask to Ethereum Sepolia Testnet."
                );
            }
        }

        await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        provider = new ethers.BrowserProvider(window.ethereum);

        signer = await provider.getSigner();

        userAddress = await signer.getAddress();

        // Connect NEW MedicineTracker contract
        contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            window.contractABI,
            signer
        );

        // Connect NEW Certificate Registry contract
        certificateContract = new ethers.Contract(
            CERTIFICATE_REGISTRY_ADDRESS,
            window.certificateRegistryABI,
            signer
        );

        connectWalletBtn.textContent =
            userAddress.substring(0, 6) +
            "..." +
            userAddress.slice(-4);

        console.log("Connected wallet:", userAddress);

        const medicineOwner = await contract.owner();

        console.log("MedicineTracker Owner:", medicineOwner);

        const registryOwner =
            await certificateContract.owner();

        console.log("Certificate Registry Owner:", registryOwner);

        alert("Wallet connected to Ethereum Sepolia.");

    } catch (error) {
        console.error("Wallet connection error:", error);

        alert(getErrorMessage(error));

        connectWalletBtn.textContent = "Connect Wallet";
    }
}

connectWalletBtn.addEventListener("click", connectWallet);


// ==========================================
// QR CODE GENERATION
// ==========================================

function generateMedicineQR(batchId) {
    const qrSection =
        document.getElementById("qrCodeSection");

    const qrContainer =
        document.getElementById("qrcode");

    qrContainer.innerHTML = "";

    const baseUrl = window.location.href
        .split("?")[0]
        .split("#")[0];

    const verificationUrl =
        `${baseUrl}?batch=${encodeURIComponent(batchId)}#verify`;

    new QRCode(qrContainer, {
        text: verificationUrl,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById("qrBatchId").textContent =
        "Batch ID: " + batchId;

    qrSection.hidden = false;

    document.getElementById("downloadQRBtn").onclick = function () {
        const canvas = qrContainer.querySelector("canvas");
        const image = qrContainer.querySelector("img");

        const dataUrl = canvas
            ? canvas.toDataURL("image/png")
            : image?.src;

        if (!dataUrl) {
            alert("QR image is not ready. Try again.");
            return;
        }

        const link = document.createElement("a");

        link.href = dataUrl;
        link.download = `MediTrace-${batchId}-QR.png`;

        link.click();
    };
}


// ==========================================
// TRANSACTION HISTORY
// ==========================================

const HISTORY_STORAGE_KEY =
    "meditraceTransactionHistory";

function getSavedTransactions() {
    try {
        return JSON.parse(
            localStorage.getItem(HISTORY_STORAGE_KEY) || "[]"
        );
    } catch (error) {
        return [];
    }
}

function saveTransaction(title, batchId, details, hash) {
    const transactions = getSavedTransactions();

    transactions.unshift({
        title: title,
        batchId: batchId,
        details: details,
        hash: hash,
        timestamp: Date.now()
    });

    localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(transactions)
    );

    renderTransactionHistory();
}

function renderTransactionHistory() {
    const historyContainer =
        document.querySelector(".history-card");

    if (!historyContainer) return;

    historyContainer
        .querySelectorAll(".dynamic-history-item")
        .forEach(item => item.remove());

    const transactions = getSavedTransactions();

    transactions.forEach(tx => {
        const item = document.createElement("div");

        item.className =
            "history-item dynamic-history-item";

        const info = document.createElement("div");

        const heading = document.createElement("h3");
        heading.textContent = tx.title;

        const description = document.createElement("p");
        description.textContent =
            `Batch ID: ${tx.batchId} | ${tx.details}`;

        const small = document.createElement("small");
        small.textContent = "Transaction Hash";

        const code = document.createElement("code");
        code.textContent = tx.hash;

        info.append(
            heading,
            description,
            small,
            code
        );

        const action = document.createElement("div");
        action.className = "history-action";

        const status = document.createElement("span");
        status.className = "history-status";
        status.textContent = "Confirmed";

        const link = document.createElement("a");

        link.href =
            "https://sepolia.etherscan.io/tx/" + tx.hash;

        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "View on Etherscan ↗";

        action.append(status, link);
        item.append(info, action);

        historyContainer.prepend(item);
    });
}

renderTransactionHistory();


// ==========================================
// REGISTER MEDICINE
// Includes Manufacturing Date
// ==========================================

document
    .getElementById("registerForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        try {
            if (!(await checkConnection())) return;

            const batchId =
                document.getElementById("batchId").value.trim();

            const medicineName =
                document.getElementById("medicineName").value.trim();

            const manufacturer =
                document.getElementById("manufacturer").value.trim();

            const manufacturingDate =
                document.getElementById("manufacturingDate").value;

            const expiryDate =
                document.getElementById("expiryDate").value;

            if (
                !batchId ||
                !medicineName ||
                !manufacturer ||
                !manufacturingDate ||
                !expiryDate
            ) {
                throw new Error("Please fill all fields.");
            }

            const manufacturingTimestamp = Math.floor(
                new Date(manufacturingDate + "T00:00:00").getTime() / 1000
            );

            const expiryTimestamp = Math.floor(
                new Date(expiryDate + "T23:59:59").getTime() / 1000
            );

            const now = Math.floor(Date.now() / 1000);

            if (manufacturingTimestamp > now) {
                throw new Error(
                    "Manufacturing Date cannot be in the future."
                );
            }

            if (expiryTimestamp <= manufacturingTimestamp) {
                throw new Error(
                    "Expiry Date must be after Manufacturing Date."
                );
            }

            if (expiryTimestamp <= now) {
                throw new Error(
                    "Please select a future expiry date."
                );
            }

            setMessage(
                "registerMessage",
                "Waiting for MetaMask confirmation..."
            );

            const tx = await contract.registerMedicine(
                batchId,
                medicineName,
                manufacturer,
                manufacturingTimestamp,
                expiryTimestamp
            );

            setMessage(
                "registerMessage",
                "Transaction submitted. Waiting for confirmation..."
            );

            await tx.wait();

            saveTransaction(
                "Medicine Registration",
                batchId,
                "Medicine: " + medicineName,
                tx.hash
            );

            generateMedicineQR(batchId);

            setMessage(
                "registerMessage",
                "Medicine registered successfully on Ethereum."
            );

            document.getElementById("registerForm").reset();

        } catch (error) {
            console.error("Registration error:", error);

            setMessage(
                "registerMessage",
                getErrorMessage(error),
                true
            );
        }
    });


// ==========================================
// UPDATE SUPPLY CHAIN STAGE
// ==========================================

document
    .getElementById("updateForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        try {
            if (!(await checkConnection())) return;

            const batchId =
                document.getElementById("updateBatchId").value.trim();

            const newStage =
                document.getElementById("newStage").value;

            if (!batchId || !newStage) {
                throw new Error(
                    "Enter Batch ID and select a stage."
                );
            }

            setMessage(
                "updateMessage",
                "Checking medicine batch..."
            );

            const medicine =
                await contract.verifyMedicine(batchId);

            if (!medicine[6]) {
                throw new Error("Medicine batch not found.");
            }

            setMessage(
                "updateMessage",
                "Waiting for MetaMask confirmation..."
            );

            const tx = await contract.updateStage(
                batchId,
                newStage
            );

            setMessage(
                "updateMessage",
                "Transaction submitted. Waiting for confirmation..."
            );

            await tx.wait();

            saveTransaction(
                "Supply Chain Update",
                batchId,
                "New Stage: " + newStage,
                tx.hash
            );

            setMessage(
                "updateMessage",
                "Medicine stage updated successfully."
            );

            document.getElementById("updateForm").reset();

        } catch (error) {
            console.error("Supply chain update error:", error);

            setMessage(
                "updateMessage",
                getErrorMessage(error),
                true
            );
        }
    });


// ==========================================
// ADMIN: AUTHORIZE MANUFACTURER WALLET
// ==========================================

document
    .getElementById("authorizationForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        try {
            if (!(await checkConnection())) return;

            const wallet =
                document.getElementById("manufacturerWallet")
                    .value.trim();

            const authorized =
                document.getElementById("authorizationAction")
                    .value === "true";

            if (!ethers.isAddress(wallet)) {
                throw new Error(
                    "Enter a valid Ethereum wallet address."
                );
            }

            const registryOwner =
                await certificateContract.owner();

            if (
                registryOwner.toLowerCase() !==
                userAddress.toLowerCase()
            ) {
                throw new Error(
                    "Only the certificate registry owner can authorize manufacturers."
                );
            }

            setMessage(
                "authorizationMessage",
                "Waiting for MetaMask confirmation..."
            );

            const tx =
                await certificateContract.setManufacturerAuthorization(
                    wallet,
                    authorized
                );

            setMessage(
                "authorizationMessage",
                "Transaction submitted. Waiting for confirmation..."
            );

            await tx.wait();

            saveTransaction(
                "Manufacturer Authorization",
                "-",
                `${wallet} | Authorized: ${authorized}`,
                tx.hash
            );

            setMessage(
                "authorizationMessage",
                authorized
                    ? "Manufacturer wallet authorized successfully."
                    : "Manufacturer authorization removed."
            );

            document
                .getElementById("authorizationForm")
                .reset();

        } catch (error) {
            console.error("Authorization error:", error);

            setMessage(
                "authorizationMessage",
                getErrorMessage(error),
                true
            );
        }
    });


// ==========================================
// MANUFACTURER: UPLOAD CERTIFICATE
// ==========================================

document
    .getElementById("certificateForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        try {
            if (!(await checkConnection())) return;

            const batchId =
                document.getElementById("certificateBatchId")
                    .value.trim();

            const certificateNumber =
                document.getElementById("certificateNumber")
                    .value.trim();

            const certificateType =
                document.getElementById("certificateType").value;

            const file =
                document.getElementById("certificatePdf").files[0];

            if (
                !batchId ||
                !certificateNumber ||
                !certificateType ||
                !file
            ) {
                throw new Error(
                    "Complete all certificate fields and select a PDF."
                );
            }

            if (
                file.type !== "application/pdf" &&
                !file.name.toLowerCase().endsWith(".pdf")
            ) {
                throw new Error("Only PDF files are accepted.");
            }

            if (file.size > 10 * 1024 * 1024) {
                throw new Error(
                    "PDF must be 10 MB or smaller."
                );
            }

            const isAuthorized =
                await certificateContract.authorizedManufacturers(
                    userAddress
                );

            if (!isAuthorized) {
                throw new Error(
                    "This wallet is not authorized by the registry administrator."
                );
            }

            const medicine =
                await contract.verifyMedicine(batchId);

            if (!medicine[6]) {
                throw new Error(
                    "This medicine batch is not registered."
                );
            }

            let existingCertificate = false;

            try {
                const existing =
                    await certificateContract.getCertificate(batchId);

                if (existing.exists) {
                    existingCertificate = true;
                }
            } catch (error) {
                const reason = getErrorMessage(error).toLowerCase();

                if (
                    !reason.includes("certificate not found") &&
                    error.code !== "CALL_EXCEPTION"
                ) {
                    throw error;
                }
            }

            if (existingCertificate) {
                throw new Error(
                    "A certificate already exists for this batch. The current contract allows one certificate per batch."
                );
            }

            setMessage(
                "certificateMessage",
                "Uploading PDF to IPFS..."
            );

            const formData = new FormData();

            formData.append("certificate", file);

            const uploadResponse = await fetch(
                BACKEND_UPLOAD_URL,
                {
                    method: "POST",
                    body: formData
                }
            );

            const uploadData = await uploadResponse.json();

            if (!uploadResponse.ok || !uploadData.success) {
                throw new Error(
                    uploadData.message ||
                    "Certificate upload failed."
                );
            }

            if (
                !uploadData.cid ||
                !/^[0-9a-fA-F]{64}$/.test(
                    uploadData.documentHash || ""
                )
            ) {
                throw new Error(
                    "Backend returned an invalid CID or document hash."
                );
            }

            const documentHash =
                "0x" + uploadData.documentHash;

            setMessage(
                "certificateMessage",
                "PDF uploaded. Confirm the blockchain transaction in MetaMask..."
            );

            const tx =
                await certificateContract.addCertificate(
                    batchId,
                    certificateNumber,
                    certificateType,
                    uploadData.cid,
                    documentHash
                );

            setMessage(
                "certificateMessage",
                "Transaction submitted. Waiting for confirmation..."
            );

            await tx.wait();

            saveTransaction(
                "Certificate Added",
                batchId,
                "Certificate: " + certificateNumber,
                tx.hash
            );

            setMessage(
                "certificateMessage",
                "Certificate recorded successfully on blockchain. CID: " +
                uploadData.cid
            );

            document
                .getElementById("certificateForm")
                .reset();

        } catch (error) {
            console.error("Certificate upload error:", error);

            setMessage(
                "certificateMessage",
                getErrorMessage(error),
                true
            );
        }
    });


// ==========================================
// PUBLIC CERTIFICATE VERIFICATION
// ==========================================

async function verifyCertificateForBatch(
    readRegistry,
    batchId
) {
    try {
        const certificate =
            await readRegistry.getCertificate(batchId);

        if (!certificate.exists) {
            document.getElementById(
                "certificateResult"
            ).hidden = true;

            document.getElementById(
                "noCertificateMessage"
            ).hidden = false;

            return;
        }

        document.getElementById(
            "resultCertificateNumber"
        ).textContent = certificate.certificateNumber;

        document.getElementById(
            "resultCertificateType"
        ).textContent = certificate.certificateType;

        document.getElementById(
            "resultCertificateIssuer"
        ).textContent = certificate.issuer;

        document.getElementById(
            "resultCertificateDate"
        ).textContent = new Date(
            Number(certificate.issuedAt) * 1000
        ).toLocaleString("en-IN");

        const statusElement =
            document.getElementById("resultCertificateStatus");

        statusElement.textContent = certificate.revoked
            ? "REVOKED"
            : "RECORDED - NOT REVOKED";

        statusElement.style.color = certificate.revoked
            ? "#ff7777"
            : "#16c6b0";

        document.getElementById(
            "resultCertificateHash"
        ).textContent = certificate.documentHash;

        const certificateLink =
            document.getElementById("certificateFileLink");

        certificateLink.href =
            IPFS_GATEWAY + encodeURIComponent(certificate.ipfsCID);

        certificateLink.textContent =
            "Open certificate PDF on IPFS ↗";

        document.getElementById(
            "certificateResult"
        ).hidden = false;

        document.getElementById(
            "noCertificateMessage"
        ).hidden = true;

    } catch (error) {
        const reason = getErrorMessage(error).toLowerCase();

        if (
            reason.includes("certificate not found") ||
            error.code === "CALL_EXCEPTION"
        ) {
            document.getElementById(
                "certificateResult"
            ).hidden = true;

            document.getElementById(
                "noCertificateMessage"
            ).hidden = false;

            return;
        }

        throw error;
    }
}


// ==========================================
// PUBLIC MEDICINE VERIFICATION
// No MetaMask connection required
// ==========================================

document
    .getElementById("verifyForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const batchId =
            document.getElementById("verifyBatchId")
                .value.trim();

        const medicineResult =
            document.getElementById("medicineResult");

        document.getElementById(
            "certificateResult"
        ).hidden = true;

        document.getElementById(
            "noCertificateMessage"
        ).hidden = true;

        try {
            if (!batchId) {
                throw new Error("Please enter a Batch ID.");
            }

            setMessage(
                "verifyMessage",
                "Checking medicine and certificate records..."
            );

            medicineResult.hidden = true;

            const readProvider =
                new ethers.JsonRpcProvider(
                    "https://ethereum-sepolia-rpc.publicnode.com"
                );

            const readMedicine =
                new ethers.Contract(
                    CONTRACT_ADDRESS,
                    window.contractABI,
                    readProvider
                );

            const readRegistry =
                new ethers.Contract(
                    CERTIFICATE_REGISTRY_ADDRESS,
                    window.certificateRegistryABI,
                    readProvider
                );

            const medicine =
                await readMedicine.verifyMedicine(batchId);

            if (!medicine[6]) {
                throw new Error(
                    "Medicine not found. This batch is not registered."
                );
            }

            const manufacturingDate = new Date(
                Number(medicine[3]) * 1000
            );

            const expiryDate = new Date(
                Number(medicine[4]) * 1000
            );

            const expired =
                await readMedicine.isExpired(batchId);

            document.getElementById(
                "resultBatchId"
            ).textContent = medicine[0];

            document.getElementById(
                "resultMedicineName"
            ).textContent = medicine[1];

            document.getElementById(
                "resultManufacturer"
            ).textContent = medicine[2];

            document.getElementById(
                "resultManufacturingDate"
            ).textContent =
                manufacturingDate.toLocaleDateString("en-IN");

            document.getElementById(
                "resultExpiryDate"
            ).textContent =
                expiryDate.toLocaleDateString("en-IN");

            document.getElementById(
                "resultStage"
            ).textContent = medicine[5];

            const statusElement =
                document.getElementById("resultStatus");

            statusElement.textContent = expired
                ? "EXPIRED"
                : "REGISTERED - NOT EXPIRED";

            statusElement.style.color = expired
                ? "#ff7777"
                : "#16c6b0";

            medicineResult.hidden = false;

            await verifyCertificateForBatch(
                readRegistry,
                batchId
            );

            setMessage(
                "verifyMessage",
                "Medicine record found on Ethereum Sepolia."
            );

        } catch (error) {
            console.error("Verification error:", error);

            setMessage(
                "verifyMessage",
                getErrorMessage(error),
                true
            );
        }
    });


// ==========================================
// REVOKE CERTIFICATE
// Issuer or registry owner only
// ==========================================

document
    .getElementById("revokeCertificateForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        try {
            if (!(await checkConnection())) return;

            const batchId =
                document.getElementById("revokeBatchId")
                    .value.trim();

            if (!batchId) {
                throw new Error("Enter a Batch ID.");
            }

            setMessage(
                "revokeMessage",
                "Waiting for MetaMask confirmation..."
            );

            const tx =
                await certificateContract.revokeCertificate(
                    batchId
                );

            setMessage(
                "revokeMessage",
                "Transaction submitted. Waiting for confirmation..."
            );

            await tx.wait();

            saveTransaction(
                "Certificate Revoked",
                batchId,
                "Certificate revoked",
                tx.hash
            );

            setMessage(
                "revokeMessage",
                "Certificate revoked on the blockchain."
            );

            document
                .getElementById("revokeCertificateForm")
                .reset();

            if (
                document.getElementById("verifyBatchId")
                    .value.trim() === batchId
            ) {
                document
                    .getElementById("verifyForm")
                    .requestSubmit();
            }

        } catch (error) {
            console.error("Certificate revocation error:", error);

            setMessage(
                "revokeMessage",
                getErrorMessage(error),
                true
            );
        }
    });


// ==========================================
// METAMASK ACCOUNT / NETWORK CHANGES
// ==========================================

if (window.ethereum) {
    window.ethereum.on("accountsChanged", function () {
        window.location.reload();
    });

    window.ethereum.on("chainChanged", function () {
        window.location.reload();
    });
}


// ==========================================
// AUTO VERIFY WHEN QR CODE IS SCANNED
// ==========================================

const urlParams =
    new URLSearchParams(window.location.search);

const scannedBatchId =
    urlParams.get("batch");

if (scannedBatchId) {
    document.getElementById(
        "verifyBatchId"
    ).value = scannedBatchId;

    window.addEventListener("load", function () {
        document.getElementById("verify")
            .scrollIntoView({ behavior: "smooth" });

        document.getElementById("verifyForm")
            .requestSubmit();
    });
}

console.log("MediTrace frontend loaded successfully.");
