// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./YieldCalculator.sol";
import "./QIESettlement.sol";

/**
 * @title YieldAggregator
 * @dev Cross-chain yield aggregator contract for optimizing DeFi yields
 */
contract YieldAggregator is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // Structs
    struct Strategy {
        address strategyAddress;
        string name;
        bool isActive;
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint256 performanceFee;
        uint256 managementFee;
    }

    struct UserDeposit {
        uint256 amount;
        uint256 timestamp;
        uint256 strategyId;
        bool isActive;
    }

    struct CrossChainTransfer {
        uint256 amount;
        address token;
        uint256 sourceChainId;
        uint256 targetChainId;
        address user;
        bool isCompleted;
        uint256 timestamp;
    }

    // State variables
    mapping(uint256 => Strategy) public strategies;
    mapping(address => UserDeposit[]) public userDeposits;
    mapping(bytes32 => CrossChainTransfer) public crossChainTransfers;
    
    uint256 public totalStrategies;
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;
    uint256 public performanceFeeRate = 2000; // 20%
    uint256 public managementFeeRate = 200; // 2%
    
    address public feeCollector;
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Yield aggregation components
    YieldCalculator public yieldCalculator;
    QIESettlement public qieSettlement;
    
    // Enhanced strategy management
    mapping(address => bool) public isRegisteredStrategy;
    mapping(uint256 => address) public strategyAddresses;
    uint256 public strategyCount;
    
    // Events
    event StrategyAdded(uint256 indexed strategyId, address indexed strategyAddress, string name);
    event StrategyUpdated(uint256 indexed strategyId, bool isActive);
    event Deposit(address indexed user, uint256 indexed strategyId, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed strategyId, uint256 amount);
    event CrossChainTransferInitiated(
        bytes32 indexed transferId,
        address indexed user,
        uint256 amount,
        uint256 sourceChainId,
        uint256 targetChainId
    );
    event CrossChainTransferCompleted(bytes32 indexed transferId);
    event FeesCollected(uint256 performanceFee, uint256 managementFee);
    event FeeRatesUpdated(uint256 performanceFeeRate, uint256 managementFeeRate);

    constructor(address _feeCollector) Ownable(msg.sender) {
        feeCollector = _feeCollector;
    }

    /**
     * @dev Add a new yield strategy
     */
    function addStrategy(
        address _strategyAddress,
        string memory _name,
        uint256 _performanceFee,
        uint256 _managementFee
    ) external onlyOwner {
        require(_strategyAddress != address(0), "Invalid strategy address");
        
        totalStrategies++;
        strategies[totalStrategies] = Strategy({
            strategyAddress: _strategyAddress,
            name: _name,
            isActive: true,
            totalDeposited: 0,
            totalWithdrawn: 0,
            performanceFee: _performanceFee,
            managementFee: _managementFee
        });

        emit StrategyAdded(totalStrategies, _strategyAddress, _name);
    }

    /**
     * @dev Update strategy status
     */
    function updateStrategy(uint256 _strategyId, bool _isActive) external onlyOwner {
        require(_strategyId > 0 && _strategyId <= totalStrategies, "Invalid strategy ID");
        strategies[_strategyId].isActive = _isActive;
        emit StrategyUpdated(_strategyId, _isActive);
    }

    /**
     * @dev Deposit funds into a strategy
     */
    function deposit(uint256 _strategyId, uint256 _amount) external nonReentrant whenNotPaused {
        require(_strategyId > 0 && _strategyId <= totalStrategies, "Invalid strategy ID");
        require(_amount > 0, "Amount must be greater than 0");
        
        Strategy storage strategy = strategies[_strategyId];
        require(strategy.isActive, "Strategy is not active");

        // Transfer tokens from user to contract
        IERC20 token = IERC20(strategy.strategyAddress);
        token.safeTransferFrom(msg.sender, address(this), _amount);

        // Record user deposit
        userDeposits[msg.sender].push(UserDeposit({
            amount: _amount,
            timestamp: block.timestamp,
            strategyId: _strategyId,
            isActive: true
        }));

        // Update strategy totals
        strategy.totalDeposited += _amount;
        totalDeposited += _amount;

        emit Deposit(msg.sender, _strategyId, _amount);
    }

    /**
     * @dev Withdraw funds from a strategy
     */
    function withdraw(uint256 _depositIndex, uint256 _amount) external nonReentrant {
        require(_depositIndex < userDeposits[msg.sender].length, "Invalid deposit index");
        
        UserDeposit storage userDeposit = userDeposits[msg.sender][_depositIndex];
        require(userDeposit.isActive, "Deposit is not active");
        require(_amount <= userDeposit.amount, "Insufficient balance");
        require(_amount > 0, "Amount must be greater than 0");

        uint256 strategyId = userDeposit.strategyId;
        Strategy storage strategy = strategies[strategyId];

        // Calculate fees
        uint256 timeElapsed = block.timestamp - userDeposit.timestamp;
        uint256 managementFee = (_amount * managementFeeRate * timeElapsed) / (365 days * FEE_DENOMINATOR);
        uint256 performanceFee = 0; // Calculate based on strategy performance
        
        uint256 netAmount = _amount - managementFee - performanceFee;

        // Update user deposit
        userDeposit.amount -= _amount;
        if (userDeposit.amount == 0) {
            userDeposit.isActive = false;
        }

        // Update strategy totals
        strategy.totalWithdrawn += _amount;
        totalWithdrawn += _amount;

        // Transfer tokens to user
        IERC20 token = IERC20(strategy.strategyAddress);
        token.safeTransfer(msg.sender, netAmount);

        // Transfer fees to fee collector
        if (managementFee > 0 || performanceFee > 0) {
            uint256 totalFees = managementFee + performanceFee;
            token.safeTransfer(feeCollector, totalFees);
            emit FeesCollected(performanceFee, managementFee);
        }

        emit Withdraw(msg.sender, strategyId, _amount);
    }

    /**
     * @dev Initiate cross-chain transfer
     */
    function initiateCrossChainTransfer(
        uint256 _amount,
        address _token,
        uint256 _targetChainId,
        address _targetContract
    ) external nonReentrant whenNotPaused {
        require(_amount > 0, "Amount must be greater than 0");
        require(_token != address(0), "Invalid token address");

        // Transfer tokens from user to contract
        IERC20 token = IERC20(_token);
        token.safeTransferFrom(msg.sender, address(this), _amount);

        // Generate unique transfer ID
        bytes32 transferId = keccak256(
            abi.encodePacked(
                msg.sender,
                _amount,
                _token,
                block.chainid,
                _targetChainId,
                block.timestamp
            )
        );

        // Record cross-chain transfer
        crossChainTransfers[transferId] = CrossChainTransfer({
            amount: _amount,
            token: _token,
            sourceChainId: block.chainid,
            targetChainId: _targetChainId,
            user: msg.sender,
            isCompleted: false,
            timestamp: block.timestamp
        });

        emit CrossChainTransferInitiated(transferId, msg.sender, _amount, block.chainid, _targetChainId);
    }

    /**
     * @dev Complete cross-chain transfer (called by bridge contract)
     */
    function completeCrossChainTransfer(bytes32 _transferId, address _targetUser) external {
        require(_transferId != bytes32(0), "Invalid transfer ID");
        
        CrossChainTransfer storage transfer = crossChainTransfers[_transferId];
        require(!transfer.isCompleted, "Transfer already completed");

        transfer.isCompleted = true;

        // Transfer tokens to target user
        IERC20 token = IERC20(transfer.token);
        token.safeTransfer(_targetUser, transfer.amount);

        emit CrossChainTransferCompleted(_transferId);
    }

    /**
     * @dev Get user deposit count
     */
    function getUserDepositCount(address _user) external view returns (uint256) {
        return userDeposits[_user].length;
    }

    /**
     * @dev Get user deposit details
     */
    function getUserDeposit(address _user, uint256 _index) external view returns (UserDeposit memory) {
        require(_index < userDeposits[_user].length, "Invalid deposit index");
        return userDeposits[_user][_index];
    }

    /**
     * @dev Get strategy details
     */
    function getStrategy(uint256 _strategyId) external view returns (Strategy memory) {
        require(_strategyId > 0 && _strategyId <= totalStrategies, "Invalid strategy ID");
        return strategies[_strategyId];
    }

    /**
     * @dev Update fee rates
     */
    function updateFeeRates(uint256 _performanceFeeRate, uint256 _managementFeeRate) external onlyOwner {
        require(_performanceFeeRate <= 5000, "Performance fee too high"); // Max 50%
        require(_managementFeeRate <= 1000, "Management fee too high"); // Max 10%
        
        performanceFeeRate = _performanceFeeRate;
        managementFeeRate = _managementFeeRate;
        
        emit FeeRatesUpdated(_performanceFeeRate, _managementFeeRate);
    }

    /**
     * @dev Set fee collector
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid fee collector address");
        feeCollector = _feeCollector;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
