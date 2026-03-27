import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { joinWaitlist, updateWaitlistProfile, getWaitlistEntry } from "@/lib/supabase";

function useWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const connectWallet = () => {
    const isMobileWallet =
      /MetaMask\//i.test(navigator.userAgent) ||
      /TrustWallet|Trust|CoinbaseWallet|Coinbase|Phantom/i.test(navigator.userAgent) ||
      Boolean((window as any).ethereum?.isMetaMask);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768;

    if (isMobile && isMobileWallet) {
      const inj = connectors.find((c) => c.id === "injected");
      if (inj) { connect({ connector: inj }); return; }
    }
    if (isMobile && !isMobileWallet) {
      const wc = connectors.find((c) => c.id === "walletConnect");
      if (wc) { connect({ connector: wc }); return; }
    }
    if ((window as any).ethereum) {
      const inj = connectors.find((c) => c.id === "injected");
      if (inj) { connect({ connector: inj }); return; }
    }
    const wc = connectors.find((c) => c.id === "walletConnect");
    if (wc) { connect({ connector: wc }); return; }
    if (connectors[0]) connect({ connector: connectors[0] });
  };

  return { address, isConnected, isConnecting: isPending, connectWallet, disconnect };
}

const TASKS = [
  { id: "follow_x",      label: "Follow @Pop_up_x on X",          xp: 50, url: "https://x.com/Pop_up_x", cta: "Follow on X" },
  { id: "retweet",       label: "Like and Retweet our pinned post", xp: 75, url: "https://x.com/Pop_up_x", cta: "Like and Retweet" },
  { id: "connect_x",     label: "Connect your X handle",           xp: 30, url: null, cta: null },
  { id: "connect_email", label: "Add your email",                  xp: 40, url: null, cta: null },
];

const TIERS = [
  { name: "Fan",       min: 0,   color: "#6b7280" },
  { name: "Supporter", min: 100, color: "#FF3C00" },
  { name: "OG",        min: 200, color: "#f59e0b" },
];

function getTier(xp: number) {
  return [...TIERS].reverse().find((t) => xp >= t.min) || TIERS[0];
}

function XPBar({ xp }: { xp: number }) {
  const tier = getTier(xp);
  const tierIndex = TIERS.findIndex((t) => t.name === tier.name);
  const nextTier = TIERS[tierIndex + 1];
  const progress = nextTier ? ((xp - tier.min) / (nextTier.min - tier.min)) * 100 : 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: tier.color }}>
          {tier.name}
        </span>
        <span className="font-mono text-xs text-[#6b7280]">{xp} XP</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: tier.color }}
        />
      </div>
      {nextTier && (
        <p className="text-[0.6rem] font-mono text-[#6b7280] mt-1 text-right">
          {nextTier.min - xp} XP to {nextTier.name}
        </p>
      )}
    </div>
  );
}

