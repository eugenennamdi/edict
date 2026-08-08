import { createPublicClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const VAULT = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";

async function main() {
    const res = await fetch(`https://api-sepolia.basescan.org/api?module=contract&action=getabi&address=${VAULT}`);
    const data = await res.json();
    if (data.status === "1") {
        const abi = JSON.parse(data.result);
        const fns = abi.filter(x => x.type === "function").map(x => x.name);
        console.log(fns);
    } else {
        console.log(data);
    }
}
main();
