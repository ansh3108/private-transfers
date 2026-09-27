use poseidon::poseidon::bn254;

pub fn compute_commitment(nullifier: Field, secret: Field, amount: Field) -> Field {
    bn254::hash_3([nullifier, secret, amount])
}

pub fn compute_nullifier(nullifier: Field, secret: Field) -> Field {
    bn254::hash_2([nullifier, secret])
}