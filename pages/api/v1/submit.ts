// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import {
  errorRequiredAttribute,
  errorValidation,
  errorNotAllowed,
} from "../../../errors";
import {
  ExpectedRequestPayload,
  OrbSignalProof,
  PhoneSignalProof,
  SignalType,
} from "../../../types";
import { ethers } from "ethers";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!process.env.LENS_API_WEBHOOK) {
    throw new Error("Improperly configured. LENS_API_WEBHOOK is not set.");
  }

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const { signal_type, nullifier_hash, proof_payload, action_id, signal } =
    req.body as ExpectedRequestPayload;

  for (const attr of [
    "signal_type",
    "nullifier_hash",
    "proof_payload",
    "action_id",
    "signal",
  ]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res);
    }
  }

  // ANCHOR: Verify phone signal
  if (signal_type === SignalType.Phone) {
    const { timestamp, signature } = proof_payload as PhoneSignalProof;

    if (!timestamp || !signature) {
      return errorValidation(
        "invalid_proof_payload",
        "The payload of the `proof` is invalid for the `phone` signal.",
        "proof_payload",
        res
      );
    }

    const hash = ethers.utils.keccak256(
      Buffer.from(`${timestamp}.${nullifier_hash}`)
    );

    const recoveredAddress = ethers.utils.verifyMessage(hash, signature);

    if (recoveredAddress !== process.env.PHONE_SIGNAL_PUBLIC_KEY) {
      return errorValidation(
        "invalid_proof",
        "The provided proof is invalid.",
        null,
        res
      );
    }
  }
  // ANCHOR: Verify orb signal
  else if (signal_type === SignalType.Orb) {
    const _orbProof = proof_payload as OrbSignalProof;
    const verificationResponse = await fetch(
      "https://developer.worldcoin.org/api/v1/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nullifier_hash,
          merkle_root: _orbProof.merkle_root,
          proof: _orbProof.proof,
          signal,
          action_id,
        }),
      }
    );

    const responseBody = await verificationResponse.json();

    if (!verificationResponse.ok || !responseBody.success) {
      console.warn(
        "Unable to verify orb signal",
        verificationResponse.status,
        responseBody
      );
      return errorValidation(
        "invalid_proof",
        "The provided proof is invalid.",
        null,
        res
      );
    }
  } else {
    return errorValidation(
      "invalid_signal_type",
      "Signal type is invalid.",
      "signal_type",
      res
    );
  }

  // ANCHOR: Send webhook to Lens API
  await fetch(process.env.LENS_API_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LENS_API_SECRET}`,
    },
    body: JSON.stringify({
      nullifier_hash,
      signal_type,
      signal_metadata: signal,
    }),
  });

  res.status(204).end();
}
