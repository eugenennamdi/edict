// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

// Cleanverse Validator Interface
interface IAPassComplianceValidatorGov {
    function complianceVerify(address poolAddress, address userAddress) external view returns (bool);
}

contract EdictGovernance is AccessControl {
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    
    IAPassComplianceValidatorGov public immutable validator;

    struct Proposal {
        uint256 id;
        string title;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 id, string title);
    event VoteCast(address indexed voter, uint256 proposalId, bool support);

    constructor(address _validator) {
        require(_validator != address(0), "validator=0");
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        validator = IAPassComplianceValidatorGov(_validator);
    }

    function createProposal(string calldata title) external onlyRole(GOVERNOR_ROLE) {
        require(
            validator.complianceVerify(address(this), msg.sender),
            "CVI: Unverified Governor"
        );

        uint256 id = proposalCount++;
        proposals[id] = Proposal({
            id: id,
            title: title,
            forVotes: 0,
            againstVotes: 0,
            executed: false
        });
        emit ProposalCreated(id, title);
    }

    function castVote(uint256 proposalId, bool support) external {
        // Verify the voter's CVI (Cleanverse A-Pass)
        require(
            validator.complianceVerify(address(this), msg.sender),
            "CVI: Unverified Voter"
        );
        
        require(proposalId < proposalCount, "Invalid proposal");
        require(!proposals[proposalId].executed, "Proposal already executed");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposals[proposalId].forVotes++;
        } else {
            proposals[proposalId].againstVotes++;
        }

        emit VoteCast(msg.sender, proposalId, support);
    }
}
