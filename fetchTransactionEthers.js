const fs = require('fs')
const { readJsonFile, writeJsonFile } = require('./fileUtils.js')

module.exports = async function (provider, transactionId) {
  const cacheFilePath = `./cache/tx_e_${transactionId}.json`
  if (fs.existsSync(cacheFilePath)) {
    const transaction = await readJsonFile(cacheFilePath)
    return transaction
  }

  const transaction = await provider.getTransaction(transactionId)
  if (transaction) {
    // console.log({ transaction })
    await writeJsonFile(cacheFilePath, transaction)
  } else {
    console.error(response)
    console.error(`Couldn't fetch transaction data for ${transactionId}`)
  }
  return transaction
}
