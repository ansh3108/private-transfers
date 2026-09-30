use hasher;
use merkle_hasher;


fn main(
    root: pub Field,
    nullifier_hash: pub Field, 
    amount: pub Field, 
    nullifier: Field, 
    secret: Field,
    path_indices: [bool; 2], 
    siblings: [Field; 2], 
    ) {

    let commitment = hasher::compute_commitment(nullifier, secret, amount);
    
    let calculated_root: Field = merkle_hasher::compute_root(commitment, path_indices, siblings);
    assert(calculated_root == root);
    


    let expected_nullifier = hasher::compute_nullifier(nullifier, secret);
    assert(expected_nullifier == nullifier_hash);
}


#[test]
fn test_with_withdrawal() {
    let nullifier = 1;
    let secret = 2;
    let amount= 10;

    let siblings = [0, 0];
    let path_indices = [false, false];

    let commitment = hasher::compute_commitment(nullifier, secret, amount);
    let nullifier_hash = hasher::compute_nullifier(nullifier, secret);

    let root = merkle_hasher::compute_root(commitment, path_indices, siblings);

    main(root, nullifier_hash, amount, nullifier, secret, path_indices, siblings);
}