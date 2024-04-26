use anchor_lang::prelude::*;

declare_id!("5cSanSreu1HumAHVu5xnRcfSTytNyMcmQr83ksHMp6rf");

#[program]
pub mod solana_anchor_deposit {
    use super::*;

    const MAX_BALANCE: u64 = 1000;

    pub fn initialize(ctx: Context<InitializeDeposit>, amount: u64) -> Result<()> {
        let balance_account = &mut ctx.accounts.balance_account;
        balance_account.balance += amount;

        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        if amount == 0 || amount % 100 != 0 {
            return Err(ErrorCode::InvalidAmount.into());
        }

        let balance_account = &mut ctx.accounts.balance_account;
        balance_account.balance += amount;

        if balance_account.balance > MAX_BALANCE {
            return Err(ErrorCode::MaxBalanceExceeded.into());
        }

        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid deposit amount")]
    InvalidAmount,
    #[msg("Exceeded the max balance")]
    MaxBalanceExceeded,
}

#[derive(Accounts)]
pub struct InitializeDeposit<'info> {
    #[account(
    init,
    seeds = [depositor.key().as_ref()],
    bump,
    payer = depositor,
    space = 8 + 8
    )]
    pub balance_account: Account<'info, BalanceAccount>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
    mut,
    seeds = [depositor.key().as_ref()],
    bump,
    )]
    pub balance_account: Account<'info, BalanceAccount>,
    #[account(mut)]
    pub depositor: Signer<'info>,
}

#[account]
pub struct BalanceAccount {
    pub balance: u64,
}

