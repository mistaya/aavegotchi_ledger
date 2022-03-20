const fs = require('fs')
const axios = require('axios')
const { readJsonFile, writeJsonFile } = require('./fileUtils.js')

// This API_KEY is registered for use by this aavegotchi_ledger tool
// It's free to get API_KEYs from https://www.covalenthq.com
const API_KEY = 'ckey_37f8f3ef86fb4d97a9a5b8f382f'

const chainId = 137
const chainAsset = 'MATIC'

module.exports = function (transactionId) {
  return new Promise(async (resolve, reject) => {
    const cacheFilePath = `./cache/tx_${transactionId}.json`
    if (fs.existsSync(cacheFilePath)) {
      const transaction = await readJsonFile(cacheFilePath)
      resolve(transaction)
    } else {
      var url = `https://api.covalenthq.com/v1/${chainId}/transaction_v2/${encodeURIComponent(transactionId)}/?&key=${encodeURIComponent(API_KEY)}`
      axios.get(url).then(
        async (response) => {
          // console.log({ response })
          const transaction = response.data?.data?.items[0]
          if (transaction) {
            // console.log({ transaction })
            await writeJsonFile(cacheFilePath, transaction)
            resolve(transaction)
          } else {
            console.error(response)
            reject(new Error("Couldn't fetch transaction data"))
          }
        },
        (error) => {
          console.error(error)
          reject(error && error.message)
        }
      )
    }
  })
}