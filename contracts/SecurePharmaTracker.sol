// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;



import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract SecurePharmaTracker is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");


    struct Batch {
        string batchId;
        string drugName;
        address manufacturer;
        uint256 quantity;
        uint256 manufacturingDate;
        uint256 expiryDate;
        BatchStatus status;
        mapping(string => string) qualityTests;
        bool exists;
    }


    enum BatchStatus {
        MANUFACTURED,
        QUALITY_TESTED,
        APPROVED,
        DISTRIBUTED,
        RECALLED
    }


    mapping(string => Batch) public batches;
    mapping(address => bool) public authorizedManufacturers;
    
    // Events for frontend integration
    event BatchCreated(string indexed batchId, address indexed manufacturer, uint256 timestamp);
    event BatchStatusUpdated(string indexed batchId, BatchStatus newStatus, uint256 timestamp);
    event QualityTestAdded(string indexed batchId, string testName, string result);
    event BatchRecalled(string indexed batchId, string reason, uint256 timestamp);


    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender);
    }


    modifier onlyValidBatch(string memory _batchId) {
        require(batches[_batchId].exists, "Batch does not exist");
        _;
    }


    modifier onlyBatchManufacturer(string memory _batchId) {
        require(batches[_batchId].manufacturer == msg.sender, "Not the batch manufacturer");
        _;
    }


    function createBatch(
        string memory _batchId,
        string memory _drugName,
        uint256 _quantity,
        uint256 _expiryDate
    ) external onlyRole(MANUFACTURER_ROLE) whenNotPaused nonReentrant {
        require(!batches[_batchId].exists, "Batch already exists");
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_expiryDate > block.timestamp, "Expiry date must be in the future");
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(bytes(_drugName).length > 0, "Drug name cannot be empty");


        Batch storage newBatch = batches[_batchId];
        newBatch.batchId = _batchId;
        newBatch.drugName = _drugName;
        newBatch.manufacturer = msg.sender;
        newBatch.quantity = _quantity;
        newBatch.manufacturingDate = block.timestamp;
        newBatch.expiryDate = _expiryDate;
        newBatch.status = BatchStatus.MANUFACTURED;
        newBatch.exists = true;


        emit BatchCreated(_batchId, msg.sender, block.timestamp);
    }


    function addQualityTest(
        string memory _batchId,
        string memory _testName,
        string memory _result
    ) external onlyRole(MANUFACTURER_ROLE) onlyValidBatch(_batchId) onlyBatchManufacturer(_batchId) {
        require(bytes(_testName).length > 0, "Test name cannot be empty");
        require(bytes(_result).length > 0, "Test result cannot be empty");
        
        batches[_batchId].qualityTests[_testName] = _result;
        emit QualityTestAdded(_batchId, _testName, _result);
    }


    function updateBatchStatus(
        string memory _batchId,
        BatchStatus _newStatus
    ) external onlyValidBatch(_batchId) {
        require(
            hasRole(MANUFACTURER_ROLE, msg.sender) || 
            hasRole(DISTRIBUTOR_ROLE, msg.sender) || 
            hasRole(REGULATOR_ROLE, msg.sender),
            "Not authorized to update status"
        );


        BatchStatus currentStatus = batches[_batchId].status;
        require(_isValidStatusTransition(currentStatus, _newStatus), "Invalid status transition");


        batches[_batchId].status = _newStatus;
        emit BatchStatusUpdated(_batchId, _newStatus, block.timestamp);
    }


    function recallBatch(
        string memory _batchId,
        string memory _reason
    ) external onlyRole(REGULATOR_ROLE) onlyValidBatch(_batchId) {
        require(bytes(_reason).length > 0, "Recall reason cannot be empty");
        
        batches[_batchId].status = BatchStatus.RECALLED;
        emit BatchRecalled(_batchId, _reason, block.timestamp);
    }


    function getBatchInfo(string memory _batchId) external view returns (
        string memory batchId,
        string memory drugName,
        address manufacturer,
        uint256 quantity,
        uint256 manufacturingDate,
        uint256 expiryDate,
        BatchStatus status
    ) {
        require(batches[_batchId].exists, "Batch does not exist");
        
        Batch storage batch = batches[_batchId];
        return (
            batch.batchId,
            batch.drugName,
            batch.manufacturer,
            batch.quantity,
            batch.manufacturingDate,
            batch.expiryDate,
            batch.status
        );
    }


    function getQualityTest(
        string memory _batchId,
        string memory _testName
    ) external view returns (string memory) {
        require(batches[_batchId].exists, "Batch does not exist");
        return batches[_batchId].qualityTests[_testName];
    }


    function _isValidStatusTransition(BatchStatus _current, BatchStatus _new) private pure returns (bool) {
        if (_current == BatchStatus.MANUFACTURED && _new == BatchStatus.QUALITY_TESTED) return true;
        if (_current == BatchStatus.QUALITY_TESTED && _new == BatchStatus.APPROVED) return true;
        if (_current == BatchStatus.APPROVED && _new == BatchStatus.DISTRIBUTED) return true;
        return false;
    }


    // Emergency functions
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }


    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}