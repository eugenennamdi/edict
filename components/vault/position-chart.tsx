"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
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

function generateChartData(baseTvl: number, days: number) {
  const data = [];
  let currentTvl = baseTvl * (1 - (days / 365) * 0.4); 
  
  const pointsPerDay = days === 7 ? 4 : 1; 
  const totalDaysToGoBack = days === 365 ? 364 : days - 1;
  const totalPoints = totalDaysToGoBack * pointsPerDay;
  
  for (let i = totalPoints; i >= 0; i--) {
    const date = new Date();
    date.setHours(date.getHours() - (i * (24 / pointsPerDay)));
    
    const volatility = days > 90 ? 0.08 : 0.03;
    const changeFactor = (Math.random() * volatility - (volatility * 0.2)) / pointsPerDay;
    const dailyChange = baseTvl * changeFactor;
    currentTvl = Math.max(0, currentTvl + dailyChange);
    
    if (i === 0) {
      currentTvl = baseTvl;
    }
    
    data.push({
      timestamp: date.getTime(),
      value: currentTvl,
    });
  }
  return data;
}

export function PositionChart() {
  const activeTab = useStore((state) => state.activeTab);
  const totalDeposited = useStore((state) => state.pools[activeTab].totalDeposited);
  
  const [timeRange, setTimeRange] = React.useState("30");

  const chartData = React.useMemo(() => {
    return generateChartData(totalDeposited, parseInt(timeRange));
  }, [totalDeposited, timeRange]);

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
