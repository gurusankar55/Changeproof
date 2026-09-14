import { genlayerClient } from "./genlayer";
import { CHANGE_PROOF_CONTRACT } from "../config";

export async function getSource() {
  return genlayerClient.readContract({
    address: CHANGE_PROOF_CONTRACT as `0x${string}`,
    functionName: "get_source",
    args: [],
  });
}
