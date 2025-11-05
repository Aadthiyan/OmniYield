// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title UniswapV3Strategy
 * @dev Strategy for yield farming on Uniswap V3 liquidity pools
 */
contract UniswapV3Strategy is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Token addresses
    IERC20 public immutable token0;
    IERC20 public immutable token1;
    
    // Strategy state
    uint256 public totalDeposited0;
    uint256 public totalDeposited1;
    uint256 public totalWithdrawn0;
    uint256 public totalWithdrawn1;
    uint256 public lastUpdateTimestamp;
    uint256 public cumulativeFees;
    
    // Pool parameters
    uint24 public constant FEE_TIER = 3000; // 0.3% fee tier
    int24 public constant TICK_LOWER = -887200; // Full range
    int24 public constant TICK_UPPER = 887200;  // Full range
    
    // Yield calculation
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant PRECISION = 1e18;
    
    // Events
    event Deposit(address indexed user, uint256 amount0, uint256 amount1);
    event Withdraw(address indexed user, uint256 amount0, uint256 amount1);
    event FeesCollected(uint256 fees0, uint256 fees1, uint256 timestamp);
    
    constructor(
        address _token0,
        address _token1,
        address _owner
    ) Ownable(_owner) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        lastUpdateTimestamp = block.timestamp;
    }
    
    /**
     * @dev Deposit tokens into Uniswap V3 pool
     */
    function deposit(uint256 amount0, uint256 amount1) external nonReentrant {
        require(amount0 > 0 || amount1 > 0, "At least one amount must be greater than 0");
        
        // Transfer tokens from user
        if (amount0 > 0) {
            token0.safeTransferFrom(msg.sender, address(this), amount0);
            totalDeposited0 += amount0;
        }
        if (amount1 > 0) {
            token1.safeTransferFrom(msg.sender, address(this), amount1);
            totalDeposited1 += amount1;
        }
        
        // Calculate fees before deposit
        _updateFees();
        
        // Note: In real implementation, you would:
        // 1. Create or add to Uniswap V3 position
        // 2. Mint NFT representing the position
        // 3. Track the position ID
        
        emit Deposit(msg.sender, amount0, amount1);
    }
    
    /**
     * @dev Withdraw tokens from Uniswap V3 pool
     */
    function withdraw(uint256 amount0, uint256 amount1) external nonReentrant {
        require(amount0 > 0 || amount1 > 0, "At least one amount must be greater than 0");
        require(amount0 <= totalDeposited0, "Insufficient token0 balance");
        require(amount1 <= totalDeposited1, "Insufficient token1 balance");
        
        // Calculate fees before withdrawal
        _updateFees();
        
        // Note: In real implementation, you would:
        // 1. Remove liquidity from Uniswap V3 position
        // 2. Collect fees
        // 3. Burn or update the position NFT
        
        if (amount0 > 0) {
            totalDeposited0 -= amount0;
            totalWithdrawn0 += amount0;
            token0.safeTransfer(msg.sender, amount0);
        }
        if (amount1 > 0) {
            totalDeposited1 -= amount1;
            totalWithdrawn1 += amount1;
            token1.safeTransfer(msg.sender, amount1);
        }
        
        emit Withdraw(msg.sender, amount0, amount1);
    }
    
    /**
     * @dev Calculate current fee rate from Uniswap V3
     */
    function getCurrentFeeRate() public view returns (uint256) {
        if (totalDeposited0 == 0 && totalDeposited1 == 0) return 0;
        
        // Simulate Uniswap V3 fee collection (typically 0.05-1% APY depending on volume)
        // In real implementation, you would query the pool's fee growth
        uint256 simulatedAPY = 3 * PRECISION / 100; // 3% APY
        
        return simulatedAPY;
    }
    
    /**
     * @dev Calculate accumulated fees since last update
     */
    function calculateAccumulatedFees() public view returns (uint256) {
        if (totalDeposited0 == 0 && totalDeposited1 == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - lastUpdateTimestamp;
        uint256 feeRate = getCurrentFeeRate();
        
        // Calculate fees based on total value
        uint256 totalValue = totalDeposited0 + totalDeposited1; // Simplified: 1:1 ratio
        uint256 fees = (totalValue * feeRate * timeElapsed) / (SECONDS_PER_YEAR * PRECISION);
        
        return fees;
    }
    
    /**
     * @dev Update cumulative fees
     */
    function _updateFees() internal {
        uint256 newFees = calculateAccumulatedFees();
        if (newFees > 0) {
            cumulativeFees += newFees;
            lastUpdateTimestamp = block.timestamp;
            emit FeesCollected(newFees / 2, newFees / 2, block.timestamp); // Split between tokens
        }
    }
    
    /**
     * @dev Get total value including accumulated fees
     */
    function getTotalValue() external view returns (uint256) {
        uint256 totalDeposited = totalDeposited0 + totalDeposited1;
        return totalDeposited + calculateAccumulatedFees();
    }
    
    /**
     * @dev Get current fee percentage
     */
    function getFeePercentage() external view returns (uint256) {
        uint256 totalDeposited = totalDeposited0 + totalDeposited1;
        if (totalDeposited == 0) return 0;
        
        uint256 currentValue = totalDeposited + calculateAccumulatedFees();
        return ((currentValue - totalDeposited) * PRECISION) / totalDeposited;
    }
    
    /**
     * @dev Collect fees manually (owner only)
     */
    function collectFees() external onlyOwner {
        _updateFees();
        // In real implementation, you would call Uniswap's collect function
    }
    
    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        
        if (balance0 > 0) {
            token0.safeTransfer(owner(), balance0);
        }
        if (balance1 > 0) {
            token1.safeTransfer(owner(), balance1);
        }
    }
}
