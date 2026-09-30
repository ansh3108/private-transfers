import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PrivateTransfers } from "../target/types/private_transfers";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import { execSync } from "child_process";

describe("private transfers", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.PrivateTransfers as Program<PrivateTransfers>;

    const VERIFIER_PROGRAM_ID = new PublicKey(""); //TODO

    it("Generates a proof and executes the withdrawal", async () => {

        console.log("Generating zero-knowledge proof...");
        execSync("cd circuits/withdrawal && ~/sunspot/go/sunspot prove target/withdrawal.json", { stdio: 'inherit' });

        const proofBuffer = fs.readFileSync('./circuits/withdrawal/target/withdrawal.proof');

        const rootArray = Array.from({length: 32}, () => 0);
        const nullifierHashArray = Array.from({length: 32}, () => 0);

        let amount = new anchor.BN(64);

        const [vaultPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault")],
            program.programId
        );

        const [nullifierPda] = PublicKey.findProgramAddressSync(
            [Buffer.from(nullifierHashArray)],
            program.programId
        );


        const tx = await program.methods
        .withdraw(proofBuffer, rootArray, nullifierHashArray, amount)
        .accounts({
            user: provider.wallet.publicKey,
            nullifierAccount: nullifierPda,
            vault: vaultPda,
            verifierProgram: VERIFIER_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        })
        .rpc();
            
        console.log("Transaction Signature:", tx);
    });
});
