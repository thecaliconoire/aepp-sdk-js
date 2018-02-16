/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
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

const utils = require ('../utils')

const chai = require ('chai')
const assert = chai.assert


describe ('Http service aens', () => {
  describe ('name claim', () => {
    it ('should result in a claimed name', async function () {
      this.timeout(utils.TIMEOUT)
      let name = utils.randomAeName()
      let salt = 1234
      let commitment = await utils.httpProvider1.aens.getCommitmentHash (name, salt)
      assert.ok (commitment)
      // preclaim the domain
      let pleclaimHash = await utils.httpProvider1.aens.preClaim(commitment, 1)
      assert.equal(commitment, pleclaimHash)
      // wait one block
      await utils.httpProvider2.base.waitNBlocks(1)
      // claim the domain
      let nameHash = await utils.httpProvider1.aens.claim(name, salt, 1)

      await utils.httpProvider2.base.waitNBlocks(1)
      let nameData = await utils.httpProvider1.aens.getName(name)
      console.log(`name data ${JSON.stringify(nameData)}`)
      assert.ok(nameData)
      assert.equal(nameHash, nameData['name_hash'])
    })
  })
})
