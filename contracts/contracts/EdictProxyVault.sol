// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interfaces for Aave V3 Pool
interface IPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

// Cleanverse Validator Interface
interface IAPassComplianceValidator {
    struct RuleV2 {
        bytes2 allowedGroup;
        bytes2 allowedSubGroup;
        uint8 minTier;
        uint8 minSubTier;
        uint256 poolCountryBitmap;
    }
    
    function setRuleV2FromContract(RuleV2 calldata rule) external;
    function addRuleV2FromContract(RuleV2 calldata rule) external;
    function removeRuleV2FromContract(uint256 index) external;
    function getRulesV2(address poolAddress) external view returns (RuleV2[] memory);
    
    function complianceVerify(address poolAddress, address userAddress) external view returns (bool);
}

contract EdictProxyVault is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    address public owner;

    uint256 public totalDeposits;
    mapping(address => uint256) public userDeposits;
    uint256 public depositCap = type(uint256).max;

    // Protocol addresses
    address public aaveV3Pool;
    address public morphoBlue; // Placeholder
    address public moonwell; // Placeholder
    
    // The testnet USDC token address on Base Sepolia
    IERC20 public usdc;

    // Cleanverse Validator
    IAPassComplianceValidator public immutable validator;

    // Mapping to track allocations per protocol
    mapping(address => uint256) public protocolAllocations;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Rebalanced(address indexed failingProtocol, address[] safeProtocols);
    event DepositCapUpdated(uint256 newCap);

    constructor(address _usdc, address _aaveV3Pool, address _morphoBlue, address _moonwell, address _validator) {
        require(_validator != address(0), "validator=0");
        owner = msg.sender;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        usdc = IERC20(_usdc);
        aaveV3Pool = _aaveV3Pool;
        morphoBlue = _morphoBlue;
        moonwell = _moonwell;
        validator = IAPassComplianceValidator(_validator);
    }

    function setDepositCap(uint256 _newCap) external onlyRole(DEFAULT_ADMIN_ROLE) {
        depositCap = _newCap;
        emit DepositCapUpdated(_newCap);
    }

    // ─── V2 Rule Management ────────────────────────────────────────────

    function setRuleV2FromContract(IAPassComplianceValidator.RuleV2 calldata rule) external onlyRole(DEFAULT_ADMIN_ROLE) {
        validator.setRuleV2FromContract(rule);
    }

    function addRuleV2FromContract(IAPassComplianceValidator.RuleV2 calldata rule) external onlyRole(DEFAULT_ADMIN_ROLE) {
        validator.addRuleV2FromContract(rule);
    }

    function removeRuleV2FromContract(uint256 index) external onlyRole(DEFAULT_ADMIN_ROLE) {
        validator.removeRuleV2FromContract(index);
    }

    function getRulesV2() external view returns (IAPassComplianceValidator.RuleV2[] memory) {
        return validator.getRulesV2(address(this));
    }

    // ───────────────────────────────────────────────────────────────────

    function deposit(uint256 amount) external {
        // Verify the depositor's CVI
        require(
            validator.complianceVerify(address(this), msg.sender),
            "A-Pass not qualified"
        );

        require(amount > 0, "Amount must be greater than 0");
        require(totalDeposits + amount <= depositCap, "Deposit cap exceeded");

        // Transfer USDC from user to this contract
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Update total deposits
        totalDeposits += amount;
        userDeposits[msg.sender] += amount;

        // Approve Aave V3 Pool to spend USDC
        usdc.approve(aaveV3Pool, amount);

        // Deposit into Aave V3 Pool
        IPool(aaveV3Pool).supply(address(usdc), amount, address(this), 0);

        // Track allocation for Aave V3
        protocolAllocations[aaveV3Pool] += amount;

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        // Verify the withdrawer's CVI
        require(
            validator.complianceVerify(address(this), msg.sender),
            "A-Pass not qualified"
        );

        require(amount > 0, "Amount must be greater than 0");
        require(userDeposits[msg.sender] >= amount, "Insufficient deposit");

        // Update total deposits
        totalDeposits -= amount;
        userDeposits[msg.sender] -= amount;

        // Decrease protocol allocation tracker
        if (protocolAllocations[aaveV3Pool] >= amount) {
            protocolAllocations[aaveV3Pool] -= amount;
        } else {
            protocolAllocations[aaveV3Pool] = 0;
        }

        // Withdraw from Aave V3 Pool to this contract
        IPool(aaveV3Pool).withdraw(address(usdc), amount, address(this));

        // Transfer USDC back to the user
        usdc.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function rebalance(address failingProtocol, address[] memory safeProtocols) external onlyRole(AGENT_ROLE) {
        // CVI check — agent must hold a valid A-Pass at call time
        require(
            validator.complianceVerify(address(this), msg.sender),
            "A-Pass not qualified"
        );

        require(failingProtocol != address(0), "Invalid failing protocol");
        require(safeProtocols.length > 0, "No safe protocols provided");

        uint256 amountToMove = protocolAllocations[failingProtocol];
        
        if (amountToMove > 0) {
            // Withdraw all aTokens from Aave V3 back into the vault.
            // type(uint256).max tells Aave to redeem the full aToken balance
            // (principal + accrued interest), avoiding dust from rounding.
            if (failingProtocol == aaveV3Pool) {
                IPool(aaveV3Pool).withdraw(address(usdc), type(uint256).max, address(this));
            }

            protocolAllocations[failingProtocol] = 0;

            // Distribute evenly among safe protocols
            uint256 splitAmount = amountToMove / safeProtocols.length;
            
            for (uint256 i = 0; i < safeProtocols.length; i++) {
                address safeProtocol = safeProtocols[i];
                
                // Only re-deploy into a real protocol — vault address acts as
                // "idle reserve" sentinel, so we skip supply() for it.
                if (safeProtocol == aaveV3Pool) {
                    usdc.approve(aaveV3Pool, splitAmount);
                    IPool(aaveV3Pool).supply(address(usdc), splitAmount, address(this), 0);
                }
                
                protocolAllocations[safeProtocol] += splitAmount;
            }
        }

        emit Rebalanced(failingProtocol, safeProtocols);
    }
}
