import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

export const genlayerClient = createClient({
  chain: testnetBradbury,
});

export async function createWalletClient(
  account: string,
  provider: {
    request: (args: {
      method: string;
      params?: unknown[];
    }) => Promise<unknown>;
  }
) {
  const client = createClient({
    chain: testnetBradbury,
    account: account as `0x${string}`,
    provider,
  });

  return client;
}

  