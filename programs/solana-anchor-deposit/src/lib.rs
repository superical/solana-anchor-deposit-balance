use anchor_lang::prelude::*;

declare_id!("5cSanSreu1HumAHVu5xnRcfSTytNyMcmQr83ksHMp6rf");

#[program]
pub mod solana_anchor_deposit {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // let balance_account = &mut ctx.accounts.balance_account;
        let balance_account = &mut ctx.accounts.balance_account;
        let depositor = &ctx.accounts.depositor;

        msg!("Depositing: {}", amount);
        msg!("Depositor Account: {:?}", depositor.to_account_info().key);
        msg!("Balance Account: {:?}", balance_account.to_account_info().key);

        balance_account.balance += amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(init, payer = depositor, space = 8 + 8)]
    pub balance_account: Account<'info, BalanceAccount>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct BalanceAccount {
    pub balance: u64,
}

