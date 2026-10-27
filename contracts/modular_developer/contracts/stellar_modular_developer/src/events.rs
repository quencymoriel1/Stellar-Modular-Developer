use soroban_sdk::{symbol_short, Address, BytesN, Env, Symbol};

pub fn emit_service_registered(
    env: &Env,
    service_id: &Symbol,
    provider: &Address,
    price_stroops: i128,
) {
    let topics = (symbol_short!("svc_reg"), service_id.clone(), provider.clone());
    env.events().publish(topics, price_stroops);
}

pub fn emit_service_updated(
    env: &Env,
    service_id: &Symbol,
    active: bool,
    price_stroops: i128,
) {
    let topics = (symbol_short!("svc_upd"), service_id.clone());
    env.events().publish(topics, (active, price_stroops));
}

pub fn emit_call_paid(
    env: &Env,
    service_id: &Symbol,
    caller: &Address,
    amount: i128,
    nonce: &BytesN<32>,
) {
    let topics = (symbol_short!("call_paid"), service_id.clone(), caller.clone());
    env.events().publish(topics, (amount, nonce.clone()));
}

pub fn emit_tier_created(
    env: &Env,
    service_id: &Symbol,
    tier_id: u32,
    price_stroops: i128,
) {
    let topics = (symbol_short!("tier_new"), service_id.clone(), tier_id);
    env.events().publish(topics, price_stroops);
}

pub fn emit_tier_subscribed(
    env: &Env,
    service_id: &Symbol,
    caller: &Address,
    tier_id: u32,
) {
    let topics = (symbol_short!("tier_sub"), service_id.clone(), caller.clone());
    env.events().publish(topics, tier_id);
}

#[allow(dead_code)]
pub fn emit_earnings_claimed(
    env: &Env,
    provider: &Address,
    token: &Address,
    amount: i128,
) {
    let topics = (symbol_short!("claimed"), provider.clone(), token.clone());
    env.events().publish(topics, amount);
}
