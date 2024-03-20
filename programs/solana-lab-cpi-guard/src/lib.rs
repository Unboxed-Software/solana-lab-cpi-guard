use {
    anchor_lang::prelude::*,
    anchor_spl::{
        token_interface,
        token_2022::{
            CloseAccount, close_account,
            Approve, approve,
            SetAuthority, set_authority,
            Burn, burn,
        },
    },
    spl_token_2022,
};

declare_id!("EG7xGsrXk7sYEgZ73R7kCAH3f3mL5HSVGUaLTe3vwUQw");

#[program]
pub mod solana_lab_cpi_guard {
    use super::*;

    pub fn malicious_close_account(ctx: Context<MaliciousCloseAccount>) -> Result<()> {
        msg!("Invoked MaliciousCloseAccount");

        msg!("Token account to close : {}", ctx.accounts.token_account.key());

        close_account(ctx.accounts.close_account_ctx())?;
        Ok(())
    }

    pub fn prohibited_approve_account(ctx: Context<ApproveAccount>, amount: u64) -> Result<()> {
        msg!("Invoked ProhibitedApproveAccount");

        msg!("Approving delegate: {} to transfer up to {} tokens.", ctx.accounts.delegate.key(), amount);

        approve(ctx.accounts.approve_delegate_ctx(), amount)?;
        Ok(())
    }

    pub fn prohibted_set_authority(ctx: Context<SetAuthorityAccount>) -> Result<()> {
        msg!("Invoked ProhibitedSetAuthority");

        msg!("Setting authority of token account: {} to address: {}", ctx.accounts.token_account.key(), ctx.accounts.new_authority.key());

        set_authority(
            ctx.accounts.set_authority_ctx(),
            spl_token_2022::instruction::AuthorityType::CloseAccount,
            Some(ctx.accounts.new_authority.key()),
        )?;

        Ok(())
    }

    pub fn unauthorized_burn(ctx: Context<BurnAccounts>, amount: u64) -> Result<()> {
        msg!("Invoked Burn");

        msg!("Burning {} tokens from address: {}", amount, ctx.accounts.token_account.key());

        burn(
            ctx.accounts.burn_ctx(),
            amount
        )?;

        Ok(())
    }

    pub fn set_owner(ctx: Context<SetOwnerAccounts>) -> Result<()> {

        msg!("Invoked SetOwner");

        msg!("Setting owner of token account: {} to address: {}", ctx.accounts.token_account.key(), ctx.accounts.new_owner.key());

        set_authority(
            ctx.accounts.set_owner_ctx(),
            spl_token_2022::instruction::AuthorityType::AccountOwner,
            Some(ctx.accounts.new_owner.key()),
        )?;

        Ok(())
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
    pub token_program: Interface<'info, token_interface::TokenInterface>
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

impl<'info> MaliciousCloseAccount <'info> {
    // close_account for Token2022
    pub fn close_account_ctx(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = CloseAccount {
            account: self.token_account.to_account_info(),
            destination: self.destination.to_account_info(),
            authority: self.authority.to_account_info(),
        };

        CpiContext::new(cpi_program, cpi_accounts)
    }
}

impl <'info> ApproveAccount <'info> {
    pub fn approve_delegate_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Approve<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Approve {
            to: self.token_account.to_account_info(),
            delegate: self.delegate.to_account_info(),
            authority: self.authority.to_account_info()
        };

        CpiContext::new(cpi_program, cpi_accounts)
    } 
}

impl <'info> SetAuthorityAccount <'info> {
    pub fn set_authority_ctx(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = SetAuthority {
            current_authority: self.authority.to_account_info(),
            account_or_mint: self.token_account.to_account_info(),
        };

        CpiContext::new(cpi_program, cpi_accounts)
    } 
}

impl <'info> BurnAccounts <'info> {
    pub fn burn_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Burn {
            mint: self.token_mint.to_account_info(),
            from: self.token_account.to_account_info(),
            authority: self.authority.to_account_info()
        };

        CpiContext::new(cpi_program, cpi_accounts)
    }
}

impl <'info> SetOwnerAccounts <'info> {
    pub fn set_owner_ctx(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = SetAuthority {
            current_authority: self.authority.to_account_info(),
            account_or_mint: self.token_account.to_account_info(),
        };

        CpiContext::new(cpi_program, cpi_accounts)
    } 
}