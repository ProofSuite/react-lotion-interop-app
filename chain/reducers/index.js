let {
  handleInitialize,
  handleTx,
  handleHeadersTx,
  handleDepositTx,
  handleAddValidatorSignatoryKey,
  handleSignWithdrawal
} = require('./handlers')

let {
  validateInput,
  validateOutput,
  validateAmounts,
  validateFee,
  validateAccountInterface
} = require('../utils/validate')

function reducer (state, action) {
  let { type, payload } = action
  let newState

  switch(type) {
    case 'INITIALIZE':
      newState = handleInitialize(state, payload)
      return newState
    case 'TX':
      newState = handleTx(state, payload)
      return newState
    case 'HEADERS':
      newState = handleHeadersTx(state, payload)
      return newState
    case 'DEPOSIT':
      newState = handleDepositTx(state, payload)
      return newState
    case 'ADD_VALIDATOR_SIGNATORY_KEY':
      newState = handleAddValidatorSignatoryKey(state, payload)
      return newState
    case 'SIGN_WITHDRAWAL':
      newState = handleSignWithdrawal(state, payload)
      return newState
    default:
      return state
  }
}

module.exports = reducer