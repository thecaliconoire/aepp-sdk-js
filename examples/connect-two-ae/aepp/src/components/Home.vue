<template>
  <div class="w-full p-4 flex flex-col">
    <h1 class="mb-4">Your Aepp</h1>

    <div class="border">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Public Key <small>(from Identity Aepp)</small>
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{pub}}
        </div>
        <div v-if="!pub" class="p-2 w-3/4 bg-grey-lightest break-words text-grey">
          Requesting Public Key from AE Wallet...
        </div>
      </div>
      <div v-if="height" class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Height
        </div>
        <div class="p-2 w-3/4 bg-grey-lightest">
          {{height}}
        </div>
      </div>
    </div>

    <h2 class="mt-4">Compile Contract</h2>

    <div class="border mt-4 rounded">
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Contract By
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-white break-words">
          {{pub}}
        </div>
        <div v-if="!pub" class="p-2 w-3/4 bg-grey-lightest break-words text-grey">
          Requesting Public Key from AE Wallet...
        </div>
      </div>
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Contract Code
        </div>
        <div class="p-2 w-3/4 bg-white">
          <textarea class="bg-black text-white border-b border-black p-2 w-full h-64" v-model='contractCode' placeholder="contact code"/>
        </div>
      </div>
      <button v-if="client" class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs" @click='onCompile'>
        Compile
      </button>
    </div>

    <div v-if="byteCode" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Compiled Code
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{byteCode}}
        </div>
      </div>
    </div>
    <button v-if="byteCode" class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs" @click='onDeploy'>
      Deploy
    </button>

    <div v-if="deployInfo" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Deployed Contract
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{ deployInfo }}
        </div>
      </div>
    </div>
    <button v-if="deployInfo" class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs" @click='onCall'>
      Call
    </button>

    <div v-if="callResult" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Deployed Contract
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{ callResult }}
        </div>
      </div>
    </div>


  </div>
</template>

<script>
// AE_SDK_MODULES is a webpack alias present in webpack.config.js
import Aepp from '../../../../../es/ae/aepp'
// import Contract from 'AE_SDK_MODULES/ae/contract.js'
// import Universal from 'AE_SDK_MODULES/ae/universal.js'
// import Wallet from 'AE_SDK_MODULES/ae/wallet.js'
// import server from 'AE_SDK_MODULES/rpc/server.js'
// console.log(server)

export default {
  name: 'Home',
  components: {},
  data () {
    return {
      // get from secure storage
      client: null,
      abi: 'sophia',
      to: null,
      amount: null,
      height: null,
      pub: null,
      callResult: null,
      contractCode: `contract Identity =
  type state = ()
  function main(x : int) = x`,
      byteCode: null,
      contractInitState: '()',
      deployInfo: null
    }
  },
  computed: {
  },
  methods: {
    send () {},
    async compile (code) {
      console.log(`Compiling contract...`)
      try {
        return await this.client.contractCompile(code)
      } catch (err) {
        this.compileError = err
        console.error(err)
      }
    },
    async deploy (code, options = {}) {
      console.log(`Deploying contract...`)
      try {
        return await this.client.contractDeploy(this.byteCode, this.abi, { initState: this.contractInitState, options })
      } catch (err) {
        this.deployErr = err
        console.error(err)
      }
    },
    async call (code, abi, contractAddress, method = 'main', returnType = 'int', args = '(5)', options = {}) {
      console.log(`Deploying contract...`)
      try {
        const { result } = await this.client.contractCall(this.byteCode, this.abi, this.deployInfo.address, method, { args: args, options })
        return Object.assign(
          result,
          { decodedRes: await this.client.contractDecodeData(returnType, result.returnValue) }
        )
      } catch (err) {
        this.deployErr = err
        console.error(err)
      }
    },
    onCompile () {
      this.compile(this.contractCode)
        .then(byteCodeObj => {
          this.byteCode = byteCodeObj.bytecode
        })
    },
    onDeploy (options = {}) {
      this.deploy(this.byteCode, options)
        .then(deployedContract => {
          this.deployInfo = deployedContract
        })
    },
    onCall (options = {}) {
      this.call(this.byteCode)
        .then(callRes => {
          console.log(callRes)
          this.callResult = callRes
        })
    }
  },
  created () {
    Aepp({
      url: 'https://sdk-edgenet.aepps.com',
      internalUrl: 'https://sdk-edgenet.aepps.com'
    }).then(ae => {
      console.log('client: ', ae)
      this.client = ae
      ae.address()
        .then(address => {
          this.pub = address
        })
        .catch(e => { this.pub = `Rejected: ${e}` })

      // ae.contractCompile(this.contractCode)
      //   .then(bytecode => {
      //     this.bytecode = bytecode.bytecode
      //     console.log('compiled --> ', bytecode)
      //     return ae.contractDeploy(bytecode.bytecode, 'sophia', {})
      //   })
      //   .then(contract => {
      //     console.log('deployed contract --->')
      //     console.log(contract)
      //     return ae.contractCall(this.bytecode, 'sophia', contract.address, 'main', { args: '(5)', options: {} })
      //   })
      //   .then(callRes => console.log(callRes))
      //   .catch(e => console.log(e))
    })
  }
}
</script>

<style scoped lang="css">
</style>
