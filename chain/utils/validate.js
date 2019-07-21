
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

module.exports = {
  validateInput,
  validateOutput,
  validateAmounts,
  validateFee,
  validateAccountInterface
}