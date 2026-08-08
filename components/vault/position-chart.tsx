"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { useReadContract, useAccount } from "wagmi";
import { parseAbi } from "viem";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

function formatValue(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toFixed(2);
}


function generateChartData(baseTvl: number, days: number, transactions: any[] = []) {
  const data = [];
  const pointsPerDay = days === 7 ? 4 : 1; 
  const totalDaysToGoBack = days === 365 ? 364 : days - 1;
  const totalPoints = totalDaysToGoBack * pointsPerDay;
  
  const now = new Date();
  
  let mockWiggle = 0;
  for (let i = 0; i <= totalPoints; i++) {
    const date = new Date(now.getTime() - (i * (24 * 60 * 60 * 1000) / pointsPerDay));
    
    let realOffset = 0;
    for (const tx of transactions) {
      if (tx.status === 'confirmed') {
        const txDate = new Date(tx.timestamp || tx.ts);
        if (txDate > date) {
          const amount = parseFloat(tx.amount) || 0;
          if (tx.type.toLowerCase() === 'deposit') {
            realOffset -= amount;
          } else if (tx.type.toLowerCase() === 'withdraw') {
            realOffset += amount;
          }
        }
      }
    }
    
    if (i > 0) {
      const pseudoRandom = Math.sin(i * 87.331) * Math.cos(i * 12.987);
      const volatility = days > 90 ? 0.05 : 0.02;
      const change = baseTvl * volatility * pseudoRandom / pointsPerDay;
      const drift = (baseTvl * 0.4) / totalPoints; 
      mockWiggle -= change + drift; 
    }
    
    data.push({
      timestamp: date.getTime(),
      value: Math.max(0, baseTvl + realOffset + mockWiggle),
    });
  }
  
  return data.reverse();
}

const EDICT_PROXY_VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
const vaultAbi = parseAbi([
  "function userDeposits(address user) external view returns (uint256)"
]);

export function PositionChart() {
  const activeTab = useStore((state) => state.activeTab);
  const storeTotalDeposited = useStore((state) => state.pools[activeTab].totalDeposited);
  const transactions = useStore((state) => state.transactions);
  const { address } = useAccount();
  
  const { data: userDepositsData } = useReadContract({
    address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: "userDeposits",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && activeTab === "USDC" },
  });
  
  const totalDeposited = activeTab === "USDC"
    ? (userDepositsData !== undefined ? Number(userDepositsData) / 1e6 : 0)
    : storeTotalDeposited;
  
  const [timeRange, setTimeRange] = React.useState("30");

  const chartData = React.useMemo(() => {
    return generateChartData(totalDeposited, parseInt(timeRange), transactions);
  }, [totalDeposited, timeRange, transactions]);

  const chartConfig = {
    value: {
      label: "Position Value",
      color: "hsl(var(--foreground))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="w-full bg-card border-black/5 dark:border-white/[0.03] shadow-2xl rounded-[1.5rem] overflow-hidden">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 md:p-8 pb-4">
        <div>
          <CardTitle className="text-xl font-medium tracking-tight">Position Performance ({activeTab})</CardTitle>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:w-[140px] bg-background border-border h-9 text-sm font-medium shadow-none hover:bg-accent hover:text-accent-foreground transition-colors">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="365" className="rounded-lg">All Time</SelectItem>
            <SelectItem value="90" className="rounded-lg">Last 3 months</SelectItem>
            <SelectItem value="30" className="rounded-lg">Last 30 days</SelectItem>
            <SelectItem value="7" className="rounded-lg">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-6 md:p-8 pt-0">
        <div className="w-full h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <defs>
                <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.10} />
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="currentColor" strokeOpacity={0.05} />
              <XAxis
                dataKey="timestamp"
                tickLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
                tickMargin={12}
                minTickGap={timeRange === "7" ? 50 : 30}
                tickFormatter={(val) => {
                  const date = new Date(val);
                  if (timeRange === "7") return date.toLocaleDateString("en-US", { weekday: "short" });
                  if (timeRange === "365") return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
                fontSize={12}
                stroke="currentColor"
                opacity={0.6}
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val) => {
                  return activeTab === "USDC" ? `$${formatValue(val)}` : formatValue(val);
                }}
                fontSize={12}
                stroke="currentColor"
                opacity={0.6}
                width={80}
              />
              <ChartTooltip
                cursor={{ stroke: "currentColor", strokeOpacity: 0.1, strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  const date = new Date(data.timestamp).toISOString().split('T')[0];
                  const value = formatValue(data.value);
                  
                  return (
                    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm shadow-xl flex flex-col gap-1.5">
                      <div className="font-medium text-foreground">{date}</div>
                      <div className="font-medium text-foreground">{value} {activeTab}</div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeOpacity={0.35}
                fill="url(#fillValue)"
                animationDuration={1500}
                className="text-foreground"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
