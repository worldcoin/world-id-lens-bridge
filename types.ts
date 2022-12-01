export interface OrbSignalProof {
  merkle_root: string;
  proof: string; // ZKP
}

export interface PhoneSignalProof {
  timestamp: number;
  signature: string; // secp256k1 signature
}

export enum SignalType {
  Orb = "orb",
  Phone = "phone",
}

export interface ExpectedRequestPayload {
  signal_type: SignalType;
  nullifier_hash: string;
  proof_payload: PhoneSignalProof | OrbSignalProof;
  action_id: string;
  signal: string;
}
