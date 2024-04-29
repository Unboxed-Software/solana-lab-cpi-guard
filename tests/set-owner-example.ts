import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaLabCpiGuard } from "../target/types/solana_lab_cpi_guard";
import { PublicKey } from '@solana/web3.js'
import { setAuthority, AuthorityType, createMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
// import { createTokenAccountWithCPIGuard } from "./token-helper"; // We'll import this later
import { assert } from "chai"

describe("set-owner-test", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.SolanaLabCpiGuard as Program<SolanaLabCpiGuard>;
    const provider = anchor.AnchorProvider.env();

    it("[CPI Guard] Set Authority without CPI on CPI Guarded Account", async () => {})

    it("Set Authority without CPI on Non-CPI Guarded Account", async () => {})

    it("[CPI Guard] Set Authority via CPI on CPI Guarded Account", async () => {})

    it("Set Authority via CPI on Non-CPI Guarded Account", async () => {})
})