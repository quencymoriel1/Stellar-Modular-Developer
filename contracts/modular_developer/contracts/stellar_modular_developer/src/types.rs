use soroban_sdk::{contracttype, Address, BytesN, String, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Treasury,
    ProtocolFeeBps,
    Service(Symbol),
    ServiceCount,
    ServiceIndex(u32),
    Receipt(Symbol, BytesN<32>),
    Tier(Symbol, u32),
    Subscription(Address, Symbol),
    ProviderEarnings(Address, Address),
    Stats,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct ServiceRecord {
    pub provider: Address,
    pub service_id: Symbol,
    pub name: String,
    pub url_hash: BytesN<32>,
    pub price_stroops: i128,
    pub token: Address,
    pub rev_split_bps: u32,
    pub metadata_uri: String,
    pub active: bool,
    pub total_calls: u64,
    pub total_volume: i128,
    pub created_at: u64,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct CallReceipt {
    pub caller: Address,
    pub service_id: Symbol,
    pub nonce: BytesN<32>,
    pub amount_paid: i128,
    pub token: Address,
    pub timestamp: u64,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct SubscriptionTier {
    pub tier_id: u32,
    pub duration_ledgers: u32,
    pub max_calls: u32,
    pub price_stroops: i128,
    pub active: bool,
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct SubscriptionRecord {
    pub caller: Address,
    pub service_id: Symbol,
    pub tier_id: u32,
    pub expires_at_ledger: u32,
    pub remaining_calls: u32,
}

#[derive(Clone, Debug, PartialEq, Default)]
#[contracttype]
pub struct SystemStats {
    pub total_services: u32,
    pub total_calls: u64,
    pub total_volume_stroops: i128,
}
