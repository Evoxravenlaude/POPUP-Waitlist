import { baseSepolia, base } from "wagmi/chains";
import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

const networks = [baseSepolia, base] as any;

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: "POPUP Waitlist",
    description: "Drop it. Own it. Get paid.",
    url: "https://early.pop-up.fun",
    icons: ["https://early.pop-up.fun/favicon.ico"],
  },
  features: {
    analytics: false,
  },
  themeMode: "dark",
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
