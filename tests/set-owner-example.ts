import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaLabCpiGuard } from "../target/types/solana_lab_cpi_guard";
import { PublicKey } from '@solana/web3.js'
import { setAuthority, AuthorityType, createMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { createTokenAccount, createTokenAccountWithExtensions } from "./utils/token-helper";
import { safeAirdrop, delay } from "./utils/utils";
import { assert } from "chai"

describe("set-owner-test", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.SolanaLabCpiGuard as Program<SolanaLabCpiGuard>;
    const provider = anchor.AnchorProvider.env();

    // test accounts
    const payer = anchor.web3.Keypair.generate()
    let testTokenMint: PublicKey = null
    let userTokenAccount = anchor.web3.Keypair.generate()
    let newOwner = anchor.web3.Keypair.generate()

    it("[CPI Guard] Set Authority without CPI on CPI Guarded Account", async () => {
        await safeAirdrop(payer.publicKey, provider.connection)
        delay(10000)

        testTokenMint = await createMint(
            provider.connection,
            payer,
            payer.publicKey,
            undefined,
            6,
            undefined,
            undefined,
            TOKEN_2022_PROGRAM_ID
        )
        await createTokenAccountWithExtensions(
            provider.connection,
            testTokenMint,
            payer,
            payer,
            userTokenAccount
        )

        try {
            await setAuthority(
                provider.connection,
                payer,
                userTokenAccount.publicKey,
                payer,
                AuthorityType.AccountOwner,
                newOwner.publicKey,
                undefined,
                undefined,
                TOKEN_2022_PROGRAM_ID
            )
        } catch(e) {
            assert(e.message == "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x2f")
            console.log("Account ownership cannot be changed while CPI Guard is enabled.")
        }
    })

    it("Set Authority without CPI on Non-CPI Guarded Account", async () => {
        let nonCpiGuardTokenAccount = anchor.web3.Keypair.generate()
        await createTokenAccount(
            provider.connection,
            testTokenMint,
            payer,
            payer,
            nonCpiGuardTokenAccount
        )

        await setAuthority(
            provider.connection,
            payer,
            nonCpiGuardTokenAccount.publicKey,
            payer,
            AuthorityType.AccountOwner,
            newOwner.publicKey,
            undefined,
            undefined,
            TOKEN_2022_PROGRAM_ID
        )
    })

    it("[CPI Guard] Set Authority via CPI on CPI Guarded Account", async () => {
        try {
            await program.methods.setOwner()
            .accounts({
                authority: payer.publicKey,
                tokenAccount: userTokenAccount.publicKey,
                newOwner: newOwner.publicKey,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([payer])
            .rpc();

        } catch (e) {
            assert(e.message == "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x2e")
            console.log("CPI Guard is enabled, and a program attempted to add or change an authority.")
        }
    })

    it("Set Authority via CPI on Non-CPI Guarded Account", async () => {
        let nonCpiGuardTokenAccount = anchor.web3.Keypair.generate()
        await createTokenAccount(
            provider.connection,
            testTokenMint,
            payer,
            payer,
            nonCpiGuardTokenAccount
        )

        await program.methods.setOwner()
            .accounts({
                authority: payer.publicKey,
                tokenAccount: nonCpiGuardTokenAccount.publicKey,
                newOwner: newOwner.publicKey,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([payer])
            .rpc();
    })
})