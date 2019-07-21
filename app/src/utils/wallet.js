let secp = require('secp256k1')
let { getSigHash, addressHash } = require('./common')

class Wallet {
  constructor (privkey, accounts) {
    this.accounts = accounts
    this.privkey = Buffer.from(privkey, "hex")

    if (!Buffer.isBuffer(this.privkey) || this.privkey.length !== 32) {
      console.log('Invalid private key')
    }

    this.pubkey = secp.publicKeyCreate(this.privkey)
    this._address = getAddress(this.pubkey)
  }

  address () {
    return this._address
  }

  async balance () {
    let account = await this.accounts[this._address]
    if (account == null) return 0

    return account.balance
  }

  async buildTransaction (to, amount) {
    if (typeof to !== 'string') throw Error('"to" must be a string')
    if (!Number.isInteger(amount)) throw Error('"amount" must be an integer')

    // get our account sequence number
    let account = this.accounts[this._address]

    // build tx
    let tx = {
      from: [{
        amount,
        sequence: account ? account.sequence : 0,
        pubkey: this.pubkey
      }],
      to: [{
        amount: amount,
        address: to
      }]
    }

    // sign tx
    let sigHash = getSigHash(tx)
    tx.from[0].signature = secp.sign(sigHash, this.privkey).signature

    // broadcast tx
    return tx
  }
}

function getAddress (pubKey) {
  return addressHash(pubKey)
}

module.exports = Wallet
