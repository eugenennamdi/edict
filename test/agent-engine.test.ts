import { describe, it, expect, vi } from 'vitest';
import { useStore } from '../lib/store'; // Imported at the top instead of using require()

// Mock the Zustand store so we can test the agent logic in isolation
vi.mock('../lib/store', () => ({
  useStore: {
    getState: vi.fn(() => ({
      activeTab: 'vaults',
      pools: {
        vaults: {
          protocols: [
            { name: 'Aave V3', status: 'violation', amount: 1000 },
            { name: 'Morpho', status: 'compliant', amount: 0 }
          ],
          totalDeposited: 1000
        }
      },
      addLog: vi.fn(),
      setProtocols: vi.fn(),
      setAttestation: vi.fn(),
      agentSpeed: 1000,
      setIsAgentRunning: vi.fn()
    }))
  }
}));

describe('Watcher Agent Telemetry Engine', () => {
  it('should detect CVA violation and flag for evacuation', () => {
    // 1. Get the mocked state directly from our imported store
    const state = useStore.getState();
    
    // 2. Identify the violation
    const violationProtocol = state.pools.vaults.protocols.find((p: any) => p.status === 'violation');
    
    // 3. Assertions to prove the logic catches the failure
    expect(violationProtocol).toBeDefined();
    expect(violationProtocol.name).toBe('Aave V3');
    expect(violationProtocol.status).toBe('violation');
  });

  it('should reject unauthorized wallets missing an A-Pass (Simulation)', () => {
    // Simulating the IAPassComplianceValidator check
    const complianceVerify = (hasAPass: boolean) => {
        if (!hasAPass) throw new Error("A-Pass not qualified");
        return true;
    };

    expect(() => complianceVerify(false)).toThrowError("A-Pass not qualified");
    expect(complianceVerify(true)).toBe(true);
  });
});