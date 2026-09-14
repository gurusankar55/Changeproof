"use client";

import { useEffect, useState } from "react";
import { connectWallet, discoverWallets } from "./lib/wallet";
import { createWalletClient, genlayerClient } from "./lib/genlayer";
const statuses = [
  {
    label: "No Change",
    value: "NO_CHANGE",
    description: "Source content is unchanged.",
  },
  {
    label: "Minor Change",
    value: "MINOR_CHANGE",
    description: "Small non-critical changes detected.",
  },
  {
    label: "Material Change",
    value: "MATERIAL_CHANGE",
    description: "A meaningful change was detected.",
  },
  {
    label: "Unavailable",
    value: "SOURCE_UNAVAILABLE",
    description: "The source could not be verified.",
  },
];

const wallets = [
  {
    name: "MetaMask",
    short: "MM",
    description: "Connect with MetaMask",
  },
  {
    name: "Rabby",
    short: "RB",
    description: "Connect with Rabby Wallet",
  },
  {
    name: "Coinbase Wallet",
    short: "CB",
    description: "Connect with Coinbase Wallet",
  },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
const [discoveredWallets, setDiscoveredWallets] = useState<
  Awaited<ReturnType<typeof discoverWallets>>
>([]);
const [walletError, setWalletError] = useState("");
const [selectedWallet, setSelectedWallet] = useState("");
const [walletAddress, setWalletAddress] = useState("");
const [walletProvider, setWalletProvider] = useState<
  Awaited<ReturnType<typeof discoverWallets>>[number]["provider"] | null
>(null);
const [registering, setRegistering] = useState(false);
const [registerMessage, setRegisterMessage] = useState("");
const [capturing, setCapturing] = useState(false);
const [captureMessage, setCaptureMessage] = useState("");
const loadOnChainStatus = async () => {
  try {
    const status = await genlayerClient.readContract({
  address: "0x881Ee14F5e9BD74e666225b48eA87D934c40d89C",
  functionName: "get_status",
  args: [],
});

console.log("ChangeProof on-chain status:", status);
  } catch (error) {
    console.error("Failed to read ChangeProof status:", error);
  }
};

useEffect(() => {
  loadOnChainStatus();
}, []);
const registerSource = async () => {
  if (!walletAddress || !walletProvider) {
    setRegisterMessage("Connect a wallet first.");
    return;
  }

  if (!sourceName.trim() || !url.trim()) {
    setRegisterMessage("Enter a source name and URL.");
    return;
  }

  try {
    setRegistering(true);
    setRegisterMessage("Submitting transaction...");

    const client = await createWalletClient(walletAddress, walletProvider);

    const hash = await client.writeContract({
  address: "0x881Ee14F5e9BD74e666225b48eA87D934c40d89C",
  functionName: "register_source",
  args: [sourceName.trim(), url.trim()],
  value: BigInt(0),
});

setRegisterMessage("Transaction submitted. Waiting for confirmation...");

const receipt = await client.waitForTransactionReceipt({
  hash,
  interval: 2000,
  retries: 180,
});

setRegisterMessage(
  `Registration confirmed: ${receipt.status ?? "confirmed"}`
);
  } catch (error) {
    console.error("ChangeProof registration error:", error);

    setRegisterMessage(
      error instanceof Error
        ? error.message
        : `Registration failed: ${String(error)}`
    );
  } finally {
    setRegistering(false);
  }
};
const captureSnapshot = async () => {
  if (!walletAddress || !walletProvider) {
    setCaptureMessage("Connect a wallet first.");
    return;
  }

  try {
    setCapturing(true);
    setCaptureMessage("Capturing live snapshot...");

    const client = await createWalletClient(walletAddress, walletProvider);

    const hash = await client.writeContract({
      address: "0x881Ee14F5e9BD74e666225b48eA87D934c40d89C",
      functionName: "capture_snapshot",
      args: [],
      value: BigInt(0),
    });

    setCaptureMessage("Snapshot submitted. Waiting for confirmation...");

    const receipt = await client.waitForTransactionReceipt({
  hash,
  interval: 2000,
  retries: 180,
});

console.log("ChangeProof snapshot transaction:", receipt);
console.log("Snapshot status:", receipt.statusName);
console.log("Snapshot execution:", receipt.txExecutionResultName);

if (receipt.txExecutionResultName !== "FINISHED_WITH_RETURN") {
  throw new Error(
    `Snapshot execution failed: ${receipt.txExecutionResultName ?? "UNKNOWN"}`
  );
}

    setCaptureMessage(
      `Snapshot confirmed: ${receipt.status ?? "confirmed"}`
    );
    await loadOnChainStatus();

  } catch (error) {
    console.error("ChangeProof snapshot error:", error);

    setCaptureMessage(
      error instanceof Error
        ? error.message
        : `Snapshot failed: ${String(error)}`
    );
  } finally {
    setCapturing(false);
  }
};

const openWalletSelector = async () => {
  setWalletError("");
  setWalletOpen(true);

  try {
    const wallets = await discoverWallets();
    setDiscoveredWallets(wallets);

    if (wallets.length === 0) {
      setWalletError("No browser wallets detected.");
    }
  } catch {
    setWalletError("Unable to detect wallets.");
  }
};

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-black text-zinc-950">
              CP
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">ChangeProof</h1>
              <p className="text-xs text-zinc-500">
                On-chain proof of meaningful changes
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => {
                if (selectedWallet) {
                  setWalletMenuOpen((open) => !open);
                } else {
                  openWalletSelector();
                }
              }}
              className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-900 sm:w-auto"
            >
              {selectedWallet || "Connect Wallet"}
            </button>

            {selectedWallet && walletMenuOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-full min-w-64 rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl sm:w-72">
                <div className="px-3 py-3">
                  <p className="text-sm font-semibold text-white">
                    {selectedWallet}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Wallet connected
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(walletAddress);
                  }}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-zinc-900"
                >
                  Copy Address
                </button>

                <button
                  onClick={() => {
                    setSelectedWallet("");
                    setWalletMenuOpen(false);
                    setWalletError("");
                  }}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-zinc-900"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="py-12 text-center sm:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
              Evidence → Verification → On-chain record
            </div>

            <h2 className="text-4xl font-black tracking-tight sm:text-6xl">
              Know when public information
              <span className="block text-zinc-400">actually changes.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Register a public source, capture its evidence, compare future
              versions, and record meaningful changes with GenLayer consensus.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl sm:p-7">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Register a source</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Start a verifiable change history for a public webpage or
              document.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">
                Source name
              </span>

              <input
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Example API Docs"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-zinc-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">
                Source URL
              </span>

              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/docs"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-600 focus:border-zinc-400"
              />
            </label>
          </div>

          <button
  onClick={captureSnapshot}
  disabled={capturing || !walletAddress}
  className="mt-3 w-full rounded-xl border border-zinc-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:mt-0 sm:w-auto"
