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

    it("Generates a proof and executes the withdrawl", async () => {

        console.log("Generating zero-knowledge proof...");
        execSync("cd circuits/withdrawl && ~/sunspot/go/sunspot prove target/withdrawl.json", { studio: 'inherit' });



        console.log("Transaction Signature:", tx);
    });
});
