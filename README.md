# MediTrace

**Blockchain-Based Medicine Authentication and Traceability System**

MediTrace is a blockchain-based application designed to improve medicine transparency and help users verify medicine authenticity. It uses Ethereum smart contracts to record medicine details and track their supply-chain status.

## Features

- Medicine registration using blockchain.
- Medicine verification using a unique Batch ID.
- Medicine supply-chain stage tracking.
- Manufacturer authorization.
- Digital certificate registration and verification.
- Certificate document upload with IPFS storage.
- SHA-256 document hash verification.
- MetaMask wallet integration.
- QR-code-based medicine verification.

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Blockchain:** Solidity, Ethereum Sepolia Testnet
- **Smart Contract Development:** Hardhat
- **Wallet:** MetaMask
- **Blockchain Interaction:** Ethers.js
- **Backend:** Node.js, Express.js
- **Document Storage:** IPFS using Pinata
- **Document Integrity:** SHA-256

## Smart Contracts

- `MedicineTracker.sol` — Registers medicines and tracks their status.
- `MedicineCertificateRegistry.sol` — Records and verifies medicine certificates.

## Network

Ethereum Sepolia Testnet

## Project Structure

```text
MediTrace/
├── backend/
├── contracts/
├── frontend/
├── ignition/
├── scripts/
├── test/
├── hardhat.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Security Notes

- Environment variables and API secrets are excluded from Git using `.gitignore`.
- This project is an academic prototype and is not a substitute for official pharmaceutical regulatory verification.

## Project Status

Under development.

## Author

Developed as a Blockchain Technology academic project.