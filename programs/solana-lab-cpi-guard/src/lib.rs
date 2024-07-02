use {
    anchor_lang::prelude::*,
    anchor_spl::{
        token_2022::{
            approve, burn, close_account, set_authority, Approve, Burn, CloseAccount, SetAuthority,
        },
        token_interface,
    },
};

declare_id!("DAdVwTVzEuJMt1cNnN8K3QPVVZX9mLLDDGh2xsZxtaXm");

#[program]
pub mod solana_lab_cpi_guard {
    use super::*;

    pub fn malicious_close_account(ctx: Context<MaliciousCloseAccount>) -> Result<()> {
        msg!("Invoked MaliciousCloseAccount");

        msg!(
            "Token account to close : {}",
            ctx.accounts.token_account.key()
        );

        close_account(CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.token_account.to_account_info(),
                destination: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ))
    }

    pub fn prohibited_approve_account(ctx: Context<ApproveAccount>, amount: u64) -> Result<()> {
        msg!("Invoked ProhibitedApproveAccount");

        msg!(
            "Approving delegate: {} to transfer up to {} tokens.",
            ctx.accounts.delegate.key(),
            amount
        );

        approve(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Approve {
                    to: ctx.accounts.token_account.to_account_info(),
                    delegate: ctx.accounts.delegate.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )
    }

    pub fn prohibted_set_authority(ctx: Context<SetAuthorityAccount>) -> Result<()> {
        msg!("Invoked ProhibitedSetAuthority");

        msg!(
            "Setting authority of token account: {} to address: {}",
            ctx.accounts.token_account.key(),
            ctx.accounts.new_authority.key()
        );

        set_authority(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                SetAuthority {
                    current_authority: ctx.accounts.authority.to_account_info(),
                    account_or_mint: ctx.accounts.token_account.to_account_info(),
                },
            ),
            spl_token_2022::instruction::AuthorityType::CloseAccount,
            Some(ctx.accounts.new_authority.key()),
        )
    }

    pub fn unauthorized_burn(ctx: Context<BurnAccounts>, amount: u64) -> Result<()> {
        msg!("Invoked Burn");

        msg!(
            "Burning {} tokens from address: {}",
            amount,
            ctx.accounts.token_account.key()
        );

        burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    from: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )
    }

    pub fn set_owner(ctx: Context<SetOwnerAccounts>) -> Result<()> {
        msg!("Invoked SetOwner");

        msg!(
            "Setting owner of token account: {} to address: {}",
            ctx.accounts.token_account.key(),
            ctx.accounts.new_owner.key()
        );

        set_authority(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                SetAuthority {
                    current_authority: ctx.accounts.authority.to_account_info(),
                    account_or_mint: ctx.accounts.token_account.to_account_info(),
                },
            ),
            spl_token_2022::instruction::AuthorityType::AccountOwner,
            Some(ctx.accounts.new_owner.key()),
        )
    }
}

#[derive(Accounts)]
pub struct MaliciousCloseAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        token::token_program = token_program,
        token::authority = authority
    )]
    pub token_account: InterfaceAccount<'info, token_interface::TokenAccount>,
    /// CHECK: malicious account
    #[account(mut)]
    pub destination: AccountInfo<'info>,
    pub token_program: Interface<'info, token_interface::TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        token::token_program = token_program,
        token::authority = authority
    )]
    pub token_account: InterfaceAccount<'info, token_interface::TokenAccount>,
    /// CHECK: delegat to approve
    #[account(mut)]
    pub delegate: AccountInfo<'info>,
    pub token_program: Interface<'info, token_interface::TokenInterface>,
}

#[derive(Accounts)]
pub struct SetAuthorityAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        token::token_program = token_program,
        token::authority = authority
    )]
    pub token_account: InterfaceAccount<'info, token_interface::TokenAccount>,
    /// CHECK: delegat to approve
    #[account(mut)]
    pub new_authority: AccountInfo<'info>,
    pub token_program: Interface<'info, token_interface::TokenInterface>,
}

#[derive(Accounts)]
pub struct BurnAccounts<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        token::token_program = token_program,
        token::authority = authority
    )]
    pub token_account: InterfaceAccount<'info, token_interface::TokenAccount>,
    #[account(
        mut,
        mint::token_program = token_program
    )]
    pub token_mint: InterfaceAccount<'info, token_interface::Mint>,
    pub token_program: Interface<'info, token_interface::TokenInterface>,
}

#[derive(Accounts)]
pub struct SetOwnerAccounts<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        token::token_program = token_program,
        token::authority = authority
    )]
    pub token_account: InterfaceAccount<'info, token_interface::TokenAccount>,
    /// CHECK: delegat to approve
    #[account(mut)]
    pub new_owner: AccountInfo<'info>,
    pub token_program: Interface<'info, token_interface::TokenInterface>,
}
