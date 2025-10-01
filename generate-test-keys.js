const { PrivateKey } = require("@hashgraph/sdk");

// Générer des clés de test pour le développement local
console.log("Génération de clés de test Hedera...\n");

// Clé ED25519
const ed25519Key = PrivateKey.generateED25519();
console.log("=== Clé ED25519 ===");
console.log("HEDERA_PRIVATE_KEY=" + ed25519Key.toStringDer());
console.log("Public Key:", ed25519Key.publicKey.toStringDer());

// Clé ECDSA
const ecdsaKey = PrivateKey.generateECDSA();
console.log("\n=== Clé ECDSA ===");
console.log("HEDERA_ECDSA_PRIVATE_KEY=" + ecdsaKey.toStringDer());
console.log("Public Key:", ecdsaKey.publicKey.toStringDer());

console.log("\n⚠️ Ces clés sont générées uniquement pour le développement local.");
console.log("⚠️ Vous devrez créer de vrais comptes Hedera Testnet pour un fonctionnement complet.");
console.log("⚠️ Pour un développement rapide, le code peut être modifié pour utiliser un mode simulation.");