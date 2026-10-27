#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::Client as TokenClient,
    token::StellarAssetClient as AssetClient,
    Address, BytesN, Env, String, Symbol,
};

fn create_token_contract<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, AssetClient<'a>) {
    let sac = e.register_stellar_asset_contract_v2(admin.clone());
    (
        TokenClient::new(e, &sac.address()),
        AssetClient::new(e, &sac.address()),
    )
}

#[test]
fn test_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, StellarModularDeveloperContract);
    let client = StellarModularDeveloperContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);

    client.initialize(&admin, &treasury, &250); // 2.5% protocol fee
    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_treasury(), treasury);

    let stats = client.get_stats();
    assert_eq!(stats.total_services, 0);
    assert_eq!(stats.total_calls, 0);
}

#[test]
fn test_register_and_get_service() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, StellarModularDeveloperContract);
    let client = StellarModularDeveloperContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    client.initialize(&admin, &treasury, &100);

    let provider = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token, _) = create_token_contract(&env, &token_admin);

    let service_id = Symbol::new(&env, "ai_gpt4");
    let name = String::from_str(&env, "AI Intelligence API");
    let url_hash = BytesN::from_array(&env, &[7u8; 32]);
    let price_stroops: i128 = 200_000; // 0.02 XLM or USDC
    let rev_split_bps: u32 = 8000;
    let metadata = String::from_str(&env, "ipfs://QmStellarModularDev");

    client.register_service(
        &provider,
        &service_id,
        &name,
        &url_hash,
        &price_stroops,
        &token.address,
        &rev_split_bps,
        &metadata,
    );

    let service = client.get_service(&service_id);
    assert_eq!(service.provider, provider);
    assert_eq!(service.price_stroops, 200_000);
    assert_eq!(service.active, true);
    assert_eq!(service.total_calls, 0);

    assert_eq!(client.get_service_count(), 1);
    let indexed_svc = client.get_service_by_index(&0);
    assert_eq!(indexed_svc.service_id, service_id);
}

#[test]
fn test_pay_per_call_and_replay_protection() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, StellarModularDeveloperContract);
    let client = StellarModularDeveloperContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    client.initialize(&admin, &treasury, &500); // 5% protocol fee

    let provider = Address::generate(&env);
    let caller = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token, asset) = create_token_contract(&env, &token_admin);

    // Mint 10,000,000 stroops to caller
    asset.mint(&caller, &10_000_000);
    assert_eq!(token.balance(&caller), 10_000_000);

    let service_id = Symbol::new(&env, "weather");
    let name = String::from_str(&env, "Weather Oracle API");
    let url_hash = BytesN::from_array(&env, &[1u8; 32]);
    let price: i128 = 100_000; // 0.01 XLM

    client.register_service(
        &provider,
        &service_id,
        &name,
        &url_hash,
        &price,
        &token.address,
        &0,
        &String::from_str(&env, "uri://meta"),
    );

    let nonce = BytesN::from_array(&env, &[42u8; 32]);
    let receipt = client.pay_per_call(&caller, &service_id, &nonce);

    assert_eq!(receipt.amount_paid, 100_000);
    assert_eq!(receipt.caller, caller);

    // 5% of 100_000 = 5_000 to treasury, 95_000 to provider
    assert_eq!(token.balance(&provider), 95_000);
    assert_eq!(token.balance(&treasury), 5_000);
    assert_eq!(token.balance(&caller), 9_900_000);

    // Nonce verification on-chain
    let stored_receipt = client.get_receipt(&service_id, &nonce);
    assert_eq!(stored_receipt.nonce, nonce);

    // Replay attack with same nonce should fail
    let replay_result = client.try_pay_per_call(&caller, &service_id, &nonce);
    assert!(replay_result.is_err());

    // Stats updated
    let stats = client.get_stats();
    assert_eq!(stats.total_calls, 1);
    assert_eq!(stats.total_volume_stroops, 100_000);
}

#[test]
fn test_subscription_tiers() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, StellarModularDeveloperContract);
    let client = StellarModularDeveloperContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    client.initialize(&admin, &treasury, &0);

    let provider = Address::generate(&env);
    let caller = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token, asset) = create_token_contract(&env, &token_admin);

    asset.mint(&caller, &50_000_000);

    let service_id = Symbol::new(&env, "crypto_feed");
    client.register_service(
        &provider,
        &service_id,
        &String::from_str(&env, "Crypto Feed"),
        &BytesN::from_array(&env, &[2u8; 32]),
        &50_000,
        &token.address,
        &0,
        &String::from_str(&env, "uri"),
    );

    // Create tier 1: 1000 ledgers duration, 50 calls max, price 1_000_000
    client.create_tier(&provider, &service_id, &1, &1000, &50, &1_000_000);

    let tier = client.get_tier(&service_id, &1);
    assert_eq!(tier.price_stroops, 1_000_000);
    assert_eq!(tier.max_calls, 50);

    assert_eq!(client.check_access(&caller, &service_id), false);

    // Caller subscribes
    client.subscribe_tier(&caller, &service_id, &1);
    assert_eq!(client.check_access(&caller, &service_id), true);
    assert_eq!(token.balance(&provider), 1_000_000);

    // Consume call
    let consumed = client.consume_quota_call(&caller, &service_id);
    assert_eq!(consumed, true);
    assert_eq!(client.check_access(&caller, &service_id), true);

    // Fast forward ledgers beyond expiry
    env.ledger().set_sequence_number(2000);
    assert_eq!(client.check_access(&caller, &service_id), false);
}
