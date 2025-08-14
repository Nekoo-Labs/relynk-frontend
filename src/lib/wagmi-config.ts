import { liskSepolia, scrollSepolia, morphHolesky } from "viem/chains";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { defineChain } from "viem";

// Define Celo Sepolia Testnet
export const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "CELO",
    symbol: "CELO",
  },
  rpcUrls: {
    default: {
      http: ["https://forno.celo-sepolia.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Celo Explorer",
      url: "https://explorer.celo.org/alfajores",
    },
  },
  testnet: true,
});

export function getConfig() {
  return createConfig({
    chains: [liskSepolia, scrollSepolia, morphHolesky, celoSepolia],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [liskSepolia.id]: http(),
      [scrollSepolia.id]: http(),
      [morphHolesky.id]: http(),
      [celoSepolia.id]: http("https://forno.celo-sepolia.celo-testnet.org"),
    },
  });
}
