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
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { runCors } from "../../../cors";

const LENS_API_URL = "https://api.lens.dev";
const STAGING_LENS_API_URL =
  "https://staging-api-social-mumbai.lens.crtlkey.com/";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  const {
    signal_type,
    nullifier_hash,
    proof_payload,
    action_id,
    signal,
    is_production,
  } = req.body as ExpectedRequestPayload;

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

    // Check timestamp is at most 10 minutes old
    if (Math.abs(Date.now() - timestamp) > 10 * 60 * 1000) {
      return errorValidation(
        "invalid_timestamp",
        "This nullifier is stale. Proofs must be submitted within 10 minutes.",
        "proof_payload",
        res
      );
    }

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
  const apolloClient = new ApolloClient({
    uri: is_production ? LENS_API_URL : STAGING_LENS_API_URL,
    cache: new InMemoryCache(),
  });

  const mutation = gql`
    mutation IdKitPhoneVerifyWebhook(
      $request: IdKitPhoneVerifyWebhookRequest!
    ) {
      idKitPhoneVerifyWebhook(request: $request)
    }
  `;

  const lensSignalType = signal_type === SignalType.Phone ? "PHONE" : "ORB";
  let response;
  try {
    response = await apolloClient.mutate({
      mutation,
      variables: {
        request: {
          sharedSecret: process.env.LENS_API_SECRET,
          worldcoin: {
            nullifierHash: nullifier_hash,
            signal,
            signalType: lensSignalType,
          },
        },
      },
      errorPolicy: "ignore",
    });
  } catch (e) {
    console.error(
      "Error sending webhook to Lens API: ",
      e,
      JSON.stringify((e as Record<string, any>)?.networkError?.result)
    );
  }

  if (response?.data.idKitPhoneVerifyWebhook !== null) {
    if (response) {
      console.error("Webhook to Lens API is not as expected: ", response.data);
    }

    return errorValidation(
      "error_recording_proof",
      "We could not record the proof. Please try again or contact the Lens Team.",
      null,
      res
    );
  }

  res.status(204).end();
}
