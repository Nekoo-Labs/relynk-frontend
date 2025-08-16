"use client";

import {
  Config,
  cookieStorage,
  createStorage,
  State,
  WagmiProvider,
} from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { XellarKitProvider, defaultConfig, darkTheme } from "@xellar/kit";
import { liskSepolia, scrollSepolia, morphHolesky, mantleSepoliaTestnet } from "viem/chains";
import { celoSepolia } from "@/lib/wagmi-config";
import { SessionProvider } from "next-auth/react";
import { queryClient } from "@/services/api";
import { NetworkAlert } from "@/components/ui/network-alert";

const config = defaultConfig({
  appName: "Xellar",
  // Required for WalletConnect
  walletConnectProjectId: "c0fa3bb10e007826b7f104092be2cf57",

  // Required for Xellar Passport
  xellarAppId: "429fe521-3fe4-4649-b90a-f09df8d41350",
  xellarEnv: "sandbox",
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  chains: [liskSepolia, scrollSepolia, morphHolesky, celoSepolia, mantleSepoliaTestnet],
}) as Config;

export function Web3Provider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  return (
    <SessionProvider>
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          <XellarKitProvider theme={darkTheme}>{children}</XellarKitProvider>
          <NetworkAlert />
          {/* Only show devtools in development */}
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="bottom-right"
            />
          )}
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
