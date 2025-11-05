// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YieldCalculator
 * @dev Advanced yield calculation and aggregation logic
 */
contract YieldCalculator is Ownable {
    
    // Precision constants
    uint256 public constant PRECISION = 1e18;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // Strategy interface - we'll use direct calls to strategy contracts
    
    // Yield calculation structs
    struct YieldData {
        uint256 timestamp;
        uint256 totalValue;
        uint256 totalYield;
        uint256 averageAPY;
        uint256[] strategyYields;
        uint256[] strategyValues;
    }
    
    struct StrategyWeight {
        address strategy;
        uint256 weight; // Percentage (0-10000, where 10000 = 100%)
        bool isActive;
    }
    
    // State variables
    mapping(address => StrategyWeight) public strategyWeights;
    address[] public strategies;
    YieldData[] public yieldHistory;
    uint256 public lastCalculationTimestamp;
    uint256 public totalWeight;
    
    // Events
    event StrategyAdded(address indexed strategy, uint256 weight);
    event StrategyWeightUpdated(address indexed strategy, uint256 newWeight);
    event StrategyRemoved(address indexed strategy);
    event YieldCalculated(uint256 totalYield, uint256 averageAPY, uint256 timestamp);
    event YieldHistoryUpdated(uint256 totalValue, uint256 totalYield);
    
    constructor(address _owner) Ownable(_owner) {
        lastCalculationTimestamp = block.timestamp;
    }
    
    /**
     * @dev Add a new yield strategy
     */
    function addStrategy(address strategy, uint256 weight) external onlyOwner {
        require(strategy != address(0), "Invalid strategy address");
        require(weight <= 10000, "Weight cannot exceed 100%");
        require(!strategyWeights[strategy].isActive, "Strategy already exists");
        
        strategyWeights[strategy] = StrategyWeight({
            strategy: strategy,
            weight: weight,
            isActive: true
        });
        
        strategies.push(strategy);
        totalWeight += weight;
        
        emit StrategyAdded(strategy, weight);
    }
    
    /**
     * @dev Update strategy weight
     */
    function updateStrategyWeight(address strategy, uint256 newWeight) external onlyOwner {
        require(strategyWeights[strategy].isActive, "Strategy not found");
        require(newWeight <= 10000, "Weight cannot exceed 100%");
        
        totalWeight = totalWeight - strategyWeights[strategy].weight + newWeight;
        strategyWeights[strategy].weight = newWeight;
        
        emit StrategyWeightUpdated(strategy, newWeight);
    }
    
    /**
     * @dev Remove a strategy
     */
    function removeStrategy(address strategy) external onlyOwner {
        require(strategyWeights[strategy].isActive, "Strategy not found");
        
        totalWeight -= strategyWeights[strategy].weight;
        strategyWeights[strategy].isActive = false;
        
        // Remove from strategies array
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i] == strategy) {
                strategies[i] = strategies[strategies.length - 1];
                strategies.pop();
                break;
            }
        }
        
        emit StrategyRemoved(strategy);
    }
    
    /**
     * @dev Calculate weighted average yield across all strategies
     */
    function calculateWeightedYield() public view returns (uint256) {
        if (strategies.length == 0 || totalWeight == 0) return 0;
        
        uint256 weightedYield = 0;
        
        for (uint256 i = 0; i < strategies.length; i++) {
            address strategy = strategies[i];
            StrategyWeight memory weight = strategyWeights[strategy];
            
            if (weight.isActive) {
                // Direct call to strategy contract
                (bool success, bytes memory data) = strategy.staticcall(
                    abi.encodeWithSignature("getCurrentYieldRate()")
                );
                if (success && data.length >= 32) {
                    uint256 yieldRate = abi.decode(data, (uint256));
                    weightedYield += (yieldRate * weight.weight) / 10000;
                }
            }
        }
        
        return weightedYield;
    }
    
    /**
     * @dev Calculate total value across all strategies
     */
    function calculateTotalValue() public view returns (uint256) {
        uint256 totalValue = 0;
        
        for (uint256 i = 0; i < strategies.length; i++) {
            address strategy = strategies[i];
            StrategyWeight memory weight = strategyWeights[strategy];
            
            if (weight.isActive) {
                // Direct call to strategy contract
                (bool success, bytes memory data) = strategy.staticcall(
                    abi.encodeWithSignature("getTotalValue()")
                );
                if (success && data.length >= 32) {
                    uint256 value = abi.decode(data, (uint256));
                    totalValue += value;
                }
            }
        }
        
        return totalValue;
    }
    
    /**
     * @dev Calculate accumulated yield across all strategies
     */
    function calculateTotalAccumulatedYield() public view returns (uint256) {
        uint256 totalYield = 0;
        
        for (uint256 i = 0; i < strategies.length; i++) {
            address strategy = strategies[i];
            StrategyWeight memory weight = strategyWeights[strategy];
            
            if (weight.isActive) {
                // Direct call to strategy contract
                (bool success, bytes memory data) = strategy.staticcall(
                    abi.encodeWithSignature("calculateAccumulatedYield()")
                );
                if (success && data.length >= 32) {
                    uint256 yield = abi.decode(data, (uint256));
                    totalYield += yield;
                }
            }
        }
        
        return totalYield;
    }
    
    /**
     * @dev Get detailed yield data for all strategies (internal)
     */
    function _getDetailedYieldData() internal view returns (YieldData memory) {
        uint256[] memory strategyYields = new uint256[](strategies.length);
        uint256[] memory strategyValues = new uint256[](strategies.length);
        
        for (uint256 i = 0; i < strategies.length; i++) {
            address strategy = strategies[i];
            StrategyWeight memory weight = strategyWeights[strategy];
            
            if (weight.isActive) {
                // Direct call to strategy contract for yield rate
                (bool success1, bytes memory data1) = strategy.staticcall(
                    abi.encodeWithSignature("getCurrentYieldRate()")
                );
                if (success1 && data1.length >= 32) {
                    strategyYields[i] = abi.decode(data1, (uint256));
                } else {
                    strategyYields[i] = 0;
                }
                
                // Direct call to strategy contract for total value
                (bool success2, bytes memory data2) = strategy.staticcall(
                    abi.encodeWithSignature("getTotalValue()")
                );
                if (success2 && data2.length >= 32) {
                    strategyValues[i] = abi.decode(data2, (uint256));
                } else {
                    strategyValues[i] = 0;
                }
            }
        }
        
        return YieldData({
            timestamp: block.timestamp,
            totalValue: calculateTotalValue(),
            totalYield: calculateTotalAccumulatedYield(),
            averageAPY: calculateWeightedYield(),
            strategyYields: strategyYields,
            strategyValues: strategyValues
        });
    }

    /**
     * @dev Get detailed yield data for all strategies (public)
     */
    function getDetailedYieldData() external view returns (YieldData memory) {
        return _getDetailedYieldData();
    }
    
    /**
     * @dev Update yield history
     */
    function updateYieldHistory() external {
        YieldData memory newData = _getDetailedYieldData();
        yieldHistory.push(newData);
        lastCalculationTimestamp = block.timestamp;
        
        emit YieldCalculated(newData.totalYield, newData.averageAPY, block.timestamp);
        emit YieldHistoryUpdated(newData.totalValue, newData.totalYield);
    }
    
    /**
     * @dev Get yield history
     */
    function getYieldHistory(uint256 limit) external view returns (YieldData[] memory) {
        uint256 length = yieldHistory.length;
        if (limit == 0 || limit > length) {
            limit = length;
        }
        
        YieldData[] memory history = new YieldData[](limit);
        uint256 startIndex = length - limit;
        
        for (uint256 i = 0; i < limit; i++) {
            history[i] = yieldHistory[startIndex + i];
        }
        
        return history;
    }
    
    /**
     * @dev Calculate optimal strategy allocation
     */
    function calculateOptimalAllocation(uint256 totalAmount) external view returns (uint256[] memory allocations) {
        allocations = new uint256[](strategies.length);
        
        for (uint256 i = 0; i < strategies.length; i++) {
            address strategy = strategies[i];
            StrategyWeight memory weight = strategyWeights[strategy];
            
            if (weight.isActive) {
                allocations[i] = (totalAmount * weight.weight) / 10000;
            }
        }
        
        return allocations;
    }
    
    /**
     * @dev Get strategy count
     */
    function getStrategyCount() external view returns (uint256) {
        return strategies.length;
    }
    
    /**
     * @dev Get all strategies
     */
    function getAllStrategies() external view returns (address[] memory) {
        return strategies;
    }
    
    /**
     * @dev Get strategy weight
     */
    function getStrategyWeight(address strategy) external view returns (uint256) {
        return strategyWeights[strategy].weight;
    }
    
    /**
     * @dev Check if strategy is active
     */
    function isStrategyActive(address strategy) external view returns (bool) {
        return strategyWeights[strategy].isActive;
    }
}
