import { liskSepolia, scrollSepolia } from "viem/chains";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";

export function getConfig() {
  return createConfig({
    chains: [liskSepolia, scrollSepolia],
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
    transports: {
      [liskSepolia.id]: http(),
      [scrollSepolia.id]: http(),
    },
  });
}
