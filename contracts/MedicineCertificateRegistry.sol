
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Connects the certificate contract to the updated MedicineTracker.
interface IMedicineTracker {
    function verifyMedicine(string calldata batchId)
        external
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256,
            uint256,
            string memory,
            bool
        );
}

contract MedicineCertificateRegistry {

    address public owner;

    IMedicineTracker public medicineTracker;

    mapping(address => bool) public authorizedManufacturers;

    struct Certificate {
        string batchId;
        string certificateNumber;
        string certificateType;
        string ipfsCID;
        bytes32 documentHash;
        address issuer;
        uint256 issuedAt;
        bool revoked;
        bool exists;
    }

    mapping(bytes32 => Certificate) private certificates;

    event ManufacturerAuthorizationChanged(
        address indexed manufacturer,
        bool authorized
    );

    event CertificateAdded(
        bytes32 indexed batchKey,
        string batchId,
        string certificateNumber,
        address indexed issuer,
        string ipfsCID,
        bytes32 documentHash
    );

    event CertificateRevoked(
        bytes32 indexed batchKey,
        address indexed revokedBy
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorizedManufacturer() {
        require(
            authorizedManufacturers[msg.sender],
            "Manufacturer wallet is not authorized"
        );
        _;
    }

    constructor(address medicineTrackerAddress) {
        require(
            medicineTrackerAddress != address(0),
            "Invalid medicine tracker address"
        );

        owner = msg.sender;
        medicineTracker = IMedicineTracker(medicineTrackerAddress);
    }

    function setManufacturerAuthorization(
        address manufacturer,
        bool authorized
    ) external onlyOwner {

        require(manufacturer != address(0), "Invalid manufacturer address");

        authorizedManufacturers[manufacturer] = authorized;

        emit ManufacturerAuthorizationChanged(
            manufacturer,
            authorized
        );
    }

    function addCertificate(
        string calldata batchId,
        string calldata certificateNumber,
        string calldata certificateType,
        string calldata ipfsCID,
        bytes32 documentHash
    ) external onlyAuthorizedManufacturer {

        require(bytes(batchId).length > 0, "Batch ID is required");
        require(
            bytes(certificateNumber).length > 0,
            "Certificate number is required"
        );
        require(
            bytes(certificateType).length > 0,
            "Certificate type is required"
        );
        require(bytes(ipfsCID).length > 0, "IPFS CID is required");
        require(documentHash != bytes32(0), "Invalid document hash");

        (
            string memory storedBatchId,
            ,
            ,
            ,
            ,
            ,
            bool medicineExists
        ) = medicineTracker.verifyMedicine(batchId);

        require(medicineExists, "Medicine batch is not registered");
        require(
            keccak256(bytes(storedBatchId)) == keccak256(bytes(batchId)),
            "Batch ID mismatch"
        );

        bytes32 batchKey = keccak256(bytes(batchId));

        require(
            !certificates[batchKey].exists,
            "Certificate already exists for this batch"
        );

        certificates[batchKey] = Certificate({
            batchId: batchId,
            certificateNumber: certificateNumber,
            certificateType: certificateType,
            ipfsCID: ipfsCID,
            documentHash: documentHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false,
            exists: true
        });

        emit CertificateAdded(
            batchKey,
            batchId,
            certificateNumber,
            msg.sender,
            ipfsCID,
            documentHash
        );
    }

    function getCertificate(string calldata batchId)
        external
        view
        returns (Certificate memory)
    {
        bytes32 batchKey = keccak256(bytes(batchId));

        require(
            certificates[batchKey].exists,
            "Certificate not found"
        );

        return certificates[batchKey];
    }

    function revokeCertificate(string calldata batchId) external {

        bytes32 batchKey = keccak256(bytes(batchId));

        Certificate storage certificate = certificates[batchKey];

        require(certificate.exists, "Certificate not found");

        require(
            msg.sender == owner || msg.sender == certificate.issuer,
            "Not allowed to revoke this certificate"
        );

        require(!certificate.revoked, "Certificate already revoked");

        certificate.revoked = true;

        emit CertificateRevoked(batchKey, msg.sender);
    }
}
