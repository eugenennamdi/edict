export const PROTOCOLS = [
  { id: "aave", name: "Aave V3" },
  { id: "morpho", name: "Morpho Blue" },
  { id: "moonwell", name: "Moonwell" },
];


export const LOG_TEMPLATES = {
  compliant: (name: string, apy: string) => `[Watcher Agent]: CVA check passed for aBasSepUSDC Aave V3 | Compliance: 100% | APY: 1.46%`,
  violation: (name: string) => `[EMERGENCY EJECT]: CVA Failure detected on ${name}. Executing autonomous rebalance...`,
  action: (msg: string) => msg,
  success: (msg: string) => msg,
};
