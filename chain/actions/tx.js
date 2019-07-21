let initializeAction = () => {
  return {
    type: 'INITIALIZE'
  }
}

let sendTxAction = (tx) => {
  return {
    type: 'TX',
    level: 'chain',
    payload: {
      tx
    }
  }
}

module.exports = {
  initializeAction,
  sendTxAction
}