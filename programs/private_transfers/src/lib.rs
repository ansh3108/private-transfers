pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::Instruction, program::invoke};

declare_id!("DQaB98bRsVCThsUqbRDH7CJYBCD2WeMHQbhHfWKKFCwU");

#[program]
pub mod private_transfers {
    use super::*;

    pub fn withdraw(
        ctx: Context<Withdraw>,
        proof: Vec<u8>,
        root: [u8; 32],
        nullifier_hash: [u8; 32],
        amount: u64,
    ) -> Result<()> {

        let mut amount_bytes = [0u8; 32];
        amount_bytes[24..32].copy_from_slice(&amount.to_be_bytes());

        let mut ix_data = Vec::new();
        ix_data.extend_from_slice(&proof);
        ix_data.extend_from_slice(&root);
        ix_data.extend_from_slice(&nullifier_hash);
        ix_data.extend_from_slice(&amount_bytes);

        let verify_ix = Instruction {
            program_id: *ctx.accounts.verifier_program.key,
            accounts: vec![],
            data: ix_data,
        };

        invoke (
            &verify_ix,
            &[ctx.accounts.verifier_program.to_account_info()],
        )?;

        ctx.accounts.nullifier_account.hash = nullifier_hash;

        **ctx.accounts.vault.try_borrow_mut_lamports()? -=amount;
        **ctx.accounts.user.try_borrow_mut_lamports()? += amount;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(proof: Vec<u8>, root: [u8; 32], nullifier_hash: [u8; 32], amount: u64)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init, 
        payer=user,
        space = 8 + 32,
        seeds = [&nullifier_hash],
        bump
    )]
    pub nullifier_account: Account<'info, Nullifier>,

    #[account(
        mut, 
        seeds = [b"vault"], 
        bump
    )]   

    ///CHECK: Program vault PDA holding the shared SOL pool
    pub vault: UncheckedAccount<'info>,

    ///CHECK: The standalone Sunspot Groth16 verifier program
    pub verifier_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>, 
}

#[account]
pub struct Nullifier {
    pub hash: [u8; 32]
}