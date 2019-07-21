let { PegZoneABI, PegZoneAddress } = require('')
let connect = require('lotion-connect')


class Relayer {

  async constructor(chainId) {
    this.sidechain = await connect(chainId)
  }

    // Listen to lock events on the Ethereum chain (lock on Ethereum = deposit on Tendermint sidechain), and broadcasts
  // the corresponding deposit to the Tendermint sidechain.
  async handleDeposits() {
    contract.on("Lock", (receiverAddress, tokenAddress, amount, event) => {
      //TODO add merkle proof that attests the event really happened (or something like this)
      let tx = {
        type: "DEPOSIT",
        receiverAddress,
        tokenAddress,
        amount,
        blockHash: event.blockHash,
        txHash: event.transactionHash,
        txData: event.txData
      }

      await this.broadcastDeposits(tx)
    })
  }

  // Periodically check whether a withdrawal transaction needs to be broadcasted
  // TODO replace by a subscription
  async handleWithdrawals() {
    while(true) {
      try {
        await this.relayWithdrawal()
        console.log('Relayed withdrawal')
      } catch (e) {
        console.log(e.message)
      }

      await delay(30000)
    }
  }

  // Periodically check whether the validator set on the Tendermint sidechain has changed to
  // update it the corresponding signatory set on the Ethereum chain if needed.
  // TODO replace by a subscription
  async handleValidatorSetUpdates() {
    while (true) {
      try {
        await this.relayUpdateValidatorSet()
      } catch (e) {
        console.log(e.message)
      }


      await delay(30000)
    }
  }

  //not implemented yet
  async relayHeaders() {

  }

  //not implemented yet
  async relayBlock() {

  }

  // Queries withdrawal transactions on the sidechain. If a withdrawalTx is found, it is broadcasted
  // on the Ethereum chain.
  async relayWithdrawal() {
    let withdrawalTx = await this.sidechain.state.withdrawalTx
    if (!withdrawalTx) return

    vs = withdrawalTx.signatures.map(sig => sig.v)
    rs = withdrawalTx.signatures.map(sig => sig.r)
    ss = withdrawalTx.signatures.map(sig => sig.s)
    signers = withdrawalTx.signers
    receiverAddress = withdrawalTx.to
    tokenAddress = withdrawalTx.tokenAddress
    amount = withdrawalTx.amount

    await this.broadcastUnlockTx(receiverAddress, tokenAddress, amount, signers, vs, rs, ss)
  }

  // Queries the set of signatoryKeys on the sidechain and uses it to update the signatory set on the Ethereum chain.
  async relayUpdateValidatorSet() {
    let keys = Object.keys(this.sidechain.state.signatoryKeys)
    // We compute ethereum addresses from the signatory keys (which are pub keys)
    let addresses = keys.map(key => utils.computeAddress(key))
    // We set the power of each validator to 1
    let powers = Array.apply(null, addresses.length).map(() => 1);

    let hash = utils.solidityKeccak256(
      ["bytes[]", "uint64[]"],
      [addresses, powers]
    )

    let vs = []
    let rs = []
    let ss = []
    let signers = []
    keys.map(key => {
      let { signatoryKey, signatoryIndex, signature } = key
      let { r, s, v } = utils.splitSignature(signature)
      vs.push(v)
      rs.push(r)
      ss.push(s)
      signers.push(signatoryIndex)
    })

    await this.broadcastUpdateValidatorSetTx(newAddresses, newPowers, signers, vs, rs, ss)
  }

  // Broadcast a deposit transaction to the Tendermint sidechain.
  async broadcastDeposits(tx) {
    let response = await this.sidechain.send(tx)

    //TODO handle response correctly
    console.log(response)
  }

  // Broadcasts an unlock (or also known as withdrawal) on the Ethereum chain.
  // - receiverAddress: Ethereum address to which tokens will be sent
  // - tokenAddress: Ethereum token address
  // - amount: Amount of tokens to be sent
  // - signers: Array of signatory indexes
  // - vs, rs, ss: Signatures (in split format) of keccak256(receiverAddress, tokenAddress, amount) by the signatory keys (secp256k1)
  async broadcastUnlockTx(receiverAddress, tokenAddress, amount, signers, vs, rs, ss) {
      let provider = ethers.getDefaultProvider('rinkeby');
      let pegzone = new ethers.Contract(PegZoneAddress, PegZoneABI, provider);
      let pendingTx = await pegzone.unlock(receiverAddress, tokenAddress, amount, signers, vs, rs, ss)
      let txReceipt = await pendingTx.wait()

      // TODO Handle error or console.log if receipt status is 0
      console.log(txReceipt)
  }

  // Broadcasts the validator set update on the Ethereum chain. The payload is an array of
  // addresses that represent validators on the Ethereum chain, an array of associated powers
  // (currently 1) and an array of a signature. Each signature is a hash of the ethereum address
  // (+ power) of a validator.
  async broadcastUpdateValidatorSetTx(newAddresses, newPowers, signers, vs, rs, ss) {
    let provider = ethers.getDefaultProvider('rinkeby')
    let pegzone = new ethers.Contract(PegZoneAddress, PegZoneABI, provider)
    let pendingTx = await pegzone.update(newAddresses, newPowers, signers, vs, rs, ss)
    let txREceipt = await pendingTx.wait()

    // Handle error or console.log if receipt status is 0
    console.log(txReceipt)
  }

  start() {
    this.handleDeposits()
    this.handleValidatorSetUpdates()
    this.handleWithdrawals()
  }
}

module.exports = Relayer