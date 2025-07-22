// generate-keys.js
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/bcs';
import fs from 'fs';

const NUM_KEYS = 100;
const keypairs: never[] = [];

function generateKeyPair() {
  const keypair = new Ed25519Keypair();
  const publicKey = keypair.getPublicKey();

 const privateKeyUint8Array = keypair.getSecretKey(); // This returns a Uint8Array

  // Convert Uint8Array to Base64 string using Node.js Buffer
  const privateKeyBase64 = Buffer.from(privateKeyUint8Array).toString('base64');

  return {
    suiAddress: publicKey.toSuiAddress(),
    publicKey: publicKey.toBase64(),
    privateKey: privateKeyBase64,
  };
}

// Generate 100 key pairs
const keyPairs = [];
for (let i = 0; i < 100; i++) {
  const newKeyPair = generateKeyPair();
  keyPairs.push(newKeyPair);
  console.log(`Generated key pair #${i + 1}:`, newKeyPair.suiAddress, newKeyPair.privateKey);
}

// Save to a JSON file
fs.writeFileSync('sui_keypairs.json', JSON.stringify(keypairs, null, 2));
console.log(`✅ Successfully generated ${NUM_KEYS} keypairs to sui_keypairs.json`);
