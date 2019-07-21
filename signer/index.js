let { genesis, chainId } = require('./config.json')
let { validatorKeys, signatoryKeys } = require('./secret.json')
let { connect } = require('lotion')
let ed25519 = require('supercop.js')
let secp256k1 = require('secp256k1')

let {
  getSignatorySet,
  convertValidatorsObjectFormat,
  findSignatoryIndex
 } = require('../chain/utils/governance')


async function start() {
  let { validatorPublicKey, validatorPrivateKey } = validatorKeys
  let { signatoryPrivateKey } = signatoryKeys
  if (!signatoryPrivateKey) {
    signatoryKeys.signatoryPrivateKey = randomBytes(32)
    signatoryKeys.signatoryPublicKey = secp256k1.publicKeyCreate(signatoryPrivateKey)

    fs.writeFileSync('./secret.json', JSON.stringify(validatorKeys))
    console.log('Generated private key. The key has been saved in secret.json')
  }

  let sidechain = await connect(chainId, {
    genesis,
    nodes: ['ws://localhost:something']
  })

  // Verify that the key is not present in the signatory set
  let signatoryPublicKey = secp.publicKeyCreate(signatoryKeys.signatoryPrivateKey)
  let savedSignatoryPublicKey = await client.state.signatoryKeys[validatorPublicKey]
  if (savedSignatoryPublicKey && !savedSignatoryPublicKey.equals(signatoryPublicKey)) {
    console.log('Already commited to a different signatory key')
    process.exit(1)
  }

  if (savedSignatoryPublicKey == null || !savedSignatoryPublicKey.equals(signatoryPublicKey)) {
    await addValidatorSignatoryKey(sidechain, validatorKeys, signatoryPublicKey)
    console.log('Added signatory key on sidechain')
  }

  while (true) {
    try {
      await signWithdrawal(sidechain, signatoryKeys)
      console.log('Signed withdrawal')
    } catch (e) {
      console.log(e.message)
    }

    await delay(5000)
  }

}

const secp256k1 = require('secp256k1')
const { randomBytes } = require('crypto')
const crypto = require('./src/')

const privKey = randomBytes(32)
const pubKeySecp256k1 = secp256k1.publicKeyCreate(privKey)

const privKeyString = privKey.toString('hex')
const pubKeySecp256k1String = pubKeySecp256k1.toString('hex')

console.log(privKeyString)
console.log(pubKeySecp256k1String)

// Adds a signatory key to the address [validatorKey]: signatoryKey.
// A signatory key represents the validator on the Ethereum chain. We have to do this because
// Ethereum uses secp256k keys while tendermint relies on ed25119 keys.
const addValidatorSignatoryKey = async (sidechain, validatorKeys, signatoryPublicKey) => {
  if (!secp.publicKeyVerify(signatoryPublicKey)) {
    throw Error("Invalid signatory public key")
  }

  let validators = convertValidatorsObjectFormat(sidechain.validators)
  let signatorySet = getSignatorySet(validators)
  let signatoryIndex = findSignatoryIndex(signatorySet, validatorKeys)
  let signature = crypto.SignEd25519(validatorKeys, signatoryPublicKey)

  let response = await client.send({
    type: "ADD_VALIDATOR_SIGNATORY_KEY",
    signatoryIndex,
    signatoryKey: signatoryPublicKey,
    signature
  })

  //TODO handle response
  console.log(response)
}

// To unlock tokens on the Ethereum chain, 2/3 of the validator voting power must
// sign the withdrawal
const signWithdrawal = async(sidechain, signatoryKeys) => {
  let signatoryPrivateKey = signatoryKeys.signatoryPrivateKey
  let validators = convertValidatorsObjectFormat(client.validators)
  let signatorySet = getSignatorySet(validators)
  let signatoryIndex = findSignatoryIndex(signatorySet, validator)

  let pendingWithdrawalTx = await sidechain.state.pendingWithdrawalTx
  if (pendingWithdrawalTx == null) {
    console.log('No transaction to be signed')
    return
  }

  let hash = utils.solidityKeccak256(
    ["bytes", "bytes", "uint256"],
    [to, tokenAddress, amount]
  )

  let signature = secp256k1.sign(hash, signatoryPrivateKey)
  let response = await sidechain.send({
    type: 'SIGN_WITHDRAWAL',
    signatoryIndex,
    signature
  })

  //TODO handle response properly
  console.log(response)
}



const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))


start()