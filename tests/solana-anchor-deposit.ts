import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaAnchorDeposit } from "../target/types/solana_anchor_deposit";
import { expect } from "chai";

describe("solana-anchor-deposit", () => {
  const provider = anchor.AnchorProvider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaAnchorDeposit as Program<SolanaAnchorDeposit>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it('should deposit SOL into the programme balance account', async () => {
    const depositor = anchor.web3.Keypair.generate();
    console.log('Depositor:', depositor.publicKey.toBase58());

    const balanceAccount = anchor.web3.Keypair.generate()
    console.log('Balance account:', balanceAccount.publicKey.toBase58());

    const connection = provider.connection;

    await connection.confirmTransaction(
      await connection.requestAirdrop(depositor.publicKey, 1000000000), 'confirmed',
    );

    console.log('Depositor balance:', await connection.getBalance(depositor.publicKey));


    const tx = await program.methods.deposit(new anchor.BN(10000)).accounts({
      balanceAccount: balanceAccount.publicKey,
      depositor: depositor.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
      .signers([depositor, balanceAccount])
      .rpc();

    console.log('Transaction:', tx);

    await connection.confirmTransaction(tx, 'confirmed');

    const balanceAccountData = await program.account.balanceAccount.fetch(balanceAccount.publicKey);
    console.log(`Balance after deposit: ${balanceAccountData.balance.toString()}`);

    expect(balanceAccountData.balance.toNumber()).to.equal(10000);
  });
});
