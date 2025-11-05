// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title QIESettlement
 * @dev Instant settlement contract using QIE's fast finality
 */
contract QIESettlement is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Settlement state
    enum SettlementStatus {
        Pending,
        Processing,
        Completed,
        Failed,
        Cancelled
    }

    struct Settlement {
        uint256 settlementId;
        address user;
        address token;
        uint256 amount;
        uint256 yieldAmount;
        SettlementStatus status;
        uint256 timestamp;
        uint256 blockNumber;
        bytes32 qieTransactionHash;
        string qieNetwork;
    }

    // State variables
    mapping(uint256 => Settlement) public settlements;
    mapping(address => uint256[]) public userSettlements;
    mapping(bytes32 => uint256) public qieTxToSettlement;
    
    uint256 public settlementCounter;
    uint256 public totalSettlements;
    uint256 public totalSettledAmount;
    uint256 public totalSettledYield;
    
    // QIE integration
    address public qieValidator;
    mapping(string => bool) public supportedNetworks;
    
    // Settlement parameters
    uint256 public settlementFee = 50; // 0.5% (50/10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public maxSettlementAmount = 1000000 * 1e18; // 1M tokens max
    
    // Events
    event SettlementInitiated(
        uint256 indexed settlementId,
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 yieldAmount
    );
    event SettlementProcessed(
        uint256 indexed settlementId,
        bytes32 indexed qieTxHash,
        string qieNetwork
    );
    event SettlementCompleted(
        uint256 indexed settlementId,
        uint256 finalAmount,
        uint256 feeAmount
    );
    event SettlementFailed(
        uint256 indexed settlementId,
        string reason
    );
    event QIEValidatorUpdated(address indexed oldValidator, address indexed newValidator);
    event NetworkSupported(string indexed network, bool supported);
    event SettlementFeeUpdated(uint256 oldFee, uint256 newFee);
    
    constructor(address _owner) Ownable(_owner) {
        qieValidator = _owner; // Initially set to owner
        supportedNetworks["ethereum"] = true;
        supportedNetworks["polygon"] = true;
        supportedNetworks["bsc"] = true;
    }
    
    /**
     * @dev Initiate instant settlement
     */
    function initiateSettlement(
        address token,
        uint256 amount,
        uint256 yieldAmount
    ) external nonReentrant returns (uint256) {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= maxSettlementAmount, "Amount exceeds maximum");
        require(yieldAmount >= 0, "Invalid yield amount");
        
        // Transfer tokens from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        settlementCounter++;
        uint256 settlementId = settlementCounter;
        
        Settlement memory newSettlement = Settlement({
            settlementId: settlementId,
            user: msg.sender,
            token: token,
            amount: amount,
            yieldAmount: yieldAmount,
            status: SettlementStatus.Pending,
            timestamp: block.timestamp,
            blockNumber: block.number,
            qieTransactionHash: bytes32(0),
            qieNetwork: ""
        });
        
        settlements[settlementId] = newSettlement;
        userSettlements[msg.sender].push(settlementId);
        totalSettlements++;
        
        emit SettlementInitiated(settlementId, msg.sender, token, amount, yieldAmount);
        
        return settlementId;
    }
    
    /**
     * @dev Process settlement using QIE (called by QIE validator)
     */
    function processSettlement(
        uint256 settlementId,
        bytes32 qieTxHash,
        string calldata qieNetwork
    ) external {
        require(msg.sender == qieValidator, "Only QIE validator");
        require(settlements[settlementId].status == SettlementStatus.Pending, "Invalid settlement status");
        require(qieTxHash != bytes32(0), "Invalid QIE transaction hash");
        require(supportedNetworks[qieNetwork], "Unsupported network");
        
        settlements[settlementId].status = SettlementStatus.Processing;
        settlements[settlementId].qieTransactionHash = qieTxHash;
        settlements[settlementId].qieNetwork = qieNetwork;
        
        qieTxToSettlement[qieTxHash] = settlementId;
        
        emit SettlementProcessed(settlementId, qieTxHash, qieNetwork);
    }
    
    /**
     * @dev Complete settlement after QIE confirmation
     */
    function completeSettlement(
        uint256 settlementId,
        uint256 finalAmount
    ) external nonReentrant {
        require(msg.sender == qieValidator, "Only QIE validator");
        require(settlements[settlementId].status == SettlementStatus.Processing, "Invalid settlement status");
        require(finalAmount > 0, "Invalid final amount");
        
        Settlement storage settlement = settlements[settlementId];
        
        // Calculate fee
        uint256 feeAmount = (finalAmount * settlementFee) / FEE_DENOMINATOR;
        uint256 netAmount = finalAmount - feeAmount;
        
        // Update settlement
        settlement.status = SettlementStatus.Completed;
        
        // Transfer tokens to user
        IERC20(settlement.token).safeTransfer(settlement.user, netAmount);
        
        // Update totals
        totalSettledAmount += netAmount;
        totalSettledYield += settlement.yieldAmount;
        
        emit SettlementCompleted(settlementId, netAmount, feeAmount);
    }
    
    /**
     * @dev Fail settlement
     */
    function failSettlement(
        uint256 settlementId,
        string calldata reason
    ) external {
        require(msg.sender == qieValidator, "Only QIE validator");
        require(settlements[settlementId].status == SettlementStatus.Processing, "Invalid settlement status");
        
        Settlement storage settlement = settlements[settlementId];
        settlement.status = SettlementStatus.Failed;
        
        // Return tokens to user
        IERC20(settlement.token).safeTransfer(settlement.user, settlement.amount);
        
        emit SettlementFailed(settlementId, reason);
    }
    
    /**
     * @dev Cancel settlement (user can cancel if still pending)
     */
    function cancelSettlement(uint256 settlementId) external nonReentrant {
        Settlement storage settlement = settlements[settlementId];
        require(settlement.user == msg.sender, "Not settlement owner");
        require(settlement.status == SettlementStatus.Pending, "Cannot cancel");
        
        settlement.status = SettlementStatus.Cancelled;
        
        // Return tokens to user
        IERC20(settlement.token).safeTransfer(msg.sender, settlement.amount);
        
        emit SettlementFailed(settlementId, "Cancelled by user");
    }
    
    /**
     * @dev Get settlement details
     */
    function getSettlement(uint256 settlementId) external view returns (Settlement memory) {
        return settlements[settlementId];
    }
    
    /**
     * @dev Get user settlements
     */
    function getUserSettlements(address user) external view returns (uint256[] memory) {
        return userSettlements[user];
    }
    
    /**
     * @dev Get settlement by QIE transaction hash
     */
    function getSettlementByQieTx(bytes32 qieTxHash) external view returns (uint256) {
        return qieTxToSettlement[qieTxHash];
    }
    
    /**
     * @dev Calculate settlement fee
     */
    function calculateSettlementFee(uint256 amount) external view returns (uint256) {
        return (amount * settlementFee) / FEE_DENOMINATOR;
    }
    
    /**
     * @dev Check if settlement is eligible for instant processing
     */
    function isEligibleForInstantSettlement(
        address token,
        uint256 amount
    ) external view returns (bool) {
        return (
            amount <= maxSettlementAmount &&
            amount > 0 &&
            token != address(0)
        );
    }
    
    /**
     * @dev Set QIE validator (owner only)
     */
    function setQIEValidator(address newValidator) external onlyOwner {
        require(newValidator != address(0), "Invalid validator address");
        address oldValidator = qieValidator;
        qieValidator = newValidator;
        emit QIEValidatorUpdated(oldValidator, newValidator);
    }
    
    /**
     * @dev Add/remove supported network (owner only)
     */
    function setNetworkSupport(string calldata network, bool supported) external onlyOwner {
        supportedNetworks[network] = supported;
        emit NetworkSupported(network, supported);
    }
    
    /**
     * @dev Update settlement fee (owner only)
     */
    function updateSettlementFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        uint256 oldFee = settlementFee;
        settlementFee = newFee;
        emit SettlementFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Update maximum settlement amount (owner only)
     */
    function updateMaxSettlementAmount(uint256 newMax) external onlyOwner {
        maxSettlementAmount = newMax;
    }
    
    /**
     * @dev Withdraw fees (owner only)
     */
    function withdrawFees(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }
    
    /**
     * @dev Get settlement statistics
     */
    function getSettlementStats() external view returns (
        uint256 totalSettlements_,
        uint256 totalSettledAmount_,
        uint256 totalSettledYield_,
        uint256 activeSettlements
    ) {
        totalSettlements_ = totalSettlements;
        totalSettledAmount_ = totalSettledAmount;
        totalSettledYield_ = totalSettledYield;
        
        // Count active settlements
        for (uint256 i = 1; i <= settlementCounter; i++) {
            if (settlements[i].status == SettlementStatus.Pending ||
                settlements[i].status == SettlementStatus.Processing) {
                activeSettlements++;
            }
        }
    }
}
