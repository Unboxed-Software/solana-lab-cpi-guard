import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaLabCpiGuard } from "../target/types/solana_lab_cpi_guard";
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { disableCpiGuard, createMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
// import { createTokenAccountWithCPIGuard } from "./token-helper"; // We'll import this later
import { assert } from "chai"
import { airdropIfRequired, makeKeypairs } from "@solana-developers/helpers";

describe("close-account-test", () => {

    const program = anchor.workspace.SolanaLabCpiGuard as Program<SolanaLabCpiGuard>;
    const provider = anchor.AnchorProvider.env();
    const payer = (provider.wallet as anchor.Wallet).payer;
    const connection = provider.connection;

    anchor.setProvider(provider);

    // test accounts
    const [testTokenMint, userTokenAccount, maliciousAccount] = makeKeypairs(3);

    before(async () => {
        await airdropIfRequired(connection, payer.publicKey, LAMPORTS_PER_SOL * 2, LAMPORTS_PER_SOL);
    })

    it("[CPI Guard] Close Account Example", async () => {})

    it("Close Account without CPI Guard", async () => {})
})