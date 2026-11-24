
import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Stop the server if the Pinata secret is missing.
if (!process.env.PINATA_JWT) {
    console.error("ERROR: PINATA_JWT is missing from backend/.env");
    process.exit(1);
}

// Allow requests from your local frontend.
app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ]
}));

app.use(express.json());

// Keep uploaded PDF temporarily in server memory.
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB maximum
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype !== "application/pdf") {
            return callback(
                new Error("Only PDF certificate files are allowed.")
            );
        }

        callback(null, true);
    }
});

// Check whether the backend is running.
app.get("/", (req, res) => {
    res.json({
        message: "MediTrace certificate backend is running."
    });
});

// Upload a certificate PDF to public IPFS through Pinata.
app.post(
    "/api/certificates/upload",
    upload.single("certificate"),
    async (req, res) => {

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a PDF certificate."
                });
            }

            // Calculate SHA-256 from the exact uploaded PDF bytes.
            const documentHash = crypto
                .createHash("sha256")
                .update(req.file.buffer)
                .digest("hex");

            // Prepare the file for Pinata.
            const formData = new FormData();

            formData.append("network", "public");

            const pdfBlob = new Blob(
                [req.file.buffer],
                { type: "application/pdf" }
            );

            formData.append(
                "file",
                pdfBlob,
                req.file.originalname
            );

            // Send the PDF to Pinata.
            const pinataResponse = await fetch(
                "https://uploads.pinata.cloud/v3/files",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.PINATA_JWT}`
                    },
                    body: formData
                }
            );

            const pinataData = await pinataResponse.json();

            if (!pinataResponse.ok) {
                console.error("Pinata upload error:", pinataData);

                return res.status(502).json({
                    success: false,
                    message: "Pinata could not upload the certificate."
                });
            }

            const cid = pinataData?.data?.cid;

            if (!cid) {
                return res.status(502).json({
                    success: false,
                    message: "Pinata did not return an IPFS CID."
                });
            }

            // Return public file details to the frontend.
            return res.status(200).json({
                success: true,
                message: "Certificate uploaded to IPFS successfully.",
                cid: cid,
                documentHash: documentHash,
                fileName: req.file.originalname,
                fileSize: req.file.size
            });

        } catch (error) {
            console.error("Certificate upload error:", error);

            return res.status(500).json({
                success: false,
                message: "Certificate upload failed."
            });
        }
    }
);

// Handle file validation and upload errors.
app.use((error, req, res, next) => {
    console.error(error.message);

    res.status(400).json({
        success: false,
        message: error.message || "Upload error."
    });
});

app.listen(PORT, () => {
    console.log(`MediTrace backend running at http://localhost:${PORT}`);
});
