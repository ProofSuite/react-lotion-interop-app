let ed25519 = require('supercop.js')
let ed25519Account = require('../utils/accounts/ed25519Account.js')
let secp256k1Account = require('../utils/accounts/secp256k1Account.js')
let multisigAccount = require('../utils/accounts/multisigAccount.js')
let { getSigHash, generateRandomName } = require('../utils/helpers/common')

let accountTypes = {
  ed25519: ed25519Account,
  secp256k1: secp256k1Account,
  multisig: multisigAccount
}

function balancesReducer (state, action) {
  let { type, payload } = action
  let newState

  switch(type) {
    case 'INITIALIZE':
      newState = handleInitialize(state, payload)
      return newState
    case 'TX':
      newState = handleTx(state, payload)
      return newState
    default:
      return state
  }
}

function handleInitialize (state, payload) {
  let { opts } = payload
  let { initialBalances } = opts

  let newState = { ...state }
  for (let address in initialBalances) {
    newState.accounts[address] = { sequence: 0, balance: initialBalances[address] }
  }

  return { ...newState }
}

// run every time there is a tx routed to this coin
function handleTx (state, payload) {
  let { tx } = payload

  if (tx.from == null || tx.to == null) {
    return { ...state, error:  'Not a valid transaction, must have "to" and "from"' }
  }

  let inputs = tx.from
  let outputs = tx.to

  for (let input of inputs) {
    let error = validateInput(input)
    if (error) {
      return { ...state, error }
    }
  }

  for (let output of outputs) {
    let error = validateOutput(output)
    if (error) {
      return { ...state, error }
    }
  }

  let error = validateAmounts(inputs, outputs)
  if (error) {
    return { ...state, error }
  }

  let minFee = 0
  error = validateFee(outputs, minFee)
  if (error) {
    return { ...state, error }
  }

  let txHash = getSigHash(tx)
  let newAccounts = {}

  // process inputs
  for (let input of inputs) {
    let { amount, sequence, signature, accountType } = input

    if (!Number.isInteger(sequence)) {
      let error = 'Sequence number must be an integer'
      return { ...state, error }
    }

    if (accountType && typeof accountType !== 'string') {
      let error = 'Account type must be a string'
      return { ...state, error }
    }

    if (!accountType) {
      accountType = 'secp256k1'
    }

    let accountInterface = accountTypes[accountType]
    if (accountInterface == null) {
      let error = `Unknown account type ${accountType}`
      return { ...state, error }
    }

    let address = accountInterface.getAddress(input)
    let account = { ...state.accounts[address] }
    if (account == null) {
      let error = `Non-existent account ${address}`
      return { ...state, error }
    }

    // verify account balance/sequence
    if (account.balance < amount) {
      let error = 'Insufficient funds'
      return { ...state, error }
    }

    if (sequence !== account.sequence) {
      let error = 'Sequence number mismatch'
      return { ...state, error }
    }

    // should throw if input is not allowed to spend
    let error = accountInterface.verifySignature(input, txHash)
    if (error) {
      return { ...state, error }
    }

    // debit account
    newAccounts[address] = {
      ...state.accounts[address],
      balance: state.accounts[address].balance - amount,
      sequence: state.accounts[address].sequence + 1
    }
  }

  // process outputs
  for (let output of outputs) {
    let { address, amount } = output
    if (typeof address !== 'string') {
      let error = 'Address is required'
      return { ...state, error }
    }

    if (!Number.isSafeInteger(amount)) {
      let error  = 'Invalid amount'
      return { ...state, error }
    }

    if (newAccounts[address] == null) {
      newAccounts[address] = {
        ...state.accounts[address],
        name: generateRandomName(),
        balance: 0,
        sequence: 0,
        address
      }
    }

    if (!Number.isSafeInteger(newAccounts[address].balance)) {
      let error = 'Error adding to account balance'
      return { ...state, error }
    }

    newAccounts[address] = {
      ...state.accounts[address],
      balance: state.accounts[address].balance + amount,
    }
  }

  return {
    ...state,
    accounts: {
      ...state.accounts,
      ...newAccounts,
    }
  }
}


function validateInput (input) {
  if (input.amount < 0) {
    return 'Amount must be >= 0'
  }

  if (!Number.isInteger(input.amount)) {
    return 'Amount must be an integer'
  }

  if (!Number.isSafeInteger(input.amount)) {
    return 'Amount must be < 2^53'
  }

  return null
}

function validateOutput (output) {
  if (output.amount < 0) {
    return 'Amount must be >= 0'
  }

  if (!Number.isInteger(output.amount)) {
    return 'Amount must be an integer'
  }

  if (!Number.isSafeInteger(output.amount)) {
    return 'Amount must be < 2^53'
  }

  return null
}

function validateAmounts(inputs, outputs) {
  let inputAmount = inputs.reduce((sum, { amount }) => sum + amount, 0)
  let outputAmount = outputs.reduce((sum, { amount }) => sum + amount, 0)

  if (outputAmount !== inputAmount) {
    return 'Amounts must be equal'
  }

  return null
}

function validateFee(outputs, minFee) {
  if (minFee === 0) return null
  // if minFee specified, last output must be type "fee"
  let lastOutput = outputs[outputs.length - 1]
  if (lastOutput.type !== 'fee') {
    return 'Must pay fee'
  }
  if (lastOutput.amount < minFee) {
    return `Must pay fee of at least ${minFee}`
  }

  return null
}

function validateAccountInterface ({ onSpend, getAddress }) {
  if (typeof onSpend !== 'function') {
    return 'Account interface must specify an onSpend function'
  }

  if (typeof getAddress !== 'function') {
    return 'Account interface must specify a getAddress function'
  }

  return null
}


module.exports = balancesReducer
