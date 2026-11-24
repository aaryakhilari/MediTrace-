
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicineTracker {

    address public owner;

    struct Medicine {
        string batchId;
        string medicineName;
        string manufacturer;
        uint256 manufacturingDate;
        uint256 expiryDate;
        string currentStage;
        bool exists;
    }

    mapping(bytes32 => Medicine) public medicines;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    // Register a new medicine
    function registerMedicine(
        string memory batchId,
        string memory medicineName,
        string memory manufacturer,
        uint256 manufacturingDate,
        uint256 expiryDate
    ) public onlyOwner {

        bytes32 id = keccak256(bytes(batchId));

        require(!medicines[id].exists, "Batch already registered");
        require(manufacturingDate <= block.timestamp, "Invalid manufacturing date");
        require(expiryDate > manufacturingDate, "Expiry must be after manufacturing");
        require(expiryDate > block.timestamp, "Medicine already expired");

        medicines[id] = Medicine(
            batchId,
            medicineName,
            manufacturer,
            manufacturingDate,
            expiryDate,
            "Manufactured",
            true
        );
    }

    // Update medicine supply chain stage
    function updateStage(
        string memory batchId,
        string memory newStage
    ) public onlyOwner {

        bytes32 id = keccak256(bytes(batchId));

        require(medicines[id].exists, "Medicine not found");

        medicines[id].currentStage = newStage;
    }

    // Verify medicine details
    function verifyMedicine(
        string memory batchId
    ) public view returns (
        string memory,
        string memory,
        string memory,
        uint256,
        uint256,
        string memory,
        bool
    ) {

        bytes32 id = keccak256(bytes(batchId));

        Medicine memory m = medicines[id];

        return (
            m.batchId,
            m.medicineName,
            m.manufacturer,
            m.manufacturingDate,
            m.expiryDate,
            m.currentStage,
            m.exists
        );
    }

    // Check expiry status
    function isExpired(
        string memory batchId
    ) public view returns (bool) {

        bytes32 id = keccak256(bytes(batchId));

        require(medicines[id].exists, "Medicine not found");

        return block.timestamp > medicines[id].expiryDate;
    }
}
