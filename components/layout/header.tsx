"use client";

import Image from "next/image";
import { truncateAddress } from "@/lib/utils";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Copy, ExternalLink, Power, Moon, Sun, Monitor, Hourglass } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export function Header() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const address = user?.wallet?.address || "";
  const isConnected = ready && authenticated;
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(address || "");
    toast("Address copied to clipboard");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pt-8 pb-4 px-6 pointer-events-none">
      
      {/* Premium Liquid Glass Top Mask */}
      <div 
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none backdrop-blur-2xl z-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]" 
      />
      {/* Subtle color gradient to ensure text fades out smoothly behind the blur */}
      <div 
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-b from-background/90 via-background/50 to-transparent z-0" 
      />

      <div className="w-full max-w-7xl flex items-center justify-between relative z-10">
        
        {/* Logo */}
        <div className="pointer-events-auto flex items-center shrink-0 w-80">
          <Image 
            src="/logo-final.png" 
            alt="Edict Logo" 
            width={300} 
            height={92}
            className="h-[74px] w-auto opacity-90 hover:opacity-100 transition-opacity dark:invert-0 invert drop-shadow-sm" 
            priority 
          />
        </div>

        {/* Floating Glass Pill Navigation - Liquid Glass Effect */}
        <div className="absolute left-1/2 -translate-x-1/2 double-bezel-outer !overflow-visible pointer-events-auto flex items-center shadow-2xl shadow-black/5 dark:shadow-white/5">
          <div className="double-bezel-inner !overflow-visible h-14 flex items-center px-8 bg-white/70 dark:bg-[#0A0A0A]/70 backdrop-blur-xl border border-white/20 dark:border-white/10">
            <nav className="hidden lg:flex items-center gap-8">
              <Link 
                href="/vaults" 
                className={`text-sm font-medium transition-all relative ${
                  pathname === "/" || pathname.startsWith("/vaults")
                    ? "text-foreground drop-shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Vaults
              </Link>
              <Link 
                href="/positions" 
                className={`text-sm font-medium transition-all relative ${
                  pathname === "/positions" 
                    ? "text-foreground drop-shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Positions
              </Link>
              <Link 
                href="/risk" 
                className={`text-sm font-medium transition-all relative ${
                  pathname === "/risk" 
                    ? "text-foreground drop-shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Risk
              </Link>
              <div className="relative group flex items-center justify-center h-full cursor-not-allowed">
                <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  Borrow
                </span>
                
                {/* Sleek top tooltip */}
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out z-50">
                  <div className="bg-foreground text-background text-[11px] uppercase tracking-wider font-bold px-3 py-2 rounded-lg shadow-xl flex items-center gap-1.5 whitespace-nowrap relative">
                    Coming Soon
                    <span className="inline-block transition-transform duration-[1.5s] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-180 origin-center">
                      <Hourglass className="w-3 h-3" />
                    </span>
                    {/* Tooltip arrow */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                  </div>
                </div>
              </div>
              <Link 
                href="/governance" 
                className={`text-sm font-medium transition-all relative ${
                  pathname === "/governance" 
                    ? "text-foreground drop-shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Governance
              </Link>
            </nav>
          </div>
        </div>
        
        {/* Right Side Actions */}
        <div className="pointer-events-auto flex items-center gap-4 shrink-0 justify-end">
          {isConnected ? (
            <Popover>
              <PopoverTrigger className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 bg-white/70 dark:bg-[#0A0A0A]/70 rounded-full border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-[#0A0A0A]/90 transition-colors">
                <Avatar className="w-6 h-6 border border-black/10 dark:border-white/10">
                  <AvatarFallback className="bg-foreground">
                    <div className="w-full h-full opacity-70 flex flex-wrap gap-[1px] p-1">
                      <div className="w-[45%] h-[45%] bg-background rounded-sm" />
                      <div className="w-[45%] h-[45%] bg-background rounded-sm" />
                      <div className="w-[45%] h-[45%] bg-background rounded-sm" />
                      <div className="w-[45%] h-[45%] bg-background rounded-sm" />
                    </div>
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">{truncateAddress(address)}</span>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[250px] p-4 rounded-[1.25rem] shadow-xl border-black/5 dark:border-white/[0.03] space-y-4 bg-card/95 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-5 h-5 border border-black/10 dark:border-white/10">
                      <AvatarFallback className="bg-foreground">
                        <div className="w-full h-full opacity-70 flex flex-wrap gap-[1px] p-0.5">
                          <div className="w-[45%] h-[45%] bg-background rounded-[1px]" />
                          <div className="w-[45%] h-[45%] bg-background rounded-[1px]" />
                          <div className="w-[45%] h-[45%] bg-background rounded-[1px]" />
                          <div className="w-[45%] h-[45%] bg-background rounded-[1px]" />
                        </div>
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[14px] font-medium text-foreground">{truncateAddress(address)}</span>
                    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Copy className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                  <div className="flex items-center">
                    <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 -mr-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                      <Power className="w-[15px] h-[15px]" />
                    </button>
                  </div>
                </div>
                
                <div className="h-px w-full bg-black/5 dark:bg-white/[0.05]" />
                
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-foreground">Theme</span>
                  <div className="flex items-center p-0.5 bg-black/5 dark:bg-white/[0.05] rounded-[10px]">
                    <button 
                      onClick={() => setTheme("dark")}
                      className={`p-1.5 rounded-[8px] transition-all ${theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Moon className="w-[14px] h-[14px]" />
                    </button>
                    <button 
                      onClick={() => setTheme("light")}
                      className={`p-1.5 rounded-[8px] transition-all ${theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Sun className="w-[14px] h-[14px]" />
                    </button>
                    <button 
                      onClick={() => setTheme("system")}
                      className={`p-1.5 rounded-[8px] transition-all ${theme === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Monitor className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex items-center gap-4">
              <Button 
                onClick={login}
                className="h-8 px-4 rounded-[10px] text-[13px] font-medium shadow-lg shadow-black/10 dark:shadow-white/5 backdrop-blur-md"
              >
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
