// converts validator set from Tendermint RPC format
// to Lotion {<pubkeyB64>: <votingPower>, ...} object
function convertValidatorsObjectFormat (validators) {
  return validators.reduce((obj, v) => {
    obj[v.pub_key.value] = v.voting_power
    return obj
  }, {})
}

function getSignatorySet (validators) {
  return Object.entries(validators)
                      .sort((a,b) => b[1] - a[1])
                      .map(([ validatorKey, votingPower ]) => { validatorKey, votingPower })
}

function getVotingPowerThreshold (signatories) {
  let totalVotingPower = signatories.reduce((sum, s) => sum + s.votingPower, 0)
  let twoThirdsVotingPower = Math.ceil(totalVotingPower * 2 / 3)
  return twoThirdsVotingPower
}

function findSignatoryIndex(signatorySet, validatorKeys) {
  let signatoryIndex
  for (let i = 0; i < signatorySet.length; i++) {
    let signatory = signatorySet[i]
    if (signatory.validatorKey = validatorKeys.validatorPublicKey) {
      signatoryIndex = i
      break
    }
  }

  if (signatoryIndex == null) {
    throw Error('Given validator key not found in validator set')
  }

  return signatoryIndex
}


module.exports = {
  getSignatorySet,
  findSignatoryIndex,
  convertValidatorsObjectFormat,
  getVotingPowerThreshold
}