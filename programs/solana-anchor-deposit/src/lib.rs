use anchor_lang::prelude::*;

declare_id!("5cSanSreu1HumAHVu5xnRcfSTytNyMcmQr83ksHMp6rf");

#[program]
pub mod solana_anchor_deposit {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
