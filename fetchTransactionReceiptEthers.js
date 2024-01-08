const fs = require('fs')
const { readJsonFile, writeJsonFile } = require('./fileUtils.js')

module.exports = async function (provider, transactionId) {
  const cacheFilePath = `./cache/tx_e_receipt_${transactionId}.json`
  if (fs.existsSync(cacheFilePath)) {
    const transaction = await readJsonFile(cacheFilePath)
    return transaction
  }

  const transaction = await provider.getTransactionReceipt(transactionId)
  if (transaction) {
    // console.log({ transaction })
    await writeJsonFile(cacheFilePath, transaction)
  } else {
    console.error(`Couldn't fetch transaction receipt data for ${transactionId}`)
    console.error(response)
  }
  return transaction
}
