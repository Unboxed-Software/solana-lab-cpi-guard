import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaLabCpiGuard } from "../target/types/solana_lab_cpi_guard";
import { PublicKey } from '@solana/web3.js'
import { mintTo, createAccount, createMint, getAssociatedTokenAddress, createAssociatedTokenAccount, getAccount, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { createTokenAccount, createTokenAccountWithExtensions } from "./utils/token-helper";
import { safeAirdrop, delay } from "./utils/utils";
import { assert } from "chai"

describe("approve-delegate-test", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.SolanaLabCpiGuard as Program<SolanaLabCpiGuard>;
    const provider = anchor.AnchorProvider.env();

    // test accounts
    const payer = anchor.web3.Keypair.generate()
    let testTokenMint: PublicKey = null
    let userTokenAccount = anchor.web3.Keypair.generate()
    let maliciousAccount = anchor.web3.Keypair.generate()

    it("[CPI Guard] Approve Delegate Example", async () => {
        await safeAirdrop(payer.publicKey, provider.connection)
        await safeAirdrop(provider.wallet.publicKey, provider.connection)
        delay(10000)

        testTokenMint = await createMint(
            provider.connection,
            payer,
            provider.wallet.publicKey,
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
            const tx = await program.methods.prohibitedApproveAccount(new anchor.BN(1000))
            .accounts({
            authority: payer.publicKey,
            tokenAccount: userTokenAccount.publicKey,
            delegate: maliciousAccount.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .signers([payer])
            .rpc();

        console.log("Your transaction signature", tx);
        } catch (e) {
            assert(e.message == "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x2d")
            console.log("CPI Guard is enabled, and a program attempted to approve a delegate");
        }
    })

    it("Approve Delegate Example", async () => {
        let nonCpiGuardTokenAccount = anchor.web3.Keypair.generate()
        await createTokenAccount(
            provider.connection,
            testTokenMint,
            payer,
            payer,
            nonCpiGuardTokenAccount
        )
        
        const tx = await program.methods.prohibitedApproveAccount(new anchor.BN(1000))
        .accounts({
        authority: payer.publicKey,
        tokenAccount: nonCpiGuardTokenAccount.publicKey,
        delegate: maliciousAccount.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();
    })
})