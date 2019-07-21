import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { actions } from '@proofsuite/coinchain'
import Wallet from '../utils/wallet'

class SendTxForm extends Component {
  state = {
    amount: 0,
    senderPrivateKey: '',
    receiverAddress: ''
  }

  handleChangeAmount = (event) => {
    this.setState({ amount: event.target.value })
  }

  handleChangeReceiverAddress = (event) => {
    this.setState({ receiverAddress: event.target.value })
  }

  handleChangeSenderPrivateKey = (event) => {
    this.setState({ senderPrivateKey: event.target.value })
  }

  handleSend = async (event) => {
    let { amount, senderPrivateKey, receiverAddress } = this.state
    let { accounts } = this.props
    amount = Number(amount)
    let wallet = new Wallet(senderPrivateKey, accounts)

    let tx = await wallet.buildTransaction(receiverAddress, amount)
    this.props.sendTx(tx)
  }

  render() {
    return (
      <div>
          <div>Amount: <input type="number" name="amount" onChange={this.handleChangeAmount} /></div>
          <div>Receiver Address: <input type="text" name="receiverAddress" onChange={this.handleChangeReceiverAddress} /></div>
          <div>Sender Private Key: <input type="text" name="senderPrivateKey" onChange={this.handleChangeSenderPrivateKey} /></div>
          <button type="submit" onClick={this.handleSend}>Send Transaction</button>
      </div>
    )
  }
}


const mapDispatchToProps = (dispatch) => ({
  sendTx: (senderAddress, receiverAddress, amount) => {
    dispatch(actions.sendTxAction(senderAddress, receiverAddress, amount))
  }
})

const mapStateToProps = state => {
  return {
    accounts: state.accounts
  }
}


const ConnectedSendTxForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(SendTxForm)

export default ConnectedSendTxForm