export default function WaitlistPage() {
  const { address, isConnected, isConnecting, connectWallet } = useWallet();
  const [step, setStep] = useState<"join" | "tasks">("join");
  const [joinStatus, setJoinStatus] = useState<"idle" | "loading">("idle");
  const [xp, setXp] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [xHandle, setXHandle] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFields, setSavedFields] = useState<string[]>([]);

  useEffect(() => {
    if (!address) return;
    getWaitlistEntry(address).then((entry) => {
      if (entry) {
        setXp(entry.xp || 0);
        setCompletedTasks(entry.tasks_completed || []);
        setXHandle(entry.x_handle || "");
        setEmail(entry.email || "");
        setStep("tasks");
      }
    });
  }, [address]);

  const handleJoin = async () => {
    if (!isConnected || !address) { connectWallet(); return; }
    setJoinStatus("loading");
    const { error } = await joinWaitlist(address);
    if (error === "duplicate") { setStep("tasks"); setJoinStatus("idle"); return; }
    if (error === "unknown") { setJoinStatus("idle"); return; }
    setJoinStatus("idle");
    setStep("tasks");
  };

  const completeTask = async (taskId: string, xpGain: number) => {
    if (completedTasks.includes(taskId) || !address) return;
    const newTasks = [...completedTasks, taskId];
    const newXp = xp + xpGain;
    setCompletedTasks(newTasks);
    setXp(newXp);
    await updateWaitlistProfile(address, {
      tasks_completed: newTasks,
      xp: newXp,
      tier: getTier(newXp).name,
    });
  };

  const saveField = async (field: "x_handle" | "email", value: string, taskId: string, xpGain: number) => {
    if (!address || !value.trim()) return;
    setSaving(true);
    const newTasks = completedTasks.includes(taskId) ? completedTasks : [...completedTasks, taskId];
    const newXp = completedTasks.includes(taskId) ? xp : xp + xpGain;
    setCompletedTasks(newTasks);
    setXp(newXp);
    await updateWaitlistProfile(address, {
      [field]: value.trim(),
      tasks_completed: newTasks,
      xp: newXp,
      tier: getTier(newXp).name,
    });
    setSavedFields((prev) => [...prev, field]);
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex flex-col">
      <nav className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-6 h-14">
        <span className="font-bold text-2xl text-[#FF3C00] tracking-wider">POPUP</span>
        {isConnected && (
          <span className="font-mono text-[0.6rem] tracking-[2px] uppercase text-[#6b7280] bg-white/5 px-3 py-1.5 rounded-full">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        )}
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">

          {step === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full text-center"
            >
              <h1 className="text-[clamp(3rem,9vw,7rem)] leading-[0.88] tracking-wide mb-6 font-bold">
                DROP IT.<br />
                <span className="text-[#FF3C00]">OWN IT.</span><br />
                GET PAID.
              </h1>

              <p className="font-mono text-[0.65rem] tracking-[3px] uppercase text-[#6b7280] mb-10">
                Early access for artists and collectors
              </p>

              <div className="flex flex-col gap-3">
                <div className="border border-white/10 px-5 py-4 font-mono text-xs tracking-[2px] uppercase text-left">
                  {isConnected
                    ? <span className="text-[#f5f5f5]">{address?.slice(0, 10)}...{address?.slice(-6)}</span>
                    : <span className="text-[#6b7280]">Connect wallet to join</span>
                  }
                </div>
                <button
                  onClick={handleJoin}
                  disabled={joinStatus === "loading" || isConnecting}
                  className="bg-[#FF3C00] text-white font-mono text-xs tracking-[2px] uppercase px-8 py-4 hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!isConnected
                    ? (isConnecting ? "CONNECTING..." : "CONNECT WALLET")
                    : (joinStatus === "loading" ? "JOINING..." : "JOIN WAITLIST")
                  }
                </button>
              </div>

              <div className="mt-12 flex flex-wrap justify-center gap-2">
                {["NFT Drops", "POAP Campaigns", "Fan Subscriptions", "IP Investment", "Physical Merch"].map((label) => (
                  <span key={label} className="font-mono text-[0.55rem] tracking-[2px] uppercase text-[#6b7280] border border-white/5 px-3 py-1.5 rounded-full">
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {step === "tasks" && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <div className="text-center mb-8">
                <div className="text-3xl font-bold text-[#FF3C00] mb-1">YOU ARE IN.</div>
                <p className="font-mono text-[0.6rem] tracking-[2px] uppercase text-[#6b7280]">
                  Complete tasks to earn XP and unlock perks at launch
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                <XPBar xp={xp} />
              </div>

              <div className="space-y-3">
                {TASKS.map((task) => {
                  const done = completedTasks.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${done ? "border-[#FF3C00]/30 bg-[#FF3C00]/5" : "border-white/10"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-5 w-5 rounded-full border flex items-center justify-center flex-shrink-0 ${done ? "bg-[#FF3C00] border-[#FF3C00]" : "border-white/20"}`}>
                            {done && <span className="text-white text-[10px]">✓</span>}
                          </div>
                          <span className="text-sm font-medium">{task.label}</span>
                        </div>
                        <span className="font-mono text-xs text-[#FF3C00] ml-2 flex-shrink-0">+{task.xp} XP</span>
                      </div>

                      {task.id === "connect_x" && !done && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="@yourhandle"
                            value={xHandle}
                            onChange={(e) => setXHandle(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-xs font-mono text-[#f5f5f5] placeholder-[#6b7280] outline-none focus:border-[#FF3C00]/50"
                          />
                          <button
                            onClick={() => saveField("x_handle", xHandle, task.id, task.xp)}
                            disabled={saving || !xHandle.trim()}
                            className="bg-[#FF3C00] text-white font-mono text-xs px-4 py-2 disabled:opacity-50"
                          >
                            {saving ? "..." : "SAVE"}
                          </button>
                        </div>
                      )}

                      {task.id === "connect_email" && !done && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="email"
                            placeholder="your@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-xs font-mono text-[#f5f5f5] placeholder-[#6b7280] outline-none focus:border-[#FF3C00]/50"
                          />
                          <button
                            onClick={() => saveField("email", email, task.id, task.xp)}
                            disabled={saving || !email.trim()}
                            className="bg-[#FF3C00] text-white font-mono text-xs px-4 py-2 disabled:opacity-50"
                          >
                            {saving ? "..." : "SAVE"}
                          </button>
                        </div>
                      )}

                      {task.url && !done && (
                        <button
                          onClick={() => {
                            window.open(task.url!, "_blank");
                            setTimeout(() => completeTask(task.id, task.xp), 2000);
                          }}
                          className="mt-2 w-full border border-white/10 text-[#f5f5f5] font-mono text-xs tracking-[1px] uppercase px-4 py-2 hover:border-[#FF3C00]/50 hover:text-[#FF3C00] transition-colors"
                        >
                          {task.cta}
                        </button>
                      )}

                      {done && task.id === "connect_x" && xHandle && (
                        <p className="text-xs font-mono text-[#6b7280] mt-1 ml-7">@{xHandle.replace("@", "")}</p>
                      )}
                      {done && task.id === "connect_email" && email && (
                        <p className="text-xs font-mono text-[#6b7280] mt-1 ml-7">{email}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-center font-mono text-[0.55rem] tracking-[2px] uppercase text-[#6b7280] mt-8">
                More tasks coming soon · Higher XP = better perks at launch
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="border-t border-white/5 px-6 py-6 flex justify-between items-center">
        <span className="font-bold text-lg text-[#FF3C00]">POPUP</span>
        <span className="font-mono text-[0.5rem] tracking-[2px] uppercase text-[#6b7280]">
          2026 POPUP PLATFORM
        </span>
      </footer>
    </div>
  );
}
