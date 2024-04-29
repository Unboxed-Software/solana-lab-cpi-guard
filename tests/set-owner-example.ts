import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaLabCpiGuard } from "../target/types/solana_lab_cpi_guard";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  setAuthority,
  AuthorityType,
  createMint,
  TOKEN_2022_PROGRAM_ID,
  createAccount,
} from "@solana/spl-token";
// import { createTokenAccountWithCPIGuard } from "./token-helper"; // We'll import this later
import { assert } from "chai";
import { airdropIfRequired, makeKeypairs } from "@solana-developers/helpers";
import { createTokenAccountWithCPIGuard } from "./token-helper";

describe("set-owner-test", () => {
  const program = anchor.workspace
    .SolanaLabCpiGuard as Program<SolanaLabCpiGuard>;
  const provider = anchor.AnchorProvider.env();
  const payer = (provider.wallet as anchor.Wallet).payer;
  const connection = provider.connection;

  anchor.setProvider(provider);

  // test accounts
  const [
    testTokenMint,
    userTokenAccount,
    firstNonCPIGuardAccount,
    secondNonCPIGuardAccount,
    newOwner,
  ] = makeKeypairs(5);

  before(async () => {
    await airdropIfRequired(
      connection,
      payer.publicKey,
      LAMPORTS_PER_SOL * 2,
      LAMPORTS_PER_SOL
    );
  });

  it("[CPI Guard] Set Authority without CPI on CPI Guarded Account", async () => {
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
      );
    } catch (e) {
      assert(
        e.message ==
          "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x2f"
      );
      console.log(
        "Account ownership cannot be changed while CPI guard is enabled."
      );
    }
  });

  it("Set Authority without CPI on Non-CPI Guarded Account", async () => {
    await createAccount(
      provider.connection,
      payer,
      testTokenMint.publicKey,
      payer.publicKey,
      firstNonCPIGuardAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    await setAuthority(
      provider.connection,
      payer,
      firstNonCPIGuardAccount.publicKey,
      payer,
      AuthorityType.AccountOwner,
      newOwner.publicKey,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
  });
  it("[CPI guard] Set Authority via CPI on CPI Guarded Account", async () => {
    try {
      await program.methods
        .setOwner()
        .accounts({
          authority: payer.publicKey,
          tokenAccount: userTokenAccount.publicKey,
          newOwner: newOwner.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();
    } catch (e) {
      assert(
        e.message ==
          "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x2e"
      );
      console.log(
        "CPI guard is enabled, and a program attempted to add or change an authority."
      );
    }
  });

  it("Set Authority via CPI on Non-CPI Guarded Account", async () => {
    await createAccount(
      provider.connection,
      payer,
      testTokenMint.publicKey,
      payer.publicKey,
      secondNonCPIGuardAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    await program.methods
      .setOwner()
      .accounts({
        authority: payer.publicKey,
        tokenAccount: secondNonCPIGuardAccount.publicKey,
        newOwner: newOwner.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();
  });
});
