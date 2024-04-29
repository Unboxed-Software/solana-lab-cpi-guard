import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaLabCpiGuard } from "../target/types/solana_lab_cpi_guard";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  setAuthority,
  AuthorityType,
  createMint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
// import { createTokenAccountWithCPIGuard } from "./token-helper"; // We'll import this later
import { assert } from "chai";
import { airdropIfRequired, makeKeypairs } from "@solana-developers/helpers";

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

  it("[CPI Guard] Set Authority without CPI on CPI Guarded Account", async () => {});

  it("Set Authority without CPI on Non-CPI Guarded Account", async () => {});

  it("[CPI Guard] Set Authority via CPI on CPI Guarded Account", async () => {});

  it("Set Authority via CPI on Non-CPI Guarded Account", async () => {});
});
