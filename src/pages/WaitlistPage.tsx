import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected, walletConnect, coinbaseWallet, metaMask } from "wagmi/connectors";
import { motion, AnimatePresence } from "framer-motion";
import { joinWaitlist, getWaitlistCount } from "@/lib/supabase";

// ─── Tiny wallet connect hook (self-contained, no external dep) ────────────────
function useWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const connectWallet = () => {
    const isMobileWallet =
      /MetaMask\//i.test(navigator.userAgent) ||
      /TrustWallet|Trust|CoinbaseWallet|Coinbase|Phantom/i.test(navigator.userAgent) ||
      Boolean((window as any).ethereum?.isMetaMask);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && !isMobileWallet) {
      const wc = connectors.find((c) => c.id === "walletConnect");
      if (wc) { connect({ connector: wc }); return; }
    }

    const inj = connectors.find((c) => c.id === "injected");
    if (inj) { connect({ connector: inj }); return; }

    const mm = connectors.find((c) => c.id === "metaMask");
    if (mm) { connect({ connector: mm }); return; }

    connect({ connector: connectors[0] });
  };

  return { address, isConnected, isConnecting: isPending, connectWallet, disconnect };
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplay(value); clearInterval(timer); return; }
      setDisplay(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WaitlistPage() {
  const { address, isConnected, isConnecting, connectWallet } = useWallet();

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "duplicate" | "error">("idle");
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [showCount, setShowCount] = useState(false);

  // Load live count on mount
  useEffect(() => {
    getWaitlistCount().then((n) => {
      setWaitlistCount(n);
      setShowCount(n > 0);
    });
  }, []);

  const handleJoin = async () => {
    if (!isConnected || !address) {
      connectWallet();
      return;
    }

    setStatus("loading");
    const { error } = await joinWaitlist(address);

    if (error === "duplicate") {
      setStatus("duplicate");
      return;
    }
    if (error === "unknown") {
      setStatus("error");
      return;
    }

    setStatus("success");
    setWaitlistCount((prev) => prev + 1);
  };

  const buttonLabel = () => {
    if (!isConnected) return isConnecting ? "CONNECTING…" : "CONNECT WALLET";
    if (status === "loading") return "SUBMITTING…";
    return "JOIN WAITLIST";
  };

  const buttonDisabled = status === "loading" || isConnecting || status === "success";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex flex-col">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-6 md:px-12 h-14">
        <span className="font-display text-3xl text-[#FF3C00] tracking-wider">POPUP</span>

        {isConnected && (
          <span className="font-mono-brand text-[0.6rem] tracking-[2px] uppercase text-[#6b7280] bg-white/5 px-3 py-1.5 rounded-full">
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </span>
        )}
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-20 text-center py-20">

        {/* Live counter badge */}
        <AnimatePresence>
          {showCount && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full"
            >
              <span className="h-2 w-2 rounded-full bg-[#FF3C00] animate-pulse" />
              <span className="font-mono-brand text-[0.65rem] tracking-[2px] uppercase text-[#6b7280]">
                <Counter value={waitlistCount} /> wallets already in
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display text-[clamp(3.5rem,9vw,9rem)] leading-[0.88] tracking-wide mb-8"
        >
          DROP IT.<br />
          <span className="text-[#FF3C00]">OWN IT.</span><br />
          GET PAID.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-mono-brand text-[0.7rem] tracking-[3px] uppercase text-[#6b7280] mb-12 max-w-md"
        >
          The onchain platform for artists to drop, earn, and build their community.
          Be first.
        </motion.p>

        {/* CTA block */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full max-w-md"
        >
          <AnimatePresence mode="wait">

            {/* ── Success state ── */}
            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-[#FF3C00]/40 bg-[#FF3C00]/5 px-8 py-8 rounded-sm text-center"
              >
                <div className="font-display text-5xl text-[#FF3C00] mb-3">YOU'RE IN.</div>
                <p className="font-mono-brand text-[0.65rem] tracking-[2px] uppercase text-[#6b7280]">
                  We'll notify you when POPUP opens its doors.<br />Welcome to the movement.
                </p>
                <div className="mt-4 font-mono-brand text-[0.6rem] tracking-[1px] text-[#f5f5f5]/30">
                  {address?.slice(0, 10)}…{address?.slice(-6)}
                </div>
              </motion.div>
            )}

            {/* ── Duplicate state ── */}
            {status === "duplicate" && (
              <motion.div
                key="duplicate"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-white/10 px-8 py-8 rounded-sm text-center"
              >
                <div className="font-display text-4xl mb-3">ALREADY IN.</div>
                <p className="font-mono-brand text-[0.65rem] tracking-[2px] uppercase text-[#6b7280]">
                  This wallet is already on the list.<br />We've got you — stay tuned.
                </p>
              </motion.div>
            )}

            {/* ── Default / error state ── */}
            {status !== "success" && status !== "duplicate" && (
              <motion.div key="form" className="flex flex-col sm:flex-row gap-3">

                {/* Wallet display */}
                <div className="flex-1 border border-white/10 px-5 py-4 font-mono-brand text-xs tracking-[2px] uppercase text-left">
                  {isConnected
                    ? <span className="text-[#f5f5f5]">{address?.slice(0, 8)}…{address?.slice(-6)}</span>
                    : <span className="text-[#6b7280]">Connect wallet to join</span>
                  }
                </div>

                {/* CTA button */}
                <button
                  onClick={handleJoin}
                  disabled={buttonDisabled}
                  className="bg-[#FF3C00] text-white font-mono-brand text-xs tracking-[2px] uppercase px-8 py-4 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,60,0,0.4)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 whitespace-nowrap"
                >
                  {buttonLabel()}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          {status === "error" && (
            <p className="mt-3 font-mono-brand text-[0.6rem] tracking-[1px] text-red-400">
              Something went wrong. Please try again.
            </p>
          )}
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 flex flex-wrap justify-center gap-3"
        >
          {[
            "NFT Drops",
            "POAP Campaigns",
            "Fan Subscriptions",
            "IP Investment",
            "Physical Merch",
            "Onchain Royalties",
          ].map((label) => (
            <span
              key={label}
              className="font-mono-brand text-[0.6rem] tracking-[2px] uppercase text-[#6b7280] border border-white/5 px-4 py-2 rounded-full"
            >
              {label}
            </span>
          ))}
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-6 md:px-20 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="font-display text-xl text-[#FF3C00] tracking-wider">POPUP</span>
        <span className="font-mono-brand text-[0.55rem] tracking-[2px] uppercase text-[#6b7280]">
          © 2026 POPUP PLATFORM · ALL RIGHTS RESERVED
        </span>
      </footer>
    </div>
  );
}
