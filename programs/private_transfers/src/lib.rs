pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

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

        let public_inputs = vec![
            root.to_vec(),
            nullifier_hash.to_vec(),
            amount_bytes.to_vec(),
        ];

        sunspot::verify(
            &VERIFICATION_KEY,
            &proof,
            &public_inputs
        ).map_err(|_| ProgramError::Custom(1))?;

        ctx.accounts.nullifier_account.hash = nullifier_hash;


        **ctx.accounts.vault.try_borrow_mut_lamports()? -= amount;
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

    pub system_program: Program<'info, System>, 
}

#[account]
pub struct Nullifier {
    pub hash: [u8; 32]
}