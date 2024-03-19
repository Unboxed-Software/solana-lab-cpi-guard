import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaLabCpiGuard } from "../target/types/solana_lab_cpi_guard";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { mintTo, createAccount, createMint, getAssociatedTokenAddress, createAssociatedTokenAccount, getAccount, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { createTokenAccountWithExtensions } from "./utils/token-helper";
import { safeAirdrop, delay } from "./utils/utils";
import { assert } from "chai"

describe("solana-lab-cpi-guard", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolanaLabCpiGuard as Program<SolanaLabCpiGuard>;
  const provider = anchor.AnchorProvider.env();

  // test accounts
  const payer = anchor.web3.Keypair.generate()
  let testTokenMint: PublicKey = null
  let userTokenAccount = anchor.web3.Keypair.generate()
  let maliciousAccount = anchor.web3.Keypair.generate()

  it("[CPI Guard] Close Account Example", async () => {
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
      const tx = await program.methods.maliciousCloseAccount()
      .accounts({
        authority: payer.publicKey,
        tokenAccount: userTokenAccount.publicKey,
        destination: maliciousAccount.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();

    console.log("Your transaction signature", tx);
    } catch (e) {
      assert(e.message == "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x2c")
      console.log("CPI Guard is enabled, and a program attempted to close an account without returning lamports to owner");
    }
  });

  it("[CPI Guard] Approve Delete Example", async () => {
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

  it("[CPI Guard] Set Authority Example", async () => {
    try {
      const tx = await program.methods.prohibtedSetAuthority()
      .accounts({
        authority: payer.publicKey,
        tokenAccount: userTokenAccount.publicKey,
        newAuthority: maliciousAccount.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();

    console.log("Your transaction signature", tx);
    } catch (e) {
      assert(e.message == "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x2e")
      console.log("CPI Guard is enabled, and a program attempted to add or change an authority");
    }
  })
});
