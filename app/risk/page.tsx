import { SimulationEngine } from "@/components/risk/simulation-engine";
import { AuditLog } from "@/components/agent/audit-log";
import { RiskMetrics } from "@/components/risk/risk-metrics";
import { ProtocolHealthMatrix } from "@/components/risk/protocol-health-matrix";
import { AttestationModal } from "@/components/modals/attestation-modal";

export default function RiskPage() {
  return (
    <div className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24">
      
      <div className="mb-10">
        <h1 className="text-3xl font-sans font-semibold tracking-tight text-foreground/90">Autonomous Risk Engine</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Edict operates a multi-agent risk engine that continuously monitors underlying protocols for Cleanverse Verified Assets (CVA) compliance. Any violation triggers an immediate, autonomous evacuation of capital to safe harbors.
        </p>
      </div>

      <RiskMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full animate-fade-up items-start mb-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ProtocolHealthMatrix />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <SimulationEngine />
        </div>
      </div>

      <div className="w-full">
        <AuditLog />
      </div>

      <AttestationModal />
    </div>
  );
}
