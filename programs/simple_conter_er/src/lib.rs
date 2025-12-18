use anchor_lang::prelude::*;

declare_id!("BNSuw8GSUcDypTyJFTc1SDfKVv6fGUd4kndomtBKUqMu");

use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;

#[ephemeral]
#[program]
pub mod simple_counter_er {
    use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};

    use super::*;

    pub fn initialize(ctx: Context<InitializeCounter>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        Ok(())
    }

    pub fn increment_counter(ctx: Context<IncrementCounter>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(1).unwrap();
        msg!("Counter incremented successfully!");
        msg!("Counter Value: {}", counter.count);
        Ok(())
    }

    pub fn delegate_counter(ctx: Context<DelegateCounter>) -> Result<()> {
        let delegate_config = DelegateConfig {
            commit_frequency_ms: 30_000,
            validator: Some(pubkey!("MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57")),
        };

        let seed: &[u8] = b"counter";
        let seeds = &[seed];

        ctx.accounts.delegate_counter(&ctx.accounts.signer, seeds, delegate_config)?;

        msg!("Delegated counter account successfully!");

        Ok(())
    }

    pub fn commit_and_undelegate_counter(ctx: Context<CommitCounter>) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.signer, 
            vec![&ctx.accounts.counter.to_account_info()], 
            &ctx.accounts.magic_context, 
            &ctx.accounts.magic_program
        )?;

        msg!("Commited Accounts SUccessfully!");
        Ok(())
    }

    pub fn commit_counter(ctx: Context<CommitCounter>) -> Result<()> {

        commit_accounts(
            &ctx.accounts.signer, 
            vec![&ctx.accounts.counter.to_account_info()], 
            &ctx.accounts.magic_context, 
            &ctx.accounts.magic_program
        )?;

        msg!("Commited accounts successfully!");

        Ok(())
    }

}

#[derive(Accounts)]
pub struct InitializeCounter<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + 8,
        seeds = [b"counter"],
        bump
    )]
    pub counter: Account<'info, Counter>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct IncrementCounter<'info> {
     #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"counter"],
        bump
    )]
    pub counter: Account<'info, Counter>,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateCounter<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        del,
        seeds = [b"counter"],
        bump
    )]
    pub counter: Account<'info, Counter>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitCounter<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"counter"],
        bump
    )]
    pub counter: Account<'info, Counter>,
}

#[account]
pub struct Counter {
    pub count: u64
}