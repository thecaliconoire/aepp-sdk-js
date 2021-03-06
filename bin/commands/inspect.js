#!/usr/bin/env node
// # æternity CLI `inspect` file
//
// This script initialize all `inspect` function
/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

import * as R from 'ramda'
import path from 'path'

import { HASH_TYPES } from '../utils/constant'
import { initClient } from '../utils/cli'
import { handleApiError } from '../utils/errors'
import {
  print,
  printBlock,
  printBlockTransactions,
  printContractDescr,
  printError,
  printName,
  printTransaction,
  printUnderscored
} from '../utils/print'
import { checkPref, getBlock, readJSONFile } from '../utils/helpers'

// ## Inspect function
// That function get the param(`hash`, `height` or `name`) and show you info about it
async function inspect (hash, option) {
  if (!hash) throw new Error('Hash required')

  // Get `block` by `height`
  if (!isNaN(hash)) {
    await getBlockByHeight(hash, option)
    return
  }

  const [pref, _] = hash.split('_')
  switch (pref) {
    // Get `block` by `hash`
    case HASH_TYPES.block:
      await getBlockByHash(hash, option)
      break
    // Get `micro_block` by `hash`
    case HASH_TYPES.micro_block:
      await getBlockByHash(hash, option)
      break
    // Get `account` by `hash`
    case HASH_TYPES.account:
      await getAccountByHash(hash, option)
      break
    // Get `transaction` by `hash`
    case HASH_TYPES.transaction:
      await getTransactionByHash(hash, option)
      break
    // Get `name`
    default:
      await getName(hash, option)
      break
  }
}

// ## Inspect helper function's
async function getBlockByHash (hash, options) {
  const { json } = options
  try {
    checkPref(hash, [HASH_TYPES.block, HASH_TYPES.micro_block])
    const client = await initClient(options)
    await handleApiError(
      async () => printBlock(
        await getBlock(hash)(client),
        json
      )
    )
  } catch (e) {
    printError(e.message)
  }
}

async function getTransactionByHash (hash, options) {
  const { json } = options
  try {
    checkPref(hash, HASH_TYPES.transaction)
    const client = await initClient(options)
    await handleApiError(
      async () => printTransaction(await client.tx(hash), json)
    )
  } catch (e) {
    printError(e.message)
  }
}

async function getAccountByHash (hash, options) {
  const { json } = options
  try {
    checkPref(hash, HASH_TYPES.account)
    const client = await initClient(options)
    await handleApiError(
      async () => {
        const {balance, id, nonce} = await client.api.getAccountByPubkey(hash)
        printUnderscored('Account ID', id)
        printUnderscored('Account balance', balance)
        printUnderscored('Account nonce', nonce)
        print('Account Transactions: ')
        printBlockTransactions((await client.api.getPendingAccountTransactionsByPubkey(hash)).transactions, json)
      }
    )
  } catch (e) {
    printError(e.message)
  }
}

async function getBlockByHeight (height, options) {
  const { json } = options
  height = parseInt(height)
  try {
    const client = await initClient(options)

    await handleApiError(
      async () => printBlock(await client.api.getKeyBlockByHeight(height), json)
    )
  } catch (e) {
    printError(e.message)
  }
}

async function getName (name, options) {
  const { json } = options
  try {
    if (R.last(name.split('.')) !== 'aet') throw new Error('AENS TLDs must end in .aet')
    const client = await initClient(options)
    const nameStatus = await client.api.getNameEntryByName(name)
    printName(Object.assign(nameStatus, { status: 'CLAIMED' }), json)
  } catch (e) {
    if (e.response && e.response.status === 404) {
      printName({ status: 'AVAILABLE' }, json)
    } else {
      printError(e.message)
    }
  }
}

async function getContractByDescr (descrPath, options) {
  const { json } = options
  try {
    const descriptor = await readJSONFile(path.resolve(process.cwd(), descrPath))
    const client = await initClient(options)

    await handleApiError(
      async () => {
        printContractDescr(descriptor, json)
        printTransaction(await client.tx(descriptor.transaction), json)
      }
    )
  } catch (e) {
    printError(e.message)
  }
}

export const Inspect = {
  inspect
}
