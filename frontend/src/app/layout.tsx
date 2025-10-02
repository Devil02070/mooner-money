import "./globals.css";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { WalletProvider } from "@/providers/WalletProvider";
import { TermsModel } from "@/components/modals/TermsModel";
import { ReactQueryClientProvider } from "@/providers/QueryProvider";
import { AppProvider } from "@/providers/AppProvider";
import { Toaster } from "sonner"
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import TestnetModal from "@/components/modals/TestnetModal";
import NextTopLoader from 'nextjs-toploader';

// const urbanist = Urbanist({
//   variable: "--font-urbanist",
//   subsets: ["latin"],
//   weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
// });

import { Urbanist } from "@/components/fonts";

export const metadata: Metadata = {
  title: "Home - Mooner Money",
  description: "Unlimited fun with mooner on aptos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${Urbanist.className} antialiased`}>
        <NuqsAdapter>
          <NextTopLoader color="#fae94f" showSpinner={false} height={1} />
          <WalletProvider>
            <AppProvider>
              <ReactQueryClientProvider>
                <Header />
                {children}
                <TermsModel />
                <TestnetModal />
              </ReactQueryClientProvider>
            </AppProvider>
          </WalletProvider>


        </NuqsAdapter>
        <Toaster
          toastOptions={{
            style: {
              background: "#121212",
              color: "#ffffff",
              border: "1px solid #ffffff10",
              fontSize: "12px",
              borderRadius: "16px"
            },
            classNames: {
              toast: Urbanist.className,
            }
          }}
        />
      </body>
    </html>
  );
}