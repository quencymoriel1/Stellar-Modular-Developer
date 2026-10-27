use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ServiceNotFound = 4,
    ServiceInactive = 5,
    InvalidPrice = 6,
    DuplicateNonce = 7,
    TierNotFound = 8,
    SubscriptionExpired = 9,
    InvalidSplit = 10,
    ZeroEarnings = 11,
}
