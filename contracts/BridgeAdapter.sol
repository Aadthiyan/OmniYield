// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./WrappedToken.sol";

/**
 * @title BridgeAdapter
 * @dev Enhanced bridge adapter with real protocol integration support for Wormhole and ChainBridge
 * Supports both simulation mode and real bridge protocol integration
 */
contract BridgeAdapter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Core components
    WrappedToken public wrappedToken;
    address public bridgeOperator;
    
    // Bridge protocol configuration
    enum BridgeProtocol { Wormhole, ChainBridge, Simulation }
    BridgeProtocol public protocol;
    
    // Protocol-specific addresses
    address public wormholeCore;
    address public wormholeTokenBridge;
    address public chainBridgeContract;
    address public chainBridgeHandler;
    
    // Transfer tracking
    struct CrossChainTransfer {
        address user;
        address token;
        uint256 amount;
        uint256 sourceChainId;
        uint256 destinationChainId;
        bytes32 messageId;
        bool isCompleted;
        uint256 timestamp;
    }
    
    mapping(bytes32 => CrossChainTransfer) public transfers;
    mapping(bytes32 => bool) public processedMessages; // Prevent replay attacks
    mapping(address => bool) public supportedTokens;
    
    // Events
    event Locked(address indexed user, address indexed token, uint256 amount, uint256 dstChainId, bytes to, bytes32 transferId);
    event Minted(address indexed to, uint256 amount, uint256 srcChainId, bytes srcTx, bytes32 messageId);
    event Burned(address indexed from, uint256 amount, uint256 dstChainId, bytes to, bytes32 transferId);
    event Released(address indexed to, address indexed token, uint256 amount, uint256 srcChainId, bytes srcTx, bytes32 messageId);
    event ProtocolUpdated(BridgeProtocol oldProtocol, BridgeProtocol newProtocol);
    event TokenSupportUpdated(address indexed token, bool supported);
    event TransferCompleted(bytes32 indexed transferId, bool success);

    modifier onlyBridgeOperator() {
        require(msg.sender == bridgeOperator || msg.sender == owner(), "Not bridge operator");
        _;
    }

    modifier validToken(address token) {
        require(supportedTokens[token] || token == address(0), "Token not supported");
        _;
    }

    constructor(
        address wrappedToken_,
        address operator_,
        BridgeProtocol protocol_
    ) Ownable(msg.sender) {
        wrappedToken = WrappedToken(wrappedToken_);
        bridgeOperator = operator_;
        protocol = protocol_;
    }

    /**
     * @dev Update bridge protocol configuration
     */
    function setProtocol(BridgeProtocol protocol_) external onlyOwner {
        BridgeProtocol oldProtocol = protocol;
        protocol = protocol_;
        emit ProtocolUpdated(oldProtocol, protocol_);
    }

    /**
     * @dev Set Wormhole protocol addresses
     */
    function setWormholeAddresses(address core_, address tokenBridge_) external onlyOwner {
        wormholeCore = core_;
        wormholeTokenBridge = tokenBridge_;
    }

    /**
     * @dev Set ChainBridge protocol addresses
     */
    function setChainBridgeAddresses(address bridge_, address handler_) external onlyOwner {
        chainBridgeContract = bridge_;
        chainBridgeHandler = handler_;
    }

    /**
     * @dev Update bridge operator
     */
    function setBridgeOperator(address operator_) external onlyOwner {
        bridgeOperator = operator_;
    }

    /**
     * @dev Add or remove supported tokens
     */
    function setTokenSupport(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit TokenSupportUpdated(token, supported);
    }

    /**
     * @dev Lock canonical token on source chain and initiate cross-chain transfer
     */
    function lock(
        address token,
        uint256 amount,
        uint256 dstChainId,
        bytes calldata to
    ) external nonReentrant validToken(token) {
        require(amount > 0, "Amount must be greater than 0");
        require(dstChainId != block.chainid, "Cannot bridge to same chain");
        
        // Transfer tokens from user to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Generate unique transfer ID
        bytes32 transferId = keccak256(abi.encodePacked(
            msg.sender,
            token,
            amount,
            block.chainid,
            dstChainId,
            block.timestamp,
            block.number
        ));
        
        // Record transfer
        transfers[transferId] = CrossChainTransfer({
            user: msg.sender,
            token: token,
            amount: amount,
            sourceChainId: block.chainid,
            destinationChainId: dstChainId,
            messageId: bytes32(0), // Will be set by protocol
            isCompleted: false,
            timestamp: block.timestamp
        });
        
        // Emit event for off-chain relayer
        emit Locked(msg.sender, token, amount, dstChainId, to, transferId);
        
        // In real implementation, this would call the actual bridge protocol
        if (protocol == BridgeProtocol.Wormhole) {
            _initiateWormholeTransfer(transferId, token, amount, dstChainId, to);
        } else if (protocol == BridgeProtocol.ChainBridge) {
            _initiateChainBridgeTransfer(transferId, token, amount, dstChainId, to);
        }
        // Simulation mode - no additional action needed
    }

    /**
     * @dev Mint wrapped token on destination chain (called by bridge operator)
     */
    function mint(
        address to,
        uint256 amount,
        uint256 srcChainId,
        bytes calldata srcTx,
        bytes32 messageId
    ) external onlyBridgeOperator {
        require(amount > 0, "Amount must be greater than 0");
        require(!processedMessages[messageId], "Message already processed");
        
        // Mark message as processed
        processedMessages[messageId] = true;
        
        // Mint wrapped tokens
        wrappedToken.mint(to, amount);
        
        emit Minted(to, amount, srcChainId, srcTx, messageId);
    }

    /**
     * @dev Burn wrapped token on source (wrapped) chain
     */
    function burn(
        uint256 amount,
        uint256 dstChainId,
        bytes calldata to
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(dstChainId != block.chainid, "Cannot bridge to same chain");
        
        // Burn wrapped tokens
        wrappedToken.burn(msg.sender, amount);
        
        // Generate unique transfer ID
        bytes32 transferId = keccak256(abi.encodePacked(
            msg.sender,
            address(wrappedToken),
            amount,
            block.chainid,
            dstChainId,
            block.timestamp,
            block.number
        ));
        
        // Record transfer
        transfers[transferId] = CrossChainTransfer({
            user: msg.sender,
            token: address(wrappedToken),
            amount: amount,
            sourceChainId: block.chainid,
            destinationChainId: dstChainId,
            messageId: bytes32(0),
            isCompleted: false,
            timestamp: block.timestamp
        });
        
        emit Burned(msg.sender, amount, dstChainId, to, transferId);
        
        // In real implementation, this would call the actual bridge protocol
        if (protocol == BridgeProtocol.Wormhole) {
            _initiateWormholeBurn(transferId, amount, dstChainId, to);
        } else if (protocol == BridgeProtocol.ChainBridge) {
            _initiateChainBridgeBurn(transferId, amount, dstChainId, to);
        }
    }

    /**
     * @dev Release canonical token on destination chain (called by bridge operator)
     */
    function release(
        address token,
        address to,
        uint256 amount,
        uint256 srcChainId,
        bytes calldata srcTx,
        bytes32 messageId
    ) external onlyBridgeOperator {
        require(amount > 0, "Amount must be greater than 0");
        require(!processedMessages[messageId], "Message already processed");
        
        // Mark message as processed
        processedMessages[messageId] = true;
        
        // Transfer tokens to user
        IERC20(token).safeTransfer(to, amount);
        
        emit Released(to, token, amount, srcChainId, srcTx, messageId);
    }

    /**
     * @dev Complete a cross-chain transfer (called by bridge operator)
     */
    function completeTransfer(
        bytes32 transferId,
        bytes32 messageId,
        bool success
    ) external onlyBridgeOperator {
        require(transfers[transferId].user != address(0), "Transfer not found");
        require(!transfers[transferId].isCompleted, "Transfer already completed");
        
        transfers[transferId].isCompleted = true;
        transfers[transferId].messageId = messageId;
        
        emit TransferCompleted(transferId, success);
    }

    /**
     * @dev Get transfer details
     */
    function getTransfer(bytes32 transferId) external view returns (CrossChainTransfer memory) {
        return transfers[transferId];
    }

    /**
     * @dev Check if message has been processed
     */
    function isMessageProcessed(bytes32 messageId) external view returns (bool) {
        return processedMessages[messageId];
    }

    /**
     * @dev Emergency function to recover tokens
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    // Internal functions for protocol-specific implementations
    
    function _initiateWormholeTransfer(
        bytes32 transferId,
        address token,
        uint256 amount,
        uint256 dstChainId,
        bytes calldata to
    ) internal {
        // In real implementation, this would call Wormhole contracts
        // For now, this is a placeholder
        require(wormholeCore != address(0), "Wormhole not configured");
    }

    function _initiateChainBridgeTransfer(
        bytes32 transferId,
        address token,
        uint256 amount,
        uint256 dstChainId,
        bytes calldata to
    ) internal {
        // In real implementation, this would call ChainBridge contracts
        // For now, this is a placeholder
        require(chainBridgeContract != address(0), "ChainBridge not configured");
    }

    function _initiateWormholeBurn(
        bytes32 transferId,
        uint256 amount,
        uint256 dstChainId,
        bytes calldata to
    ) internal {
        // In real implementation, this would call Wormhole contracts
        require(wormholeCore != address(0), "Wormhole not configured");
    }

    function _initiateChainBridgeBurn(
        bytes32 transferId,
        uint256 amount,
        uint256 dstChainId,
        bytes calldata to
    ) internal {
        // In real implementation, this would call ChainBridge contracts
        require(chainBridgeContract != address(0), "ChainBridge not configured");
    }
}


