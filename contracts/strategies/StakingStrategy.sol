// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StakingStrategy
 * @dev Strategy for staking tokens and earning rewards
 */
contract StakingStrategy is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Token addresses
    IERC20 public immutable stakingToken;     // Token to stake (ETH, MATIC, etc.)
    IERC20 public immutable rewardToken;      // Reward token (can be same as staking token)
    
    // Staking state
    uint256 public totalStaked;
    uint256 public totalRewardsPaid;
    uint256 public lastUpdateTimestamp;
    uint256 public rewardPerTokenStored;
    
    // Staking parameters
    uint256 public rewardRate;                // Rewards per second
    uint256 public constant REWARD_DURATION = 365 days;
    
    // Yield calculation
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant PRECISION = 1e18;
    
    // User staking info
    mapping(address => uint256) public userStaked;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public userRewards;
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event RewardRateUpdated(uint256 newRate, uint256 timestamp);
    
    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate,
        address _owner
    ) Ownable(_owner) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        lastUpdateTimestamp = block.timestamp;
    }
    
    /**
     * @dev Stake tokens
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Update rewards for user
        _updateReward(msg.sender);
        
        // Transfer tokens from user
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        userStaked[msg.sender] += amount;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Unstake tokens
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= userStaked[msg.sender], "Insufficient staked amount");
        
        // Update rewards for user
        _updateReward(msg.sender);
        
        userStaked[msg.sender] -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        stakingToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Claim rewards
     */
    function claimRewards() external nonReentrant {
        _updateReward(msg.sender);
        
        uint256 reward = userRewards[msg.sender];
        if (reward > 0) {
            userRewards[msg.sender] = 0;
            totalRewardsPaid += reward;
            
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward, block.timestamp);
        }
    }
    
    /**
     * @dev Update reward calculation
     */
    function _updateReward(address user) internal {
        if (totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - lastUpdateTimestamp;
            uint256 reward = timeElapsed * rewardRate;
            rewardPerTokenStored += (reward * PRECISION) / totalStaked;
        }
        
        if (user != address(0)) {
            userRewards[user] += (userStaked[user] * (rewardPerTokenStored - userRewardPerTokenPaid[user])) / PRECISION;
            userRewardPerTokenPaid[user] = rewardPerTokenStored;
        }
        
        lastUpdateTimestamp = block.timestamp;
    }
    
    /**
     * @dev Get current reward rate (APY)
     */
    function getCurrentRewardRate() public view returns (uint256) {
        if (totalStaked == 0) return 0;
        
        // Calculate APY: (rewardRate * SECONDS_PER_YEAR) / totalStaked
        return (rewardRate * SECONDS_PER_YEAR * PRECISION) / totalStaked;
    }
    
    /**
     * @dev Get pending rewards for a user
     */
    function getPendingRewards(address user) external view returns (uint256) {
        if (totalStaked == 0) return userRewards[user];
        
        uint256 currentRewardPerToken = rewardPerTokenStored;
        if (totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - lastUpdateTimestamp;
            uint256 reward = timeElapsed * rewardRate;
            currentRewardPerToken += (reward * PRECISION) / totalStaked;
        }
        
        uint256 pendingRewards = userRewards[user];
        if (userStaked[user] > 0) {
            pendingRewards += (userStaked[user] * (currentRewardPerToken - userRewardPerTokenPaid[user])) / PRECISION;
        }
        
        return pendingRewards;
    }
    
    /**
     * @dev Get total value including pending rewards
     */
    function getTotalValue() external view returns (uint256) {
        return totalStaked + (block.timestamp - lastUpdateTimestamp) * rewardRate;
    }
    
    /**
     * @dev Get current yield percentage (APY)
     */
    function getYieldPercentage() external view returns (uint256) {
        return getCurrentRewardRate();
    }
    
    /**
     * @dev Update reward rate (owner only)
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        _updateReward(address(0)); // Update global state
        rewardRate = newRate;
        emit RewardRateUpdated(newRate, block.timestamp);
    }
    
    /**
     * @dev Add reward tokens to the contract (owner only)
     */
    function addRewardTokens(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }
    
    /**
     * @dev Emergency withdrawal (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 stakingBalance = stakingToken.balanceOf(address(this));
        uint256 rewardBalance = rewardToken.balanceOf(address(this));
        
        if (stakingBalance > 0) {
            stakingToken.safeTransfer(owner(), stakingBalance);
        }
        if (rewardBalance > 0) {
            rewardToken.safeTransfer(owner(), rewardBalance);
        }
    }
}