>
  {capturing ? "Capturing..." : "Capture Snapshot"}
</button>

{captureMessage && (
  <p className="mt-3 text-sm text-zinc-400">
    {captureMessage}
  </p>
)}

{registerMessage && (
  <p className="mt-3 text-sm text-zinc-400">
    {registerMessage}
  </p>
)}

</section>

        <section className="py-10">
          <div className="mb-5">
            <h3 className="text-lg font-bold">Change status</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Every verification produces a structured result.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {statuses.map((status) => (
              <div
                key={status.value}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <div className="mb-3 h-2 w-2 rounded-full bg-white" />

                <h4 className="font-semibold">{status.label}</h4>

                <p className="mt-2 text-sm leading-5 text-zinc-500">
                  {status.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 pb-10 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Current source
            </p>

            <p className="mt-3 truncate text-sm text-zinc-300">
              {sourceName || "No source registered"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Last verification
            </p>

            <p className="mt-3 text-sm text-zinc-500">Not checked yet</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              On-chain status
            </p>

            <p className="mt-3 text-sm text-zinc-500">
              {selectedWallet ? "Wallet selected" : "Awaiting connection"}
            </p>
          </div>
        </section>

        <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-600">
          ChangeProof · Evidence-backed change verification
        </footer>
      </div>

      {walletOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setWalletOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:rounded-3xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  ChangeProof
                </p>

                <h3 className="mt-2 text-2xl font-bold">
                  Connect your wallet
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Choose a wallet to continue.
                </p>
              </div>

              <button
                onClick={() => setWalletOpen(false)}
                className="rounded-lg px-3 py-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {discoveredWallets.map((wallet) => (
                <button
                  key={wallet.info.uuid}
                  onClick={async () => {
  try {
    setWalletError("");const { address: account, provider } = await connectWallet(wallet);

setSelectedWallet(
  `${wallet.info.name} · ${account.slice(0, 6)}...${account.slice(-4)}`
);
setWalletAddress(account);
setWalletProvider(provider);
setWalletOpen(false);
  } catch (error) {
    setWalletError(
      error instanceof Error ? error.message : "Wallet connection failed."
    );
  }
}}
                  className="flex w-full items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left transition hover:border-zinc-600 hover:bg-zinc-900"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-zinc-950">
                    {wallet.info.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <p className="font-semibold">{wallet.info.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Connect with {wallet.info.name}
                    </p>
                  </div>

                  <span className="ml-auto text-zinc-600">→</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setWalletOpen(false)}
              className="mt-5 w-full rounded-xl border border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              Cancel
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-zinc-600">
              Your wallet will only be asked to approve the connection.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}