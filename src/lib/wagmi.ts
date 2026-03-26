import { http, createConfig } from "wagmi";
import { baseSepolia, base } from "wagmi/chains";
import { injected, coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";

const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const baseSepoliaRpc = import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected(),
    metaMask({ appName: "POPUP Waitlist" }),
    coinbaseWallet({ appName: "POPUP Waitlist" }),
    ...(wcProjectId && wcProjectId !== "your_walletconnect_project_id_here"
      ? [walletConnect({ projectId: wcProjectId, showQrModal: true })]
      : []),
  ],
  transports: {
    [baseSepolia.id]: http(baseSepoliaRpc),
    [base.id]: http("https://mainnet.base.org"),
  },
});
