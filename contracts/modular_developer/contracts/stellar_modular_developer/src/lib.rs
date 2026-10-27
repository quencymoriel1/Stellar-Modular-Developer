#![no_std]

mod errors;
mod events;
pub mod types;

#[cfg(test)]
mod test;

use errors::ContractError;
use types::{
    CallReceipt, DataKey, ServiceRecord, SubscriptionRecord, SubscriptionTier, SystemStats,
};

use soroban_sdk::{
    contract, contractimpl, token, Address, BytesN, Env, String, Symbol,
};

#[contract]
pub struct StellarModularDeveloperContract;

#[contractimpl]
impl StellarModularDeveloperContract {
    /// Initialize the contract with an admin, protocol treasury, and base protocol fee (in basis points, e.g. 100 = 1%)
    pub fn initialize(
        env: Env,
        admin: Address,
        treasury: Address,
        protocol_fee_bps: u32,
    ) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyInitialized);
        }

        if protocol_fee_bps > 5000 {
            return Err(ContractError::InvalidSplit);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage()
            .instance()
            .set(&DataKey::ProtocolFeeBps, &protocol_fee_bps);
        env.storage()
            .instance()
            .set(&DataKey::Stats, &SystemStats::default());
        env.storage().instance().set(&DataKey::ServiceCount, &0u32);

        Ok(())
    }

    /// Register a new modular API service endpoint on Stellar
    pub fn register_service(
        env: Env,
        provider: Address,
        service_id: Symbol,
        name: String,
        url_hash: BytesN<32>,
        price_stroops: i128,
        token: Address,
        rev_split_bps: u32,
        metadata_uri: String,
    ) -> Result<(), ContractError> {
        provider.require_auth();

        if price_stroops < 0 {
            return Err(ContractError::InvalidPrice);
        }
        if rev_split_bps > 10000 {
            return Err(ContractError::InvalidSplit);
        }

        let key = DataKey::Service(service_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(ContractError::DuplicateNonce);
        }

        let timestamp = env.ledger().timestamp();
        let service = ServiceRecord {
            provider: provider.clone(),
            service_id: service_id.clone(),
            name,
            url_hash,
            price_stroops,
            token,
            rev_split_bps,
            metadata_uri,
            active: true,
            total_calls: 0,
            total_volume: 0,
            created_at: timestamp,
        };

        env.storage().persistent().set(&key, &service);
        env.storage().persistent().extend_ttl(&key, 100_000, 500_000);

        // Index service
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ServiceCount)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::ServiceIndex(count), &service_id);
        env.storage()
            .instance()
            .set(&DataKey::ServiceCount, &(count + 1));

        // Update system stats
        let mut stats: SystemStats = env
            .storage()
            .instance()
            .get(&DataKey::Stats)
            .unwrap_or_default();
        stats.total_services += 1;
        env.storage().instance().set(&DataKey::Stats, &stats);

        events::emit_service_registered(&env, &service_id, &provider, price_stroops);
        Ok(())
    }

    /// Update service pricing, status, or split
    pub fn update_service(
        env: Env,
        provider: Address,
        service_id: Symbol,
        price_stroops: i128,
        active: bool,
        rev_split_bps: u32,
    ) -> Result<(), ContractError> {
        provider.require_auth();

        if price_stroops < 0 {
            return Err(ContractError::InvalidPrice);
        }
        if rev_split_bps > 10000 {
            return Err(ContractError::InvalidSplit);
        }

        let key = DataKey::Service(service_id.clone());
        let mut service: ServiceRecord = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::ServiceNotFound)?;

        if service.provider != provider {
            return Err(ContractError::Unauthorized);
        }

        service.price_stroops = price_stroops;
        service.active = active;
        service.rev_split_bps = rev_split_bps;

        env.storage().persistent().set(&key, &service);
        events::emit_service_updated(&env, &service_id, active, price_stroops);
        Ok(())
    }

    /// Settle a pay-per-call micropayment directly on Stellar via Soroban
    pub fn pay_per_call(
        env: Env,
        caller: Address,
        service_id: Symbol,
        nonce: BytesN<32>,
    ) -> Result<CallReceipt, ContractError> {
        caller.require_auth();

        let svc_key = DataKey::Service(service_id.clone());
        let mut service: ServiceRecord = env
            .storage()
            .persistent()
            .get(&svc_key)
            .ok_or(ContractError::ServiceNotFound)?;

        if !service.active {
            return Err(ContractError::ServiceInactive);
        }

        // Prevent replay attacks with nonce receipt check
        let receipt_key = DataKey::Receipt(service_id.clone(), nonce.clone());
        if env.storage().persistent().has(&receipt_key) {
            return Err(ContractError::DuplicateNonce);
        }

        let price = service.price_stroops;
        if price > 0 {
            let token_client = token::Client::new(&env, &service.token);
            let protocol_fee_bps: u32 = env
                .storage()
                .instance()
                .get(&DataKey::ProtocolFeeBps)
                .unwrap_or(0);
            let treasury: Address = env
                .storage()
                .instance()
                .get(&DataKey::Treasury)
                .unwrap_or(service.provider.clone());

            let fee_amount = if protocol_fee_bps > 0 {
                (price * (protocol_fee_bps as i128)) / 10000
            } else {
                0
            };
            let provider_amount = price - fee_amount;

            // Direct transfer from caller to provider
            token_client.transfer(&caller, &service.provider, &provider_amount);

            // Transfer fee to protocol treasury if configured
            if fee_amount > 0 {
                token_client.transfer(&caller, &treasury, &fee_amount);
            }
        }

        let timestamp = env.ledger().timestamp();
        let receipt = CallReceipt {
            caller: caller.clone(),
            service_id: service_id.clone(),
            nonce: nonce.clone(),
            amount_paid: price,
            token: service.token.clone(),
            timestamp,
        };

        // Persist receipt for on-chain verifiable audit
        env.storage().persistent().set(&receipt_key, &receipt);
        env.storage()
            .persistent()
            .extend_ttl(&receipt_key, 100_000, 500_000);

        // Update stats
        service.total_calls += 1;
        service.total_volume += price;
        env.storage().persistent().set(&svc_key, &service);

        let mut stats: SystemStats = env
            .storage()
            .instance()
            .get(&DataKey::Stats)
            .unwrap_or_default();
        stats.total_calls += 1;
        stats.total_volume_stroops += price;
        env.storage().instance().set(&DataKey::Stats, &stats);

        events::emit_call_paid(&env, &service_id, &caller, price, &nonce);
        Ok(receipt)
    }

    /// Create a recurring or quota-based subscription tier
    pub fn create_tier(
        env: Env,
        provider: Address,
        service_id: Symbol,
        tier_id: u32,
        duration_ledgers: u32,
        max_calls: u32,
        price_stroops: i128,
    ) -> Result<(), ContractError> {
        provider.require_auth();

        let svc_key = DataKey::Service(service_id.clone());
        let service: ServiceRecord = env
            .storage()
            .persistent()
            .get(&svc_key)
            .ok_or(ContractError::ServiceNotFound)?;

        if service.provider != provider {
            return Err(ContractError::Unauthorized);
        }

        let tier = SubscriptionTier {
            tier_id,
            duration_ledgers,
            max_calls,
            price_stroops,
            active: true,
        };

        let tier_key = DataKey::Tier(service_id.clone(), tier_id);
        env.storage().persistent().set(&tier_key, &tier);

        events::emit_tier_created(&env, &service_id, tier_id, price_stroops);
        Ok(())
    }

    /// Purchase a subscription tier pass for unmetered or bulk API access
    pub fn subscribe_tier(
        env: Env,
        caller: Address,
        service_id: Symbol,
        tier_id: u32,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let svc_key = DataKey::Service(service_id.clone());
        let service: ServiceRecord = env
            .storage()
            .persistent()
            .get(&svc_key)
            .ok_or(ContractError::ServiceNotFound)?;

        let tier_key = DataKey::Tier(service_id.clone(), tier_id);
        let tier: SubscriptionTier = env
            .storage()
            .persistent()
            .get(&tier_key)
            .ok_or(ContractError::TierNotFound)?;

        if !tier.active {
            return Err(ContractError::ServiceInactive);
        }

        if tier.price_stroops > 0 {
            let token_client = token::Client::new(&env, &service.token);
            token_client.transfer(&caller, &service.provider, &tier.price_stroops);
        }

        let current_ledger = env.ledger().sequence();
        let sub = SubscriptionRecord {
            caller: caller.clone(),
            service_id: service_id.clone(),
            tier_id,
            expires_at_ledger: current_ledger + tier.duration_ledgers,
            remaining_calls: tier.max_calls,
        };

        let sub_key = DataKey::Subscription(caller.clone(), service_id.clone());
        env.storage().persistent().set(&sub_key, &sub);
        env.storage()
            .persistent()
            .extend_ttl(&sub_key, 100_000, 500_000);

        events::emit_tier_subscribed(&env, &service_id, &caller, tier_id);
        Ok(())
    }

    /// Check if caller has an active subscription pass or remaining quota
    pub fn check_access(env: Env, caller: Address, service_id: Symbol) -> bool {
        let sub_key = DataKey::Subscription(caller, service_id);
        if let Some(sub) = env
            .storage()
            .persistent()
            .get::<DataKey, SubscriptionRecord>(&sub_key)
        {
            let current_ledger = env.ledger().sequence();
            current_ledger <= sub.expires_at_ledger && sub.remaining_calls > 0
        } else {
            false
        }
    }

    /// Consume a single call quota under an active subscription
    pub fn consume_quota_call(
        env: Env,
        caller: Address,
        service_id: Symbol,
    ) -> Result<bool, ContractError> {
        let sub_key = DataKey::Subscription(caller.clone(), service_id.clone());
        let mut sub: SubscriptionRecord = env
            .storage()
            .persistent()
            .get(&sub_key)
            .ok_or(ContractError::SubscriptionExpired)?;

        let current_ledger = env.ledger().sequence();
        if current_ledger > sub.expires_at_ledger || sub.remaining_calls == 0 {
            return Err(ContractError::SubscriptionExpired);
        }

        sub.remaining_calls -= 1;
        env.storage().persistent().set(&sub_key, &sub);
        Ok(true)
    }

    // --- Query Functions ---

    pub fn get_service(env: Env, service_id: Symbol) -> Result<ServiceRecord, ContractError> {
        let key = DataKey::Service(service_id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::ServiceNotFound)
    }

    pub fn get_service_by_index(env: Env, index: u32) -> Result<ServiceRecord, ContractError> {
        let sid_key = DataKey::ServiceIndex(index);
        let service_id: Symbol = env
            .storage()
            .persistent()
            .get(&sid_key)
            .ok_or(ContractError::ServiceNotFound)?;
        Self::get_service(env, service_id)
    }

    pub fn get_receipt(
        env: Env,
        service_id: Symbol,
        nonce: BytesN<32>,
    ) -> Result<CallReceipt, ContractError> {
        let key = DataKey::Receipt(service_id, nonce);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::ServiceNotFound)
    }

    pub fn get_tier(
        env: Env,
        service_id: Symbol,
        tier_id: u32,
    ) -> Result<SubscriptionTier, ContractError> {
        let key = DataKey::Tier(service_id, tier_id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::TierNotFound)
    }

    pub fn get_stats(env: Env) -> SystemStats {
        env.storage()
            .instance()
            .get(&DataKey::Stats)
            .unwrap_or_default()
    }

    pub fn get_service_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ServiceCount)
            .unwrap_or(0)
    }

    pub fn get_admin(env: Env) -> Result<Address, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ContractError::NotInitialized)
    }

    pub fn get_treasury(env: Env) -> Result<Address, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Treasury)
            .ok_or(ContractError::NotInitialized)
    }
}
