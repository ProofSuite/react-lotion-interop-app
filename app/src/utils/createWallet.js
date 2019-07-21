const { randomBytes } = require('crypto')
const secp256k1 = require('secp256k1')
const { addressHash } = require('./common')

const generatePrivateKey = () => {
  const msg = randomBytes(32)

  let privKey = randomBytes(32)
  while (!secp256k1.privateKeyVerify(privKey)) {
    privKey = randomBytes(32)
  }

  let pubKey = secp256k1.publicKeyCreate(privKey)
  pubKey = pubKey.toString('hex')
  privKey = privKey.toString('hex')
  address = addressHash(pubKey)

  return { pubKey, privKey, address }
}

module.exports = { generatePrivateKey }


