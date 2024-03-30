import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaLabCpiGuard } from "../target/types/solana_lab_cpi_guard";
import { PublicKey } from '@solana/web3.js'
import { mintTo, createMint, approve, disableCpiGuard, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { createTokenAccount, createTokenAccountWithExtensions } from "./utils/token-helper";
import { safeAirdrop, delay } from "./utils/utils";
import { assert } from "chai"

describe("burn-delegate-test", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.SolanaLabCpiGuard as Program<SolanaLabCpiGuard>;
    const provider = anchor.AnchorProvider.env();

    // test accounts
    const payer = anchor.web3.Keypair.generate()
    let testTokenMint: PublicKey = null
    let userTokenAccount = anchor.web3.Keypair.generate()
    let delegate = anchor.web3.Keypair.generate()

    it("[CPI Guard] Burn without Delegate Signature Example", async () => {
        await safeAirdrop(payer.publicKey, provider.connection)
        await safeAirdrop(provider.wallet.publicKey, provider.connection)
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

        await mintTo(
            provider.connection,
            payer,
            testTokenMint,
            userTokenAccount.publicKey,
            payer,
            1000,
            undefined,
            undefined,
            TOKEN_2022_PROGRAM_ID
        )

        await approve(
            provider.connection,
            payer,
            userTokenAccount.publicKey,
            delegate.publicKey,
            payer,
            500,
            undefined,
            undefined,
            TOKEN_2022_PROGRAM_ID
        )

        try {
            await program.methods.unauthorizedBurn(new anchor.BN(500))
                .accounts({
                    // payer is not the delegate
                    authority: payer.publicKey,
                    tokenAccount: userTokenAccount.publicKey,
                    tokenMint: testTokenMint,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                })
                .signers([payer])
                .rpc();
        } catch (e) {
            assert(e.message == "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x2b")
            console.log("CPI Guard is enabled, and a program attempted to burn user funds without using a delegate.");
        }
    })

    it("Burn without Delegate Signature Example", async () => {
        await disableCpiGuard(
            provider.connection,
            payer,
            userTokenAccount.publicKey,
            payer,
            [],
            undefined,
            TOKEN_2022_PROGRAM_ID
        )

        await program.methods.unauthorizedBurn(new anchor.BN(500))
            .accounts({
                // payer is not the delegate
                authority: payer.publicKey,
                tokenAccount: userTokenAccount.publicKey,
                tokenMint: testTokenMint,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([payer])
            .rpc();
    })
})