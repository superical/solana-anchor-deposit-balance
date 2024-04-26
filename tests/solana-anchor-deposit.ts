import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { SolanaAnchorDeposit } from "../target/types/solana_anchor_deposit";
import { expect } from "chai";
import { BlockhashWithExpiryBlockHeight } from "@solana/web3.js";

describe("solana-anchor-deposit", () => {
  const provider = anchor.AnchorProvider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaAnchorDeposit as Program<SolanaAnchorDeposit>;

  let depositor: anchor.web3.Keypair;
  let depositorBalancePda: anchor.web3.PublicKey;

  let latestBlockHash: BlockhashWithExpiryBlockHeight;

  beforeEach(async () => {
    depositor = anchor.web3.Keypair.generate();

    const connection = provider.connection;

    // ### Request airdrop for the depositor
    latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: await connection.requestAirdrop(depositor.publicKey, 1000000000),
    }, 'confirmed');

    // ### Retrieve the balance PDA
    const [balancePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [depositor.publicKey.toBuffer()],
      program.programId,
    );
    depositorBalancePda = balancePda;

    // ### Get the latest block hash
    latestBlockHash = await provider.connection.getLatestBlockhash();

  });

  it('should initialise and deposit the account balance', async () => {
    const tx = await program.methods.initialize(new anchor.BN(10000)).accounts({
      balanceAccount: depositorBalancePda,
      depositor: depositor.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
      .signers([depositor])
      .rpc();

    const balanceAccountData = await program.account.balanceAccount.fetch(depositorBalancePda);
    console.log(`Balance after deposit: ${balanceAccountData.balance.toString()}`);

    expect(balanceAccountData.balance.toNumber()).to.equal(10000);
  });

  describe('When updating account balance', () => {
    beforeEach(async () => {
      const tx = await program.methods.initialize(new anchor.BN(100)).accounts({
        balanceAccount: depositorBalancePda,
        depositor: depositor.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
        .signers([depositor])
        .rpc();

      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: tx,
      }, 'confirmed');
    });

    it('should fail when amount is zero', async () => {
      try {
        await program.methods.deposit(new anchor.BN(0)).accounts({
          balanceAccount: depositorBalancePda,
          depositor: depositor.publicKey,
        })
          .signers([depositor])
          .rpc();
      } catch (err: unknown) {
        expect((err as AnchorError).message).to.contain('Invalid deposit amount');
      }
    });

    it('should fail when the amount to deposit is not in steps of 100', async () => {
      try {
        await program.methods.deposit(new anchor.BN(220)).accounts({
          balanceAccount: depositorBalancePda,
          depositor: depositor.publicKey,
        })
          .signers([depositor])
          .rpc();
      } catch (err: unknown) {
        expect((err as AnchorError).message).to.contain('Invalid deposit amount');
      }
    });

    it('should fail when the amount to deposit is not in steps lesser than 100', async () => {
      try {
        await program.methods.deposit(new anchor.BN(20)).accounts({
          balanceAccount: depositorBalancePda,
          depositor: depositor.publicKey,
        })
          .signers([depositor])
          .rpc();
      } catch (err: unknown) {
        expect((err as AnchorError).message).to.contain('Invalid deposit amount');
      }
    });

    it('should update the balance when deposit in steps of 100', async () => {
      const amount = 800;
      const depositorBalanceBefore = (await program.account.balanceAccount.fetch(depositorBalancePda)).balance;

      await program.methods.deposit(new anchor.BN(amount)).accounts({
        balanceAccount: depositorBalancePda,
        depositor: depositor.publicKey,
      })
        .signers([depositor])
        .rpc();

      const depositorBalanceAfter = (await program.account.balanceAccount.fetch(depositorBalancePda)).balance;

      expect(depositorBalanceAfter.toNumber()).to.equal(depositorBalanceBefore.toNumber() + amount);
    });

    it('should update the balance when deposit is equals to max balance', async () => {
      const amount = 900;
      const depositorBalanceBefore = (await program.account.balanceAccount.fetch(depositorBalancePda)).balance;

      await program.methods.deposit(new anchor.BN(900)).accounts({
        balanceAccount: depositorBalancePda,
        depositor: depositor.publicKey,
      })
        .signers([depositor])
        .rpc();

      const depositorBalanceAfter = (await program.account.balanceAccount.fetch(depositorBalancePda)).balance;

      expect(depositorBalanceAfter.toNumber()).to.equal(depositorBalanceBefore.toNumber() + amount);
    });

    it('should fail when balance exceeds the 1000 max limit', async () => {
      try {
        await program.methods.deposit(new anchor.BN(1000)).accounts({
          balanceAccount: depositorBalancePda,
          depositor: depositor.publicKey,
        })
          .signers([depositor])
          .rpc();
      } catch (err: unknown) {
        expect((err as AnchorError).message).to.contain('Exceeded the max balance');
      }
    });
  });
});
