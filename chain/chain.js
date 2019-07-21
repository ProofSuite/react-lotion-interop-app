let lotion = require('lotion')
let fs = require('fs')
let reducer = require('./reducers')
let { generateAccounts } = require('./utils/helpers/common')
let accounts = generateAccounts()

let initialState = {
  chain: [],
  signatoryKeys: {},
  processedTxs: {},
  accounts,
  withdrawals: [],
  pendingWithdrawal: null,
  withdrawal: null,
  prevWithdrawal: null
}

let app = lotion({
  initialState,
  logTendermint: false,
  p2pPort: 64339,
  rpcPort: 64340
})

app.start().then((appInfo) => {
  console.log('\n')
  console.log('Chain ID:', appInfo.GCI)
  console.log('Genesis Path:', appInfo.genesisPath)
  console.log(appInfo)
  let genesisString = fs.readFileSync(appInfo.genesisPath, 'utf8')
  let genesis = JSON.parse(genesisString)
  let chainId = appInfo.GCI
  let config = { chainId, genesis }
})

app.use(reducer)

// app.use((state, tx, context) => {
//   console.log(context)
// })

// console.log(app)




// const lotion = require('lotion')
// const secp256k1 = require('secp256k1')
// const { randomBytes } = require('crypto')
// const { SignEd25519 } = require('./chain/utils/crypto')

// const privKey = randomBytes(32)
// const pubKeySecp256k1 = secp256k1.publicKeyCreate(privKey)

// const privKeyString = privKey.toString('hex')
// const pubKeySecp256k1String = pubKeySecp256k1.toString('hex')

// console.log(privKeyString)
// console.log(pubKeySecp256k1String)


// let app = lotion({
//   initialState: {
//     counter: {
//       count: 0
//     }
//   },
//   logTendermint: false,
//   p2pPort: 64339,
//   rpcPort: 64340
// })


// app.start().then((appInfo) => {
//   console.log('\n')
//   console.log('Chain ID:', appInfo.GCI)
//   console.log('Genesis Path:', appInfo.genesisPath)

//   let genesisString = fs.readFileSync(appInfo.genesisPath, 'utf8')
//   let genesis = JSON.parse(genesisString)
//   let chainId = appInfo.GCI
//   let config = { chainId, genesis }

//   fs.writeFileSync('../app/src/config.json', JSON.stringify(config))
// })