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

    const VERIFIER_PROGRAM_ID = new PublicKey("3kAgXZtVfNdeWb6p9WLbAWCXQsERLC3nvxQKsxun9hUw"); 

    it("Generates a proof and executes the withdrawal", async () => {

        console.log("Generating zero-knowledge proof...");
        execSync("cd circuits/withdrawal && nargo execute witness", { stdio: 'inherit' });

        execSync(
              "cd circuits/withdrawal && ~/sunspot/go/sunspot prove target/withdrawal.json target/witness.gz target/withdrawal.ccs target/withdrawal.pk", 
            { stdio: 'inherit' }
        );

        let proofHex = fs.readFileSync('circuits/withdrawal/target/withdrawal.proof', "utf-8").trim();

        if(proofHex.startsWith("0x")) {
            proofHex = proofHex.slice(2);
        }

        const proofBuffer = Buffer.from(proofHex, "hex");

        const rootArray = Array.from(Buffer.from("270be589a81b3a580d8e2d36658d5937639e1e2baed4ce401e89fff52e29e99b", "hex"));
        const nullifierHashArray = Array.from(Buffer.from("2098f5fb9e239eab3ceac3f27b81e481dc3124d55ffed523a839ee8446b64864", "hex"));

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
            // nullifierAccount: nullifierPda,
            // vault: vaultPda,
            verifierProgram: VERIFIER_PROGRAM_ID,
            // systemProgram: SystemProgram.programId,
        })
        .rpc();
            
        console.log("Transaction Signature:", tx);
    });
});
