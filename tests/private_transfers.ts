import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PrivateTransfers } from "../target/types/private_transfers";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import { execSync } from "child_process";

describe("private transfers", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .PrivateTransfers as Program<PrivateTransfers>;

  const VERIFIER_PROGRAM_ID = new PublicKey(
    "3kAgXZtVfNdeWb6p9WLbAWCXQsERLC3nvxQKsxun9hUw",
  );

  it("Generates a proof and executes the withdrawal", async () => {
    console.log("Generating zero-knowledge proof...");
    execSync("cd circuits/withdrawal && nargo execute witness", {
      stdio: "inherit",
    });

    execSync(
      "cd circuits/withdrawal && ~/sunspot/go/sunspot prove target/withdrawal.json target/witness.gz target/withdrawal.ccs target/withdrawal.pk",
      { stdio: "inherit" },
    );

    console.log("⏳ Waiting for OS filesystem sync...");
    execSync("sleep 2");

    let proofBuffer = fs.readFileSync(
      "circuits/withdrawal/target/withdrawal.proof",
    );
    console.log("📦 RAW File Size on Disk:", proofBuffer.length, "bytes");

    if (proofBuffer.length === 0) {
      console.log(
        "⚠️ OS hasn't flushed the file yet. Waiting 3 more seconds...",
      );
      execSync("sleep 3");
      proofBuffer = fs.readFileSync(
        "circuits/withdrawal/target/withdrawal.proof",
      );
      console.log("📦 2nd Attempt File Size:", proofBuffer.length, "bytes");
    }

    const textContent = proofBuffer.toString("utf-8").trim();
    const isHex = /^(0x)?[0-9a-fA-F]+$/.test(textContent);

    if (isHex && textContent.length > 100) {
      console.log("🔍 Detected Hex String format. Converting to binary...");
      let hex = textContent.startsWith("0x")
        ? textContent.slice(2)
        : textContent;
      proofBuffer = Buffer.from(hex, "hex");
    }

    console.log("✅ Final Parsed Proof Buffer Length:", proofBuffer.length);
    if (proofBuffer.length !== 324) {
      throw new Error(
        `CRITICAL: Proof buffer is ${proofBuffer.length} bytes, but expected exactly 324!`,
      );
    }

    const rootArray = Array.from(
      Buffer.from(
        "270be589a81b3a580d8e2d36658d5937639e1e2baed4ce401e89fff52e29e99b",
        "hex",
      ),
    );
    const nullifierHashArray = Array.from(
      Buffer.from(
        "2098f5fb9e239eab3ceac3f27b81e481dc3124d55ffed523a839ee8446b64864",
        "hex",
      ),
    );
    let amount = new anchor.BN(64);

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId,
    );

    const [nullifierPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(nullifierHashArray)],
      program.programId,
    );

    const tx = await program.methods
      .withdraw(proofBuffer, rootArray, nullifierHashArray, amount)
      .accounts({
        user: provider.wallet.publicKey,
        verifierProgram: VERIFIER_PROGRAM_ID,
      })
      .rpc();
    console.log("Transaction Signature:", tx);
  });
});
