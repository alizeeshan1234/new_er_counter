import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SimpleCounterEr } from "../target/types/simple_counter_er";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  GetCommitmentSignature,
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID
} from "@magicblock-labs/ephemeral-rollups-sdk";
import { sendMagicTransaction } from "magic-router-sdk";
import { web3 } from "@coral-xyz/anchor";

describe("simple_counter_er", () => {
  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.simpleCounterEr as Program<SimpleCounterEr>;

  let counterAccount: PublicKey;

  const routerConnection = new web3.Connection(
    process.env.ROUTER_ENDPOINT || "https://devnet-router.magicblock.app",
    {
      wsEndpoint: process.env.ROUTER_WS_ENDPOINT || "wss://devnet-router.magicblock.app",
    }
  );

  before(async () => {
    [counterAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter")],
      program.programId
    )
  })

  it("initialized counter", async () => {
    const tx = await program.methods.initialize().accountsPartial({
      signer: provider.wallet.publicKey,
      counter: counterAccount,
      systemProgram: SystemProgram.programId,
    }).signers([provider.wallet.payer]).rpc();

    console.log(`Transction Singnature: ${tx}`);
  });

  it("increment counter on chain", async () => {
    const tx = await program.methods.incrementCounter().accountsPartial({
      signer: provider.wallet.publicKey,
      counter: counterAccount
    }).signers([provider.wallet.payer]).rpc();

    console.log(`Transction Signature: ${tx}`);
  });

  it("Delegate counter", async () => {
    const tx = await program.methods.delegateCounter().accountsPartial({
      signer: provider.wallet.publicKey,
      counter: counterAccount
    }).transaction();

    const signature = await sendMagicTransaction(
      routerConnection, 
      tx, 
      [provider.wallet.payer],
    );

    console.log("Delegate signature:", signature);

    await new Promise((resolve) => setTimeout(resolve, 10000));
  });

  it.skip("Commit and increment counter", async () => {
    const tx = await program.methods.commitCounter().accountsPartial({
      signer: provider.wallet.publicKey,
      counter: counterAccount
    }).transaction();

    const signature = await sendMagicTransaction(
      routerConnection,
      tx,
      [provider.wallet.payer],
    );

    console.log(`Commit signature: ${signature}`);

    await sleepWithAnimation(25);

    const increment_counter_on_chain = await program.methods.incrementCounter().accountsPartial({
      signer: provider.wallet.publicKey,
      counter: counterAccount
    }).signers([provider.wallet.payer]).rpc();

    console.log(`commit and increment counter signature: ${increment_counter_on_chain}`)
  })

  it("COmmit, Undelegate and increment counter", async () => {
    const tx = await program.methods.commitAndUndelegateCounter().accountsPartial({
      signer: provider.wallet.publicKey,
      counter: counterAccount
    }).transaction();

    const signature = await sendMagicTransaction(
      routerConnection,
      tx,
      [provider.wallet.payer],
    );

    console.log(`Commit and undelegate signature: ${signature}`);

    await sleepWithAnimation(25);

    const increment_counter_on_chain = await program.methods.incrementCounter().accountsPartial({
      signer: provider.wallet.publicKey,
      counter: counterAccount
    }).signers([provider.wallet.payer]).rpc();

    console.log(`Increment counter signature: ${increment_counter_on_chain}`)
  });

  it.skip("Fail increment and commit counter", async () => {
    const increment_counter_on_chain = await program.methods.incrementCounter().accountsPartial({
      signer: provider.wallet.publicKey,
      counter: counterAccount
    }).signers([provider.wallet.payer]).rpc();

    console.log(`Increment counter signature: ${increment_counter_on_chain}`);

    await sleepWithAnimation(25);

    const tx = await program.methods.commitCounter().accountsPartial({
      signer: provider.wallet.publicKey,
      counter: counterAccount
    }).transaction();

    const signature = await sendMagicTransaction(
      routerConnection,
      tx,
      [provider.wallet.payer],
    );

    console.log(`Commit signature: ${signature}`);
  })
});

async function sleepWithAnimation(seconds: number): Promise<void> {
  const totalMs = seconds * 1000;
  const interval = 500; // Update every 500ms
  const iterations = Math.floor(totalMs / interval);

  for (let i = 0; i < iterations; i++) {
    const dots = '.'.repeat((i % 3) + 1);
    process.stdout.write(`\rWaiting${dots}   `);
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  // Clear the line
  process.stdout.write('\r\x1b[K');
}