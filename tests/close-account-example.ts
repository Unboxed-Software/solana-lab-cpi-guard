import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaLabCpiGuard } from "../target/types/solana_lab_cpi_guard";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  disableCpiGuard,
  createMint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
// import { createTokenAccountWithCPIGuard } from "./token-helper"; // We'll import this later
import { assert } from "chai";
import { airdropIfRequired, makeKeypairs } from "@solana-developers/helpers";
import { createTokenAccountWithCPIGuard } from "./token-helper";

describe("close-account-test", () => {
  const program = anchor.workspace
    .SolanaLabCpiGuard as Program<SolanaLabCpiGuard>;
  const provider = anchor.AnchorProvider.env();
  const payer = (provider.wallet as anchor.Wallet).payer;
  const connection = provider.connection;

  anchor.setProvider(provider);

  // test accounts
  const [testTokenMint, userTokenAccount, maliciousAccount] = makeKeypairs(3);

  before(async () => {
    await airdropIfRequired(
      connection,
      payer.publicKey,
      LAMPORTS_PER_SOL * 2,
      LAMPORTS_PER_SOL
    );
  });

  it("[CPI Guard] Close Account Example", async () => {
    await createMint(
      provider.connection,
      payer,
      provider.wallet.publicKey,
      undefined,
      6,
      testTokenMint,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    await createTokenAccountWithCPIGuard(
      provider.connection,
      payer,
      payer,
      userTokenAccount,
      testTokenMint.publicKey
    );

    try {
      const tx = await program.methods
        .maliciousCloseAccount()
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
      assert(
        e.message ==
          "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x2c"
      );
      console.log(
        "CPI guard is enabled, and a program attempted to close an account without returning lamports to owner"
      );
    }
  });

  it("Close Account without CPI guard", async () => {
    await disableCpiGuard(
      provider.connection,
      payer,
      userTokenAccount.publicKey,
      payer,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    await program.methods
      .maliciousCloseAccount()
      .accounts({
        authority: payer.publicKey,
        tokenAccount: userTokenAccount.publicKey,
        destination: maliciousAccount.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();
  });
});
