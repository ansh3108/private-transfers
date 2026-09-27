use poseidon::poseidon::bn254;

pub fn compute_root(leaf: Field, path_indices: [bool; 2], siblings: [Field; 2]) -> Field {
    let mut current_hash = leaf;

    for i in 0 .. 2 {
        if path_indices[i] {
            current_hash = bn254::hash_2([current_hash, siblings[i]]);
        } else {
            current_hash = bn254::hash_2([siblings[i], current_hash]);
        }
    }
    current_hash
}