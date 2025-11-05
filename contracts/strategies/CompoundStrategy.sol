// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CompoundStrategy
 * @dev Strategy for yield farming on Compound protocol
 */
contract CompoundStrategy is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Token addresses
    IERC20 public immutable underlyingToken;  // USDC, USDT, etc.
    IERC20 public immutable cToken;           // cUSDC, cUSDT, etc.
    
    // Strategy state
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;
    uint256 public lastUpdateTimestamp;
    uint256 public cumulativeYield;
    
    // Yield calculation
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant PRECISION = 1e18;
    
    // Events
    event Deposit(address indexed user, uint256 amount, uint256 cTokenAmount);
    event Withdraw(address indexed user, uint256 amount, uint256 cTokenAmount);
    event YieldCalculated(uint256 yield, uint256 timestamp);
    
    constructor(
        address _underlyingToken,
        address _cToken,
        address _owner
    ) Ownable(_owner) {
        underlyingToken = IERC20(_underlyingToken);
        cToken = IERC20(_cToken);
        lastUpdateTimestamp = block.timestamp;
    }
    
    /**
     * @dev Deposit tokens into Compound
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from user
        underlyingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Calculate current yield before deposit
        _updateYield();
        
        // Approve and mint cTokens
        underlyingToken.safeIncreaseAllowance(address(cToken), amount);
        
        // Note: In real implementation, you would call cToken.mint(amount)
        // For simulation, we'll just track the deposit
        uint256 cTokenAmount = amount; // 1:1 ratio for simulation
        
        totalDeposited += amount;
        
        emit Deposit(msg.sender, amount, cTokenAmount);
    }
    
    /**
     * @dev Withdraw tokens from Compound
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= totalDeposited, "Insufficient balance");
        
        // Calculate current yield before withdrawal
        _updateYield();
        
        // Note: In real implementation, you would call cToken.redeemUnderlying(amount)
        // For simulation, we'll just track the withdrawal
        uint256 cTokenAmount = amount; // 1:1 ratio for simulation
        
        totalDeposited -= amount;
        totalWithdrawn += amount;
        
        // Transfer tokens to user
        underlyingToken.safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, amount, cTokenAmount);
    }
    
    /**
     * @dev Calculate current yield rate from Compound
     */
    function getCurrentYieldRate() public view returns (uint256) {
        if (totalDeposited == 0) return 0;
        
        // Simulate Compound's supply rate (typically 2-8% APY)
        // In real implementation, you would call cToken.supplyRatePerBlock()
        uint256 simulatedAPY = 5 * PRECISION / 100; // 5% APY
        
        return simulatedAPY;
    }
    
    /**
     * @dev Calculate accumulated yield since last update
     */
    function calculateAccumulatedYield() public view returns (uint256) {
        if (totalDeposited == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - lastUpdateTimestamp;
        uint256 yieldRate = getCurrentYieldRate();
        
        // Calculate yield: principal * rate * time / year
        uint256 yield = (totalDeposited * yieldRate * timeElapsed) / (SECONDS_PER_YEAR * PRECISION);
        
        return yield;
    }
    
    /**
     * @dev Update cumulative yield
     */
    function _updateYield() internal {
        uint256 newYield = calculateAccumulatedYield();
        if (newYield > 0) {
            cumulativeYield += newYield;
            lastUpdateTimestamp = block.timestamp;
            emit YieldCalculated(newYield, block.timestamp);
        }
    }
    
    /**
     * @dev Get total value including accumulated yield
     */
    function getTotalValue() external view returns (uint256) {
        return totalDeposited + calculateAccumulatedYield();
    }
    
    /**
     * @dev Get current yield percentage
     */
    function getYieldPercentage() external view returns (uint256) {
        if (totalDeposited == 0) return 0;
        uint256 currentValue = totalDeposited + calculateAccumulatedYield();
        return ((currentValue - totalDeposited) * PRECISION) / totalDeposited;
    }
    
    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = underlyingToken.balanceOf(address(this));
        underlyingToken.safeTransfer(owner(), balance);
    }
}
