"use client"
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren } from "react";
import { NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import { NETWORK } from "@/lib/env"

let dappImageURI: string | undefined;
if (typeof window !== "undefined") {
    dappImageURI = `${window.location.origin}${window.location.pathname}favicon.ico`;
}

export const WalletProvider = ({ children }: PropsWithChildren) => {
    return (
        <AptosWalletAdapterProvider
            autoConnect={true}
            dappConfig={{
                network: NetworkToNetworkName[NETWORK],
                aptosConnect: {
                    dappImageURI,
                    dappId: "57fa42a9-29c6-4f1e-939c-4eefa36d9ff5",
                    dappName: "Mooner Money",
                },
                aptosApiKeys: {
                    testnet: "AG-4CQJMEOBKYXQGU8J1WPWQVSFVSCCMCVJW",
                    mainnet: "AG-FFXROLQTFEIJVPYG7EWQPMD8EUMBQ14XO"
                }
            }}
            disableTelemetry={true}
            onError={(error) => {
                // toast.error(error || "Unknown wallet error");
                console.log(error || "Unknown wallet error")
            }}
        >
            {children}
        </AptosWalletAdapterProvider>
    );
};