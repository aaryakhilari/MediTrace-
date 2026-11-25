const CUSTOMER_MEDICINE_ADDRESS =
    "0x79efC2414cb43d3c190fA62463Ca46a1513d9D59";
const CUSTOMER_CERTIFICATE_ADDRESS =
    "0x0F0acd0CD3A0616A22635A6a1f40450ec5671fB7";
const CUSTOMER_RPC_URL =
    "https://ethereum-sepolia-rpc.publicnode.com";
const CUSTOMER_IPFS_GATEWAY =
    "https://gateway.pinata.cloud/ipfs/";

function setCustomerMessage(message, isError = false) {
    const element = document.getElementById("customerMessage");
    element.textContent = message;
    element.style.color = isError ? "#ff7777" : "#16c6b0";
}

function formatCustomerDate(timestamp) {
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-IN");
}

function downloadCustomerTextFile(filename, contents) {
    const file = contents instanceof Blob
        ? contents
        : new Blob([contents], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}

async function loadCustomerVerification() {
    const batchId = new URLSearchParams(window.location.search)
        .get("batch")
        ?.trim();

    if (!batchId) {
        throw new Error("This QR code does not contain a medicine batch ID.");
    }

    const readProvider = new ethers.JsonRpcProvider(CUSTOMER_RPC_URL);
    const medicineContract = new ethers.Contract(
        CUSTOMER_MEDICINE_ADDRESS,
        window.contractABI,
        readProvider
    );
    const certificateContract = new ethers.Contract(
        CUSTOMER_CERTIFICATE_ADDRESS,
        window.certificateRegistryABI,
        readProvider
    );

    const medicine = await medicineContract.verifyMedicine(batchId);
    if (!medicine[6]) {
        throw new Error("No medicine is registered for this batch ID.");
    }

    const expired = await medicineContract.isExpired(batchId);
    document.getElementById("resultBatchId").textContent = medicine[0];
    document.getElementById("resultMedicineName").textContent = medicine[1];
    document.getElementById("resultManufacturer").textContent = medicine[2];
    document.getElementById("resultManufacturingDate").textContent =
        formatCustomerDate(medicine[3]);
    document.getElementById("resultExpiryDate").textContent =
        formatCustomerDate(medicine[4]);
    document.getElementById("resultStage").textContent = medicine[5];

    const medicineStatus = document.getElementById("resultStatus");
    medicineStatus.textContent = expired
        ? "EXPIRED"
        : "REGISTERED - NOT EXPIRED";
    medicineStatus.style.color = expired ? "#ff7777" : "#16c6b0";
    document.getElementById("medicineResult").hidden = false;

    try {
        const certificate = await certificateContract.getCertificate(batchId);
        if (!certificate.exists) {
            document.getElementById("noCertificateMessage").hidden = false;
            setCustomerMessage("Medicine verified, but no certificate is recorded.");
            return;
        }

        document.getElementById("resultCertificateNumber").textContent =
            certificate.certificateNumber;
        document.getElementById("resultCertificateType").textContent =
            certificate.certificateType;
        document.getElementById("resultCertificateIssuer").textContent =
            certificate.issuer;
        document.getElementById("resultCertificateDate").textContent =
            new Date(Number(certificate.issuedAt) * 1000).toLocaleString("en-IN");

        const certificateStatus = document.getElementById("resultCertificateStatus");
        certificateStatus.textContent = certificate.revoked
            ? "REVOKED"
            : "RECORDED - NOT REVOKED";
        certificateStatus.style.color = certificate.revoked
            ? "#ff7777"
            : "#16c6b0";

        document.getElementById("resultCertificateHash").textContent =
            certificate.documentHash;

        const pdfUrl = CUSTOMER_IPFS_GATEWAY + encodeURIComponent(certificate.ipfsCID);
        const certificateLink = document.getElementById("certificateFileLink");
        certificateLink.href = pdfUrl;
        certificateLink.download = `MediTrace-${certificate.certificateNumber}.pdf`;
        document.getElementById("certificateResult").hidden = false;

        document.getElementById("downloadCertificateBtn")
            .addEventListener("click", async function () {
                const button = document.getElementById("downloadCertificateBtn");
                button.disabled = true;
                setCustomerMessage("Preparing certificate download...");

                try {
                    const response = await fetch(pdfUrl);
                    if (!response.ok) throw new Error("Certificate download failed.");

                    const pdf = await response.blob();
                    downloadCustomerTextFile(
                        `MediTrace-${certificate.certificateNumber}.pdf`,
                        pdf
                    );
                    setCustomerMessage("Certificate download started.");
                } catch (error) {
                    console.error("PDF download error:", error);
                    setCustomerMessage(
                        "Direct download was blocked by the browser. Open the Certificate PDF above and use your browser’s Save or Download option.",
                        true
                    );
                } finally {
                    button.disabled = false;
                }
            });

        document.getElementById("downloadDetailsBtn")
            .addEventListener("click", function () {
                const details = [
                    "MediTrace Medicine and Certificate Details",
                    `Batch ID: ${medicine[0]}`,
                    `Medicine Name: ${medicine[1]}`,
                    `Manufacturer: ${medicine[2]}`,
                    `Manufacturing Date: ${formatCustomerDate(medicine[3])}`,
                    `Expiry Date: ${formatCustomerDate(medicine[4])}`,
                    `Supply Chain Stage: ${medicine[5]}`,
                    `Medicine Status: ${expired ? "EXPIRED" : "REGISTERED - NOT EXPIRED"}`,
                    `Certificate Number: ${certificate.certificateNumber}`,
                    `Certificate Type: ${certificate.certificateType}`,
                    `Issuer: ${certificate.issuer}`,
                    `Issue Date: ${new Date(Number(certificate.issuedAt) * 1000).toLocaleString("en-IN")}`,
                    `Certificate Status: ${certificate.revoked ? "REVOKED" : "RECORDED - NOT REVOKED"}`,
                    `Document Hash: ${certificate.documentHash}`,
                    `Certificate PDF: ${pdfUrl}`
                ].join("\n");

                const safeBatchId = String(medicine[0]).replace(/[^a-z0-9_-]/gi, "_");
                downloadCustomerTextFile(
                    `MediTrace-${safeBatchId}-details.txt`,
                    details
                );
            });
    } catch (error) {
        const message = String(
            error?.reason || error?.shortMessage || error?.message || ""
        ).toLowerCase();

        if (message.includes("certificate not found")) {
            document.getElementById("noCertificateMessage").hidden = false;
        } else {
            throw error;
        }
    }

    setCustomerMessage("Medicine and certificate records loaded from Sepolia.");
}

loadCustomerVerification().catch(error => {
    console.error("Customer verification error:", error);
    setCustomerMessage(
        error?.shortMessage || error?.reason || error?.message ||
            "Could not load these records. Check your internet connection and try again.",
        true
    );
});
