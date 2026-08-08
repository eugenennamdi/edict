# Edict

> The Autonomous Compliance OS for Onchain Finance

---

Edict is an autonomous compliance operating system that sits above underlying DeFi liquidity venues (such as Aave V3) as a smart contract proxy vault architecture ([`EdictProxyVault.sol`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol)). It programmatically enforces real-time institutional regulatory compliance rules (Cleanverse Identity / CVI) directly onchain prior to executing capital operations like [`deposit`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol#L99) and [`withdraw`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol#L128).

To protect liquidity against real-time regulatory or counterparty risk, off-chain Watcher Agents continuously monitor Cleanverse CVA (Cleanverse Attestation / Audit) telemetry endpoints. Upon detecting a compliance failure or risk flag, the Watcher Agent invokes the vault's dual-guarded [`rebalance`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol#L158) function, executing an immediate flight-to-safety evacuation that liquidates position capital from failing venues and redistributes it into compliant protocols or sentinel idle vault reserves.

## System Data Flow & Telemetry Sequence

```mermaid
flowchart TD
    %% Node Styling Definitions
    classDef frontend fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef agent fill:#33291e,stroke:#f59e0b,stroke-width:2px,color:#fff
    classDef contract fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    classDef cleanverse fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff

    subgraph FE["Next.js Frontend UI"]
        UI["Vault Action Panel / UI<br/>(components/vaults/vault-action-panel.tsx)"]:::frontend
        API["Cleanverse Verify Route<br/>(app/api/cleanverse/verify/route.ts)"]:::frontend
    end

    subgraph AGENT["Headless Agent Mesh"]
        ENGINE["Watcher Agent Telemetry Engine<br/>(lib/agent-engine.ts)"]:::agent
        HOOK["Edict Rebalance Hook<br/>(hooks/use-edict-rebalance.ts)"]:::agent
    end

    subgraph CVA_CVI["Cleanverse Telemetry & Attestation"]
        CVA_API["Cleanverse CVA / CVI API<br/>(uatapi.cleanverse.com/api/cooperate)"]:::cleanverse
    end

    subgraph ONCHAIN["Base Sepolia Onchain Contracts"]
        VAL["Cleanverse Validator<br/>(0xaC7e5179C2C7f03f209136886c172eb34F161792)"]:::contract
        VAULT["EdictProxyVault<br/>(0x28E41078B83c7f756f875c834635627Dd9ecCB1D)"]:::contract
        AAVE["Aave V3 Pool<br/>(0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27)"]:::contract
    end

    %% User Flow
    UI -- "1. POST /api/cleanverse/verify" --> API
    API -- "2. generate_apass (AES-256 Encrypted Payload)" --> CVA_API
    UI -- "3. deposit(amount)" --> VAULT

    %% Compliance Check on Deposit
    VAULT -- "4. complianceVerify(vault, msg.sender)" --> VAL

    %% Deposit Execution into Aave V3
    VAULT -- "5. supply(usdc, amount, vault, 0)" --> AAVE

    %% Telemetry & Agent Polling Loop
    ENGINE -- "6. Poll query_apass (CVA Telemetry Check)" --> CVA_API
    ENGINE -- "7. Detect CVA Violation Flag" --> HOOK
    HOOK -- "8. rebalance(failingProtocol, safeProtocols)" --> VAULT

    %% Dual-Guard Access Control Verification
    VAULT -- "9. Access Control: onlyRole(AGENT_ROLE)" --> VAULT
    VAULT -- "10. Compliance Check: complianceVerify(vault, msg.sender)" --> VAL

    %% Flight to Safety Evacuation
    VAULT -- "11. withdraw(usdc, maxAmount, vault)" --> AAVE
```

## Core Architecture

* **Dual-Track Execution Rails**:
  * **Next.js UI Track**: Interactive frontend application built with Next.js, Wagmi, and Viem ([`app/`](file:///Users/apple/.gemini/antigravity/scratch/edict/app), [`components/`](file:///Users/apple/.gemini/antigravity/scratch/edict/components)) managing user onboarding, CVI passport generation ([`app/api/cleanverse/verify/route.ts`](file:///Users/apple/.gemini/antigravity/scratch/edict/app/api/cleanverse/verify/route.ts)), single-asset USDC deposits and withdrawals ([`components/vaults/vault-action-panel.tsx`](file:///Users/apple/.gemini/antigravity/scratch/edict/components/vaults/vault-action-panel.tsx)), protocol health visualization ([`components/risk/protocol-health-matrix.tsx`](file:///Users/apple/.gemini/antigravity/scratch/edict/components/risk/protocol-health-matrix.tsx)), and manual evacuation simulation ([`components/risk/simulation-engine.tsx`](file:///Users/apple/.gemini/antigravity/scratch/edict/components/risk/simulation-engine.tsx)).
  * **Headless Agent Mesh Track**: Autonomous background telemetry engine ([`lib/agent-engine.ts`](file:///Users/apple/.gemini/antigravity/scratch/edict/lib/agent-engine.ts), [`hooks/use-agent.ts`](file:///Users/apple/.gemini/antigravity/scratch/edict/hooks/use-agent.ts)) that executes periodic compliance audits against Cleanverse CVA endpoints. Upon detecting protocol health breaches or regulatory non-compliance, it broadcasts onchain flight-to-safety transactions ([`hooks/use-edict-rebalance.ts`](file:///Users/apple/.gemini/antigravity/scratch/edict/hooks/use-edict-rebalance.ts)).

* **Cleanverse Integration Points**:
  * **Cleanverse Identity (CVI)**: Onchain credential verification system enforced via [`IAPassComplianceValidator.complianceVerify(poolAddress, userAddress)`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol#L29). Core contracts ([`EdictProxyVault.sol`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol) and [`EdictGovernance.sol`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictGovernance.sol)) assert valid Cleanverse A-Pass ownership prior to executing deposits, withdrawals, proposal creation, or voting.
  * **Cleanverse Attestation / Audit (CVA)**: Off-chain telemetry and compliance verification API suite communicating via AES-256-CBC encrypted REST payloads with Cleanverse cooperation endpoints (`https://uatapi.cleanverse.com/api/cooperate/query_apass` and `/generate_apass`). Watcher Agents poll these endpoints ([`scripts/query-apass.js`](file:///Users/apple/.gemini/antigravity/scratch/edict/scripts/query-apass.js), [`app/api/cleanverse/verify/route.ts`](file:///Users/apple/.gemini/antigravity/scratch/edict/app/api/cleanverse/verify/route.ts)) to evaluate pool compliance before triggering automated rebalancing.

## Security Architecture Matrix

| Security Layer | Target / Standard | Codebase File Path | Function / Method Name |
| :--- | :--- | :--- | :--- |
| **CVI Identity Verification** | Onchain A-Pass qualification check for depositors & withdrawers | [`contracts/contracts/EdictProxyVault.sol`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol#L101-L104) | [`validator.complianceVerify(address(this), msg.sender)`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol#L102) in `deposit()` & `withdraw()` |
| **Dual-Guard Agent Access** | Mandatory `AGENT_ROLE` access control plus onchain CVI verification for rebalancing | [`contracts/contracts/EdictProxyVault.sol`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol#L158-L164) | [`rebalance()`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol#L158) with `onlyRole(AGENT_ROLE)` modifier & `validator.complianceVerify()` |
| **CVA Telemetry & Attestation** | Encrypted AES-256-CBC telemetry auditing & off-chain CVA polling loop | [`lib/agent-engine.ts`](file:///Users/apple/.gemini/antigravity/scratch/edict/lib/agent-engine.ts#L21-L77) & [`app/api/cleanverse/verify/route.ts`](file:///Users/apple/.gemini/antigravity/scratch/edict/app/api/cleanverse/verify/route.ts#L33-L44) | [`startAgent()`](file:///Users/apple/.gemini/antigravity/scratch/edict/lib/agent-engine.ts#L8) telemetry tick & `POST` handler for `/api/cleanverse/verify` |
| **Governance Credential Enforcement** | Compliance-gated proposal creation & voting eligibility | [`contracts/contracts/EdictGovernance.sol`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictGovernance.sol#L38-L60) | [`createProposal()`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictGovernance.sol#L38) [onlyRole(GOVERNOR_ROLE)] & [`castVote()`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictGovernance.sol#L55) with `validator.complianceVerify()` |
| **Sentinel Idle Reserve & Cap Safety** | Deposit cap enforcement & isolated vault sentinel address reallocation | [`contracts/contracts/EdictProxyVault.sol`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol#L107-L108) & [`hooks/use-edict-rebalance.ts`](file:///Users/apple/.gemini/antigravity/scratch/edict/hooks/use-edict-rebalance.ts#L26-L29) | [`depositCap`](file:///Users/apple/.gemini/antigravity/scratch/edict/contracts/contracts/EdictProxyVault.sol#L41) guard & `triggerFlightToSafety()` sentinel vault target |

---

**Warning: Edict enforces strict CVI checks onchain. Testing deposits or rebalance actions requires the connected wallet to hold a valid Cleanverse A-Pass.**
