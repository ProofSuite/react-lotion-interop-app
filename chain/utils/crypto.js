const ed = require('supercop.js')

function convertEd25519 (ref10Priv) {
  // see https://github.com/orlp/ed25519/issues/10#issuecomment-242761092
  let privConverted = sha512(ref10Priv.slice(0, 32))
  privConverted[0] &= 248
  privConverted[31] &= 63
  privConverted[31] |= 64
  return privConverted
}

function SignEd25519 (privValidator, message) {
  if (privValidator.priv_key.type !== 'tendermint/PrivKeyEd25519') {
    throw Error('Expected privkey type "tendermint/PrivKeyEd25519"')
  }

  let pub = Buffer.from(privValidator.pub_key.value, 'base64')
  let ref10Priv = Buffer.from(privValidator.priv_key.value, 'base64')
  let priv = convertEd25519(ref10Priv)

  return ed.sign(message, pub, priv)
}

const SignEd25519 = () => {

}

module.exports = {
  SignEd25519
}


