import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

const Accounts = ({ accounts }) => {
  return (
    <div>
      Account List:
      {
        Object.keys(accounts).map(address => (
          <div key={address}>{accounts[address].name} - Balance: {accounts[address].balance} - Sequence: {accounts[address].sequence} </div>
        ))
      }
    </div>
  )
}


const mapStateToProps = state => {
  console.log('Account state', state)
  return {
    accounts: state.accounts
  }
}

const ConnectedAccounts = connect(
  mapStateToProps,
  null
)(Accounts)

export default ConnectedAccounts
