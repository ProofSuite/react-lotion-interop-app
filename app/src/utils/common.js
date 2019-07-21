let base58check = require('bs58check')
const secp256k1 = require('secp256k1')
const Haikunator = require('haikunator')
const { randomBytes } = require('crypto')
let { createHash } = require('crypto')
let { stringify } = require('deterministic-json')

let haikunator = new Haikunator({
  seed: 'custom-seed',
  defaults: {
      tokenLength: 8,
      tokenChars: 'HAIKUNATOR',
  }
})

function hashFunc (algo) {
  return (data) => createHash(algo).update(data).digest()
}

let sha256 = hashFunc('sha256')
let ripemd160 = hashFunc('ripemd160')

function addressHash (data) {
  let hash = ripemd160(sha256(data))
  return hashToAddress(hash)
}

function hashToAddress (hash) {
  return base58check.encode(hash)
}

function clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function generatePrivateKey () {
  const msg = randomBytes(32)

  let privKey = randomBytes(32)
  while (!secp256k1.privateKeyVerify(privKey)) {
    privKey = randomBytes(32)
  }

  let pubKey = secp256k1.publicKeyCreate(privKey)
  let address = addressHash(pubKey)

  pubKey = pubKey.toString('hex')
  privKey = privKey.toString('hex')
  address = address.toString('hex')

  return { pubKey, privKey, address }
}

function getSigHash (tx) {
  tx = clone(tx)

  // exclude properties of inputs named "signature" or "signatures"
  // (we can't check the signature against the hash of the signature!)
  for (let input of tx.from) {
    for (let key in input) {
      if (key === 'signature' || key === 'signatures') {
        delete input[key]
      }
    }
  }

  // stringify tx deterministically (and convert buffers to strings)
  // then return sha256 hash of that
  let txString = stringify(tx)
  return sha256(txString)
}

function generateRandomName() {
  return haikunator.haikunate({ tokenLength: 0, delimiter: "" })
}


module.exports = {
  clone,
  sha256,
  ripemd160,
  addressHash,
  hashToAddress,
  generatePrivateKey,
  getSigHash,
  generateRandomName
}
