import { HttpAgent, Actor, type Identity } from "@icp-sdk/core/agent";
import { idlFactory } from "@/declarations/backend.did";

const CANISTER_ID = "jvpna-tiaaa-aaaaf-qgydq-cai";

export async function createExportActor(identity: Identity) {
  const agent = await HttpAgent.create({ identity, host: "https://icp0.io" });
  return Actor.createActor(idlFactory, { agent, canisterId: CANISTER_ID });
}
