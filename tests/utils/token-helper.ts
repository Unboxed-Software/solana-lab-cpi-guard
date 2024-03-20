import { ExtensionType, TOKEN_2022_PROGRAM_ID, createEnableCpiGuardInstruction, createEnableRequiredMemoTransfersInstruction, createInitializeAccountInstruction, createInitializeImmutableOwnerInstruction, getAccountLen } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

export async function createTokenAccountWithExtensions(
    connection: Connection, 
    mint: PublicKey, 
    payer: Keypair, 
	owner: Keypair,
    tokenAccountKeypair: Keypair
): Promise<string> {

const tokenAccount = tokenAccountKeypair.publicKey;

const extensions = [
    ExtensionType.CpiGuard,
];

const tokenAccountLen = getAccountLen(extensions);
const lamports = await connection.getMinimumBalanceForRentExemption(tokenAccountLen);

const createTokenAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: tokenAccount,
    space: tokenAccountLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
});

const initializeCpiGuard =
    createEnableCpiGuardInstruction(tokenAccount, owner.publicKey, [], TOKEN_2022_PROGRAM_ID)

const initializeAccountInstruction = createInitializeAccountInstruction(
    tokenAccount,
    mint,
    owner.publicKey,
    TOKEN_2022_PROGRAM_ID,
);

const transaction = new Transaction().add(
    createTokenAccountInstruction,
    initializeAccountInstruction,  
    initializeCpiGuard,
);

transaction.feePayer = payer.publicKey;

// Send transaction
return await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, owner, tokenAccountKeypair],
);
}

export async function createTokenAccount(
    connection: Connection, 
    mint: PublicKey, 
    payer: Keypair, 
	owner: Keypair,
    tokenAccountKeypair: Keypair
): Promise<string> {

const tokenAccount = tokenAccountKeypair.publicKey;

// create account w/o extensions
const extensions = [];

const tokenAccountLen = getAccountLen(extensions);
const lamports = await connection.getMinimumBalanceForRentExemption(tokenAccountLen);

const createTokenAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: tokenAccount,
    space: tokenAccountLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
});


const initializeAccountInstruction = createInitializeAccountInstruction(
    tokenAccount,
    mint,
    owner.publicKey,
    TOKEN_2022_PROGRAM_ID,
);

const transaction = new Transaction().add(
    createTokenAccountInstruction,
    initializeAccountInstruction,  
);

transaction.feePayer = payer.publicKey;

// Send transaction
return await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, owner, tokenAccountKeypair],
);
}