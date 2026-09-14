"use client";

export type WalletProvider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
};

export type DiscoveredWallet = {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: WalletProvider;
};

export function discoverWallets(): Promise<DiscoveredWallet[]> {
  return new Promise((resolve) => {
    const wallets = new Map<string, DiscoveredWallet>();

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        info: DiscoveredWallet["info"];
        provider: WalletProvider;
      }>;

      if (!customEvent.detail?.info || !customEvent.detail?.provider) {
        return;
      }

      const wallet = customEvent.detail;

      wallets.set(wallet.info.uuid, {
        info: wallet.info,
        provider: wallet.provider,
      });
    };

    window.addEventListener(
      "eip6963:announceProvider",
      handler
    );

    window.dispatchEvent(
      new Event("eip6963:requestProvider")
    );

    setTimeout(() => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handler
      );

      resolve(Array.from(wallets.values()));
    }, 500);
  });
}

export async function connectWallet(
  wallet: DiscoveredWallet
): Promise<{
  address: string;
  provider: WalletProvider;
}> {
  const accounts = (await wallet.provider.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts?.[0]) {
    throw new Error("No wallet account was returned.");
  }

  return {
    address: accounts[0],
    provider: wallet.provider,
  };
}