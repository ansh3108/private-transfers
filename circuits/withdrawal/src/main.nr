use hasher;
use merkle_hasher;


fn main(
    root: pub Field,
    nullifier_hash: pub Field, 
    amount: pub Field, 
    nullifier: Field, 
    path_indices: [bool; 2], 
    siblings: [Field; 2], 
    secret: Field
    ) {

    let commitment = hasher::compute_commitment(nullifier, secret, amount);

    
    let calculated_root = merkle_hasher::compute_root(commitment, path_indices, siblings);
    assert(calculated_root == root);


    let expected_nullifier = hasher::compute_nullifier(nullifier, secret);
    assert(expected_nullifier == nullifier_hash);
}