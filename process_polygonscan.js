const BigNumber = require('bignumber.js')
const { readJsonFile, readCsvFile, writeJsonFile } = require('./fileUtils.js')
const fetchTransaction = require('./fetchTransaction.js')
const ethers = require('ethers')
// Don't use exponential notation
BigNumber.config({ EXPONENTIAL_AT: [-100, 100] })

const ERC1155_PRICES_FILENAME = './prices/erc1155Prices.json'

const ADDRESS_TO_TOKEN = {
  '0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7': 'GHST',
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'USDT',
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 'USDC',
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': 'DAI',
  '0x1a13f4ca1d028320a707d99520abfefca3998b7f': 'amUSDC',
  '0x1d2a0e5ec8e5bbdca5cb219e649b565d8e5c3360': 'amAAVE',
  '0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4': 'amWMATIC',
  '0x28424507fefb6f7f8e9d3860f56504e4e5f5f390': 'amWETH',
  '0x8c8bdbe9cee455732525086264a4bf9cf821c498': 'maUNI',
  '0x6e14790535c04b1a58592fbee6109d9bc57a51ad': 'VLT',
  '0xce899f26928a2b21c6a2fddd393ef37c61dba918': 'MOCA',
  '0xe4fb1bb8423417a460286b0ed44b64e104c5fae5': 'Scam_Token_Zepe',
  '0x81067076dcb7d3168ccf7036117b9d72051205e2': 'Scam_Token_DxDex',
  '0x4a1a24542644d77b34497de7f218d63cb4d36e0f': 'Scam_Token_YUI',
  '0x8ae127d224094cb1b27e1b28a472e588cbcc7620': 'Scam_Token_AAX',
  '0x0364c8dbde082372e8d6a6137b45613dd0f8138a': 'Scam_Token1',
  '0xa39b14f57087aa5f16b941e5ec182b84a5432aa7': 'Scam_Token2',
  '0x9e2d266d6c90f6c0d80a88159b15958f7135b8af': 'Scam_Token_SSX',
  '0x2744861accb5bd435017c1cfee789b6ebab42082': 'Scam_Token_AeFX',
  '0x0b91b07beb67333225a5ba0259d55aee10e3a578': 'Scam_Token_Minereum1',
  '0xecdff6fd2f184f8b8987682a10aa6890ca74c5a8': 'Scam_Token_Minereum2',
  '0xa85f8a198d59f0fda82333be9aeeb50f24dd59ff': 'Scam_Token_FlowDAO',
  '0xd7f1d4f5a1b44d827a7c3cc5dd46a80fade55558': 'Scam_Token_Zers',
  '0x22e51bae3f545255e115090202a23c7ede0b00b9': 'Scam_Token_LELX',
  '0x14f2c84a58e065c846c5fdddade0d3548f97a517': 'Scam_Token_MATICSWAP'
}

const ADDRESS_TO_CONTRACT = {
  '0x86935f11c86623dec8a25696e1c19a8659cbf95d': 'Aavegotchi', // Portals, Gotchi, Wearables
  '0xa02d547512bb90002807499f05495fe9c4c3943f': 'GotchiStaking', // Staking, Raffle tickets
  '0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11': 'GotchiRealm', // Parcels
  '0x75c8866f47293636f1c32ecbcd9168857dbefc56': 'GotchiAirdrops', // Claimable airdrops: H1 bg, Drop tickets
  '0x6c723cac1e35fe29a175b287ae242d424c52c1ce': 'GotchiRaffles', // Raffle submission/claiming
  '0xa44c8e0ecaefe668947154ee2b803bd4e6310efe': 'GotchiGBM_Land', // Land Auction 1 (2021-10) and 2 (2021-12)
  '0x1d86852b823775267ee60d98cbcda9e8d5c2faa7': 'GotchiGBM_2021-07', // Wearables GBM 1
  '0x11111112542d85b3ef69ae05771c2dccff4faa26': '1inch',
  '0x1111111254fb6c44bac0bed2854e76f90643097d': '1inch2',
  '0x8dfdea6a4818d2aa7463edb9a8841cb0c04255af': 'Zapper',
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': 'QuickSwap',
  '0x2953399124f0cbb46d2cbacd8a89cf0599974963': 'OpenSeaCollections'
}

const CONTRACT_TO_ADDRESS = Object.fromEntries(Object.entries(ADDRESS_TO_CONTRACT).map(([id, value]) => [value, id]))

const GBM_CONTRACT_ADDRESSES = [
  CONTRACT_TO_ADDRESS['GotchiGBM_Land'],
  CONTRACT_TO_ADDRESS['GotchiGBM_2021-07']
]

const CONTRACT_ERC721 = {
  '0x86935f11c86623dec8a25696e1c19a8659cbf95d': 'AG-GOTCHI',
  '0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11': 'AG-REALM'
}

const CONTRACT_ERC1155 = {
  '0x86935f11c86623dec8a25696e1c19a8659cbf95d': {
    // wearables will be populated later
  },
  '0xa02d547512bb90002807499f05495fe9c4c3943f': {
    '0': {
      asset: 'AG-STK-0',
      label: 'Common Ticket'
    },
    '1': {
      asset: 'AG-STK-1',
      label: 'Uncommon Ticket'
    },
    '2': {
      asset: 'AG-STK-2',
      label: 'Rare Ticket'
    },
    '3': {
      asset: 'AG-STK-3',
      label: 'Legendary Ticket'
    },
    '4': {
      asset: 'AG-STK-4',
      label: 'Mythical Ticket'
    },
    '5': {
      asset: 'AG-STK-5',
      label: 'Godlike Ticket'
    },
    '6': {
      asset: 'AG-STK-6',
      label: 'Drop Ticket'
    }
  }
}

const importWearables = async function () {
  const wearables = await readJsonFile('./wearables.json')
  console.log(`Found ${wearables.length} wearables`)
  for (const wearable of wearables) {
    CONTRACT_ERC1155['0x86935f11c86623dec8a25696e1c19a8659cbf95d'][`${wearable.id}`] = {
      asset: `AG-WEAR-${wearable.id}`,
      label: wearable.name
    }
  }
}

// TODO
// - match up GBM bids with auction wins/claims. Need to fetch tx details!
// - fetch & calculate NFT prices at relevant dates

module.exports.processExports = async (address, fileExport, fileExportInternal, fileExportERC20, fileExportERC721, fileExportERC1155, filenameOut) => {
  if (!address || !fileExport || !fileExportInternal || !fileExportERC20 || !fileExportERC721 || !fileExportERC1155 || !filenameOut) {
    console.error('Please provide all parameters')
    return
  }
  if ([fileExport, fileExportInternal, fileExportERC20, fileExportERC721, fileExportERC1155].includes(filenameOut)) {
    console.error('Please provide a different output filename')
    return
  }
  address = address.toLowerCase()

  await importWearables()

  const erc1155Prices = await readJsonFile(ERC1155_PRICES_FILENAME)
  const findErc1155Price = function(tokenAddress, tokenId, txDate) {
    const date = txDate.substring(0, txDate.indexOf(' ')) // just want the 'YYYY-MM-DD', assume UTC
    // console.log(`Look up ERC1155 price for ${tokenAddress} ${tokenId} at ${date}`)
    const price = erc1155Prices[tokenAddress]?.[tokenId]?.[date] || null
    if (!price) {
      console.warn(`Couldn't find ERC1155 price for ${tokenAddress} ${tokenId} at ${date}`)
    }
    return price
  }

  const allTransactions = {}
  const initTransaction = function (txId) {
    if (!allTransactions[txId]) {
      allTransactions[txId] = {
        txId,
        main: [],
        internal: [],
        erc20: [],
        erc721: [],
        erc1155: []
      }
    }
  }

  // Import and combine all data

  const transactionColumns = [
    'txId',
    'block',
    'timestamp',
    'date',
    'fromAddress',
    'toAddress',
    'contractAddress',
    'maticValueIn',
    'maticValueOut',
    'currentUsdValue',
    'maticValueFee',
    'usdValueFee',
    'priceUsdMatic',
    'status',
    'errorCode',
    'method'
  ]
  const transactions = await readCsvFile(fileExport, transactionColumns)
  for (const tx of transactions) {
    initTransaction(tx.txId)
    allTransactions[tx.txId].main.push({
      txId: tx.txId,
      date: tx.date,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      contractAddress: tx.contractAddress,
      maticValueIn: cleanExportedNumber(tx.maticValueIn),
      maticValueOut: cleanExportedNumber(tx.maticValueOut),
      maticValueFee: cleanExportedNumber(tx.maticValueFee),
      status: tx.status,
      errorCode: tx.errorCode,
      method: tx.method
    })
  }

  const internalTxColumns = [
    'txId',
    'block',
    'timestamp',
    'date',
    'callerAddress',
    'contractAddress', // contract being called
    'ParentTxETH_Value',
    'fromAddress',
    'toAddress', // own address, when being sent matic
    null, // header says 'ContactAddress' but it's an empty string in export
    'maticValueIn',
    'maticValueOut',
    'currentUsdValue',
    'priceUsdMatic',
    'status',
    'errorCode',
    'type'
  ]
  const internalTxs = await readCsvFile(fileExportInternal, internalTxColumns)
  for (const tx of internalTxs) {
    if (tx.errorCode) {
      console.error(`Internal transaction with errorCode: '${tx.errorCode}' (${tx.txId})`)
    } else {
      initTransaction(tx.txId)
      allTransactions[tx.txId].internal.push({
        txId: tx.txId,
        date: tx.date,
        contractAddress: tx.contractAddress,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        maticValueIn: cleanExportedNumber(tx.maticValueIn),
        maticValueOut: cleanExportedNumber(tx.maticValueOut),
        status: tx.status,
        errorCode: tx.errorCode,
        type: tx.type
      })
    }
  }

  const erc20TxColumns = [
    'txId',
    'timestamp',
    'date',
    'fromAddress',
    'toAddress',
    'tokenValue',
    'tokenContractAddress',
    'tokenName',
    'tokenSymbol'
  ]
  const erc20Txs = await readCsvFile(fileExportERC20, erc20TxColumns)
  for (const tx of erc20Txs) {
    initTransaction(tx.txId)
    allTransactions[tx.txId].erc20.push({
      txId: tx.txId,
      date: tx.date,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      tokenValue: cleanExportedNumber(tx.tokenValue),
      tokenContractAddress: tx.tokenContractAddress,
      token: ADDRESS_TO_TOKEN[tx.tokenContractAddress] || '',
      tokenSymbolFromPolygonscan: tx.tokenSymbol
    })
    if (!ADDRESS_TO_TOKEN[tx.tokenContractAddress]) {
      console.log(`ERC20 transaction for unknown token: ${tx.tokenContractAddress}`)
    }
  }

  const erc721TxColumns = [
    'txId',
    'timestamp',
    'date',
    'fromAddress',
    'toAddress',
    'tokenContractAddress',
    'tokenId',
    'tokenName',
    'tokenSymbol'
  ]
  const erc721Txs = await readCsvFile(fileExportERC721, erc721TxColumns)
  for (const tx of erc721Txs) {
    initTransaction(tx.txId)
    const tokenContract = ADDRESS_TO_CONTRACT[tx.tokenContractAddress] || ''
    if (!tokenContract) {
      console.log(`Unknown ERC721 contract: ${tx.tokenContractAddress}`)
    }
    const assetIdPrefix = CONTRACT_ERC721[tx.tokenContractAddress] || tokenContract
    allTransactions[tx.txId].erc721.push({
      txId: tx.txId,
      date: tx.date,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      tokenValue: cleanExportedNumber(tx.tokenValue),
      tokenContractAddress: tx.tokenContractAddress,
      tokenContract: ADDRESS_TO_CONTRACT[tx.tokenContractAddress] || '',
      tokenId: tx.tokenId,
      assetId: `${assetIdPrefix || 'UNKNOWN'}-${tx.tokenId}`,
      assetLabel: `${assetIdPrefix || 'UNKNOWN'} #${tx.tokenId}`,
      tokenName: tx.tokenName,
      tokenSymbol: tx.tokenSymbol
    })
    if (!ADDRESS_TO_CONTRACT[tx.tokenContractAddress]) {
      console.log(`Unknown ERC721 contract: ${tx.tokenContractAddress}`)
    }
  }

  const erc1155TxColumns = [
    'txId',
    'timestamp',
    'date',
    'fromAddress',
    'toAddress',
    'tokenContractAddress',
    'tokenId',
    'tokenValue',
    'tokenName',
    'tokenSymbol'
  ]
  const erc1155Txs = await readCsvFile(fileExportERC1155, erc1155TxColumns)
  for (const tx of erc1155Txs) {
    initTransaction(tx.txId)
    const tokenContract = ADDRESS_TO_CONTRACT[tx.tokenContractAddress] || ''
    if (!tokenContract) {
      console.log(`Unknown ERC1155 contract: ${tx.tokenContractAddress}`)
    }
    const tokenDetails = CONTRACT_ERC1155[tx.tokenContractAddress]?.[tx.tokenId] || null
    if (!tokenDetails && !(tokenContract && tokenContract.startsWith('Scam_'))) {
      console.log(`Unknown ERC1155 token ID: ${tx.tokenId} in ${tokenContract || tx.tokenContractAddress}`)
    }
    allTransactions[tx.txId].erc1155.push({
      txId: tx.txId,
      date: tx.date,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      tokenContractAddress: tx.tokenContractAddress,
      tokenContract,
      tokenId: tx.tokenId,
      tokenValue: cleanExportedNumber(tx.tokenValue),
      assetId: tokenDetails?.asset || '',
      assetLabel: tokenDetails?.label || '',
      tokenName: tx.tokenName,
      tokenSymbolFromPolygonscan: tx.tokenSymbol
    })
  }

  // Inspect and categorise transactions

  const data = {
    address,
    approvals: [],
    reverted: [],
    deposits: [],
    transfers: [],
    trades: [],
    ghstStaking: [],
    gameActions: [],
    pocketTransfers: [],
    baazaarListings: [],
    baazaarSales: [],
    baazaarPurchases: [],
    gbmBids: [],
    gbmRefunds: [],
    gbmClaims: [],
    gbmAuctions: {},
    gotchiAirdrops: [],
    raffleTicketClaims: [],
    raffleSubmissions: [],
    raffleWins: [],
    scamAirdrops: [],
    unprocessed: []
  }

  for (const txGroup of Object.values(allTransactions)) {
    if (txGroup.main.length) {
      if (txGroup.main.length !== 1) {
        console.error(`Unexpected data: found multiple main transactions with same tx id ${txGroup.txId}`)
        data.unprocessed.push(txGroup)
        continue
      }

      const tx = txGroup.main[0]
      const isCallingAavegotchi = tx.fromAddress === address && tx.toAddress === CONTRACT_TO_ADDRESS['Aavegotchi']

      if (tx.errorCode === 'execution reverted') {
        data.reverted.push({
          txId: tx.txId,
          date: tx.date,
          maticValueFee: tx.maticValueFee
        })
        // console.log(`Transaction reverted`)
      } else if (tx.method === 'Approve') {
        const token = ADDRESS_TO_TOKEN[tx.toAddress] || ''
        data.approvals.push({
          txId: tx.txId,
          date: tx.date,
          fromAddress: tx.fromAddress,
          tokenAddress: tx.toAddress,
          token,
          maticValueFee: tx.maticValueFee
        })
        if (!token) {
          console.log(`Approval for unknown token: ${tx.toAddress}`)
        }
        // console.log(`Approve ${token}`)
      } else if (tx.fromAddress === address && [CONTRACT_TO_ADDRESS['GotchiStaking']].includes(tx.toAddress) && ['Stake Into Pool', 'Stake Ghst'].includes(tx.method)) {
        if (txGroup.erc20.length !== 1 || txGroup.erc20[0].token !== 'GHST' || txGroup.erc721.length || txGroup.erc1155.length || txGroup.internal.length) {
          console.error(`Unexpected GHST staking txGroup contents`, txGroup)
        } else {
          const erc20tx = txGroup.erc20[0]
          const label = `Stake ${erc20tx.tokenValue} GHST`
          const staking = {
            txId: tx.txId,
            date: tx.date,
            ghstAmount: erc20tx.tokenValue,
            maticValueFee: tx.maticValueFee,
            type: 'Stake',
            label
          }
          data.ghstStaking.push(staking)
          console.log(label)
        }
      } else if (tx.fromAddress === address && tx.toAddress === CONTRACT_TO_ADDRESS['GotchiStaking'] && ['Withdraw From Pool', 'Withdraw Ghst Stake'].includes(tx.method)) {
        if (txGroup.erc20.length !== 1 || txGroup.erc20[0].token !== 'GHST' || txGroup.erc721.length || txGroup.erc1155.length || txGroup.internal.length) {
          console.error(`Unexpected GHST unstaking txGroup contents`, txGroup)
        } else {
          const erc20tx = txGroup.erc20[0]
          const label = `Unstake ${erc20tx.tokenValue} GHST`
          const staking = {
            txId: tx.txId,
            date: tx.date,
            ghstAmount: erc20tx.tokenValue,
            maticValueFee: tx.maticValueFee,
            type: 'Unstake',
            label
          }
          data.ghstStaking.push(staking)
          console.log(label)
        }
      } else if (tx.fromAddress === address && tx.toAddress === CONTRACT_TO_ADDRESS['GotchiStaking'] && ['Claim Tickets'].includes(tx.method)) {
        if (txGroup.erc20.length || txGroup.erc721.length || !txGroup.erc1155.length || txGroup.internal.length) {
          console.error(`Unexpected Claim Raffle Tickets txGroup contents`, txGroup)
        } else {
          let assignedFee = false
          for (const erc1155tx of txGroup.erc1155) {
            if (erc1155tx.tokenContractAddress !== CONTRACT_TO_ADDRESS['GotchiStaking']) {
              console.error(`Unexpected erc1155 token contract in Claim Raffle Tickets tx`, txGroup)
            } else {
              const asset = erc1155tx.assetId
              const assetLabel = erc1155tx.assetLabel
              const amount = erc1155tx.tokenValue
              const label = `Claim ${amount} ${assetLabel} (${asset})`
              const ghstPrice = findErc1155Price(erc1155tx.tokenContractAddress, erc1155tx.tokenId, erc1155tx.date)
              const claim = {
                txId: tx.txId,
                date: tx.date,
                tokenId: erc1155tx.tokenId,
                asset,
                assetContractAddress: erc1155tx.tokenContractAddress,
                assetLabel,
                amount,
                ghstPrice,
                maticValueFee: !assignedFee ? tx.maticValueFee : '0',
                label
              }
              data.raffleTicketClaims.push(claim)
              assignedFee = true
              console.log(label)
            }
          }
        }
      } else if (tx.fromAddress === address && tx.toAddress === CONTRACT_TO_ADDRESS['GotchiStaking'] && tx.method === 'Set Approval For All') {
        const tokenAddress = CONTRACT_TO_ADDRESS['GotchiStaking']
        const firstTicketToken = CONTRACT_ERC1155[tokenAddress][0]
        data.approvals.push({
          txId: tx.txId,
          date: tx.date,
          fromAddress: tx.fromAddress,
          tokenAddress,
          token: firstTicketToken.asset,
          maticValueFee: tx.maticValueFee,
          label: 'Approve transfer of raffle tickets'
        })
      } else if (tx.fromAddress === address && tx.toAddress === CONTRACT_TO_ADDRESS['GotchiRealm'] && tx.method === 'Set Approval For All') {
        data.approvals.push({
          txId: tx.txId,
          date: tx.date,
          fromAddress: tx.fromAddress,
          tokenAddress: tx.toAddress,
          token: 'AG-REALM',
          maticValueFee: tx.maticValueFee,
          label: 'Approve transfer of AG-REALM'
        })
      } else if (isCallingAavegotchi && ['Open Portals', 'Claim Aavegotchi', 'Interact', 'Set Aavegotchi Name', 'Equip Wearables',
          'Spend Skill Points', 'Set Pet Operator For All', 'Cancel ERC721Listing', 'Cancel ERC1155Listing'].includes(tx.method)) {
        const label = tx.method
        const action = {
          txId: tx.txId,
          date: tx.date,
          maticValueFee: tx.maticValueFee,
          label
        }
        data.gameActions.push(action)
        console.log(label)
      } else if (isCallingAavegotchi && tx.method === 'Transfer Escrow') {
        if (txGroup.erc20.length !== 1 || txGroup.erc721.length || txGroup.erc1155.length || txGroup.internal.length) {
          console.error(`Unexpected Gotchi Pocket transfer txGroup contents`, txGroup)
        } else {
          const erc20tx = txGroup.erc20[0]
          const outOfPocket = erc20tx.toAddress === address
          const label = `Transfer ${erc20tx.tokenValue} ${erc20tx.token || 'Unknown Token'} ${outOfPocket ? 'out of' : 'into'} Gotchi Pocket`
          const transfer = {
            txId: tx.txId,
            date: tx.date,
            asset: erc20tx.token,
            assetContractAddress: erc20tx.tokenContractAddress,
            amount: erc20tx.tokenValue,
            maticValueFee: tx.maticValueFee,
            type: 'Transfer Escrow',
            label
          }
          data.pocketTransfers.push(transfer)
          console.log(label)
        }
      } else if (isCallingAavegotchi && ['Set ERC1155Listing', 'Add ERC721Listing'].includes(tx.method)) {
        if (txGroup.erc20.length !== 1 || txGroup.erc721.length || txGroup.erc1155.length) {
          console.error(`Unexected Baazaar listing txGroup contents`, txGroup)
        } else if (txGroup.erc20[0].fromAddress !== address || txGroup.erc20[0].token !== 'GHST') {
          console.error(`Unexpected Baazaar listing erc20tx contents`, txGroup)
        } else {
          const erc20tx = txGroup.erc20[0]
          const label = `Add Baazaar listing`
          data.baazaarListings.push({
            txId: tx.txId,
            date: tx.date,
            ghstAmount: erc20tx.tokenValue,
            maticValueFee: tx.maticValueFee,
            label
          })
          console.log(label)
        }
      } else if (isCallingAavegotchi && ['Execute ERC1155Listing', 'Execute ERC721Listing'].includes(tx.method)) {
        // We expect to see GHST payment (may be many) and either one ERC721 or one ERC1155 record
        const hasExpectedTxs = !txGroup.internal.length &&
          txGroup.erc20.length &&
          (
            (txGroup.erc721.length === 1 && txGroup.erc1155.length === 0) ||
            (txGroup.erc721.length === 0 && txGroup.erc1155.length === 1) ||
            (txGroup.erc721.length === 0 && txGroup.erc1155.length === 2) // why duplicate entries?
          )

        if (!hasExpectedTxs) {
          console.error(`Unexpected Baazaar sale txGroup contents`, txGroup)
        } else {
          let totalGhst = new BigNumber(0)
          for (const erc20tx of txGroup.erc20) {
            if (erc20tx.token !== 'GHST') {
              console.error(`Unexpected ERC20 token found in Baazaar sale ${erc20tx.token}`, erc20tx)
            } else if (erc20tx.fromAddress !== address) {
              console.error(`Unexpected fromAddress found in Baazaar sale ${erc20tx.fromAddress}`, erc20tx)
            } else {
              totalGhst = totalGhst.plus(new BigNumber(erc20tx.tokenValue))
            }
          }
          let assetId = ''
          let assetLabel = ''
          let amount = '0'
          let acquired = []
          if (txGroup.erc721.length === 1) {
            const erc721tx = txGroup.erc721[0]
            if (erc721tx.toAddress !== address) {
              console.error(`Unexpected toAddress found in Baazaar sale ${erc721tx.toAddress}`, erc721tx)
            } else {
              assetId = erc721tx.assetId
              assetLabel = erc721tx.assetLabel
              amount = '1'
              acquired.push({
                asset: assetId,
                assetLabel,
                assetContractAddress: erc721tx.tokenContractAddress,
                amount
              })
            }
          } else if (txGroup.erc1155.length) {
            // Normally there is only 1 entry, but sometimes the export includes 2 (duplicates): ignore the 2nd
            // TODO don't know why there are duplicate records?
            if (txGroup.erc1155.length > 1) {
              console.warn(`Warning: found multiple ERC1155 records for Baazaar sale - only using the first (tx: ${tx.txId})`)
            }
            const erc1155tx = txGroup.erc1155[0]
            if (erc1155tx.toAddress !== address) {
              console.error(`Unexpected toAddress found in Baazaar sale ${erc1155tx.toAddress}`, erc1155tx)
            } else {
              assetId = erc1155tx.assetId
              assetLabel = erc1155tx.assetLabel
              amount = erc1155tx.tokenValue
              acquired.push({
                tokenId: erc1155tx.tokenId,
                asset: assetId,
                assetLabel,
                assetContractAddress: erc1155tx.tokenContractAddress,
                amount
              })
            }
          }
          const label = `Buy ${amount} ${assetLabel} (${assetId}) on Baazaar for ${totalGhst} GHST`
          const purchase = {
            txId: tx.txId,
            date: tx.date,
            acquired,
            disposed: [{
              asset: 'GHST',
              amount: totalGhst.toString()
            }],
            fees: [{
              asset: 'MATIC',
              amount: tx.maticValueFee
            }],
            type: 'Baazaar Purchase',
            label
          }
          data.baazaarPurchases.push(purchase)
          console.log(label)
        }
      } else if (tx.fromAddress === address && GBM_CONTRACT_ADDRESSES.includes(tx.toAddress) && ['Claim', 'Batch Claim'].includes(tx.method)) {
        console.group(`Claiming won GBM items ${tx.date}`)
        let assignedFee = false

        for (const erc721tx of txGroup.erc721) {
          const assetId = erc721tx.assetId
          const assetLabel = erc721tx.assetLabel
          const label = `Claim GBM item: 1 ${assetLabel} (${assetId})`
          data.gbmClaims.push({
            txId: tx.txId,
            date: tx.date,
            tokenId: erc721tx.tokenId,
            asset: assetId,
            assetLabel,
            assetContractAddress: erc721tx.tokenContractAddress,
            amount: '1',
            maticValueFee: !assignedFee ? tx.maticValueFee : '0',
            label
          })
          console.log(label)
          assignedFee = true
        }

        for (const erc1155tx of txGroup.erc1155) {
          const assetId = erc1155tx.assetId
          const assetLabel = erc1155tx.assetLabel
          const amount = erc1155tx.tokenValue
          const label = `Claim GBM item: ${amount} ${assetLabel} (${assetId})`
          data.gbmClaims.push({
            txId: tx.txId,
            date: tx.date,
            tokenId: erc1155tx.tokenId,
            asset: assetId,
            assetLabel,
            assetContractAddress: erc1155tx.tokenContractAddress,
            amount,
            maticValueFee: !assignedFee ? tx.maticValueFee : '0',
            label
          })
          console.log(label)
          assignedFee = true
        }

        console.groupEnd()
      } else if (tx.fromAddress === address && CONTRACT_TO_ADDRESS['GotchiAirdrops'] === tx.toAddress && ['Claim For Address'].includes(tx.method)) {
        if (txGroup.erc20.length || txGroup.erc721.length || txGroup.internal.length) {
          console.error(`Unexpected Aavegotchi airdrop txGroup contents`, txGroup)
        }
        let assignedFee = false
        // Just look for erc1155 for now
        for (const erc1155tx of txGroup.erc1155) {
          if (erc1155tx.toAddress !== address) {
            console.error(`Unexpected Aavegotchi airdrop erc1155 toAddress contents`, txGroup)
          } else {
            const assetId = erc1155tx.assetId
            const assetLabel = erc1155tx.assetLabel
            const amount = erc1155tx.tokenValue
            const label = `Claim Aavegotchi-related airdrop: ${amount} ${assetLabel} (${assetId})`
            const ghstPrice = findErc1155Price(erc1155tx.tokenContractAddress, erc1155tx.tokenId, erc1155tx.date)
            data.gotchiAirdrops.push({
              txId: tx.txId,
              date: tx.date,
              asset: assetId,
              assetLabel,
              amount,
              ghstPrice,
              maticValueFee: !assignedFee ? tx.maticValueFee : '0',
              label
            })
            console.log(label)
            assignedFee = true
          }
        }
      } else if (tx.fromAddress === address && CONTRACT_TO_ADDRESS['GotchiAirdrops'] === tx.toAddress && ['0xd7cb23db'].includes(tx.method)) {
        if (txGroup.erc20.length || txGroup.erc721.length || txGroup.erc1155.length || txGroup.internal.length) {
          console.error(`Unexpected Aavegotchi H1 Background txGroup contents`, txGroup)
        }
        const label = `Claim Aavegotchi H1 Background`
        data.gameActions.push({
          txId: tx.txId,
          date: tx.date,
          maticValueFee: tx.maticValueFee,
          label
        })
        console.log(label)
      } else if (tx.fromAddress === address && CONTRACT_TO_ADDRESS['GotchiRaffles'] === tx.toAddress && ['0x57b0ef44'].includes(tx.method)) {
        if (txGroup.erc20.length || txGroup.erc721.length || txGroup.internal.length) {
          console.error(`Unexpected Aavegotchi raffle claim txGroup contents`, txGroup)
        }
        console.group(`Claim raffle winnings ${tx.method} ${tx.date}`)
        let assignedFee = false
        // Just look for erc1155 for now
        for (const erc1155tx of txGroup.erc1155) {
          if (erc1155tx.toAddress !== address) {
            console.error(`Unexpected Aavegotchi raffle claim erc1155 toAddress contents`, txGroup)
          } else {
            const assetId = erc1155tx.assetId
            const assetLabel = erc1155tx.assetLabel
            const amount = erc1155tx.tokenValue
            const label = `Claim Aavegotchi raffle winnings: ${amount} ${assetLabel} (${assetId})`
            const ghstPrice = findErc1155Price(erc1155tx.tokenContractAddress, erc1155tx.tokenId, erc1155tx.date)
            data.raffleWins.push({
              txId: tx.txId,
              date: tx.date,
              asset: assetId,
              assetLabel,
              amount,
              ghstPrice,
              maticValueFee: !assignedFee ? tx.maticValueFee : '0',
              label
            })
            console.log(label)
            assignedFee = true
          }
        }
        console.groupEnd()
      } else if (tx.fromAddress === address && CONTRACT_TO_ADDRESS['GotchiRaffles'] === tx.toAddress && ['0xec9fabb7'].includes(tx.method)) {
        if (txGroup.erc20.length || txGroup.erc721.length || txGroup.internal.length) {
          console.error(`Unexpected Aavegotchi raffle submission txGroup contents`, txGroup)
        }
        console.group(`Submit raffle tickets ${tx.date}`)
        let assignedFee = false
        // Tickets are only erc1155
        for (const erc1155tx of txGroup.erc1155) {
          if (erc1155tx.fromAddress !== address) {
            console.error(`Unexpected Aavegotchi raffle submission erc1155 toAddress contents`, txGroup)
          } else {
            const assetId = erc1155tx.assetId
            const assetLabel = erc1155tx.assetLabel
            const amount = erc1155tx.tokenValue
            const label = `Submit Aavegotchi raffle tickets: ${amount} ${assetLabel} (${assetId})`
            const ghstPrice = findErc1155Price(erc1155tx.tokenContractAddress, erc1155tx.tokenId, erc1155tx.date)
            data.raffleSubmissions.push({
              txId: tx.txId,
              date: tx.date,
              tokenId: erc1155tx.tokenId,
              asset: assetId,
              assetLabel,
              assetContractAddress: erc1155tx.tokenContractAddress,
              amount,
              ghstPrice,
              maticValueFee: !assignedFee ? tx.maticValueFee : '0',
              label
            })
            console.log(label)
            assignedFee = true
          }
        }
        console.groupEnd()
      } else if (tx.fromAddress === address && GBM_CONTRACT_ADDRESSES.includes(tx.toAddress) && ['Commit Bid', 'Place Bid', '0x544b3360'].includes(tx.method)) {
        if (txGroup.erc721.length || txGroup.erc1155.length || txGroup.internal.length) {
          console.error(`Unexpected GBM bid txGroup contents`, txGroup)
        // spot edge case: outbidding self (?) where there are 2 erc20, one out and one in
        } else if (txGroup.erc20.length === 2 &&
          txGroup.erc20[0].fromAddress === address &&
          txGroup.erc20[1].toAddress === address &&
          txGroup.erc20[0].token === 'GHST' &&
          txGroup.erc20[1].token === 'GHST' &&
          (new BigNumber(txGroup.erc20[0].tokenValue)).gt(new BigNumber(txGroup.erc20[1].tokenValue))
        ) {
          // new bid tx
          let erc20tx = txGroup.erc20[0]
          let amount = erc20tx.tokenValue
          let label = `Bid ${amount} GHST in GBM`
          data.gbmBids.push({
            txId: tx.txId,
            date: tx.date,
            ghstAmount: amount,
            maticValueFee: tx.maticValueFee,
            label
          })
          console.log(label)

          // old bid refund tx
          erc20tx = txGroup.erc20[1]
          amount = erc20tx.tokenValue
          label = `Receive GBM bid refund: ${amount} GHST`
          data.gbmRefunds.push({
            txId: tx.txId,
            date: tx.date,
            ghstAmount: amount,
            label
          })
          console.log(label)
        } else if (txGroup.erc20.length !== 1) {
          console.error(`Unexpected GBM bid erc20 contents`, txGroup)
        } else if (txGroup.erc20[0].fromAddress !== address) {
          console.error(`Unexpected GBM bid erc20 fromAddress`, txGroup)
        } else if (txGroup.erc20[0].token !== 'GHST') {
          console.error(`Unexpected GBM bid erc20 token`, txGroup)
        } else {
          const erc20tx = txGroup.erc20[0]
          const amount = erc20tx.tokenValue
          const label = `Bid ${amount} GHST in GBM`
          data.gbmBids.push({
            txId: tx.txId,
            date: tx.date,
            ghstAmount: amount,
            maticValueFee: tx.maticValueFee,
            label
          })
          console.log(label)
        }
      } else if (
          tx.fromAddress === address &&
          [CONTRACT_TO_ADDRESS['1inch'], CONTRACT_TO_ADDRESS['1inch2'], CONTRACT_TO_ADDRESS['Zapper'], CONTRACT_TO_ADDRESS['QuickSwap']].includes(tx.toAddress) &&
          ['0x7c025200', 'Zap Out', '0x415565b0'].includes(tx.method)
        ) {
        if (txGroup.erc721.length || txGroup.erc1155.length) {
          console.error(`Unexpected trade erc721/erc1155 txGroup contents`, txGroup)
        } else {
          const trade = ({
            txId: tx.txId,
            date: tx.date,
            label: `Trade on ${ADDRESS_TO_CONTRACT[tx.toAddress]}`,
            acquired: [],
            disposed: [],
            fees: [{
              asset: 'MATIC',
              amount: tx.maticValueFee
            }]
          })
          data.trades.push(trade)

          let disposedLabels = []
          let acquiredLabels = []
          // main tx
          if (tx.maticValueIn !== '0') {
            trade.acquired.push({
              asset: 'MATIC',
              amount: tx.maticValueIn
            })
            acquiredLabels.push(`${tx.maticValueIn} MATIC`)
          }
          if (tx.maticValueOut !== '0') {
            trade.disposed.push({
              asset: 'MATIC',
              amount: tx.maticValueOut
            })
            disposedLabels.push(`${tx.maticValueIn} MATIC`)
          }
          // internal tx
          for (const internalTx of txGroup.internal) {
            if (internalTx.toAddress !== address) {
              console.error(`Unexpected toAddress in trade erc20 tx`, txGroup)
            } else if (internalTx.maticValueOut !== '0') {
              console.error(`Unexpected maticValueOut in trade erc20 tx`, txGroup)
            } else if (internalTx.maticValueIn !== '0') {
              trade.acquired.push({
                asset: 'MATIC',
                amount: internalTx.maticValueIn
              })
              acquiredLabels.push(`${internalTx.maticValueIn} MATIC`)
            }
          }

          // erc20
          for (const erc20tx of txGroup.erc20) {
            if (erc20tx.toAddress === address && erc20tx.fromAddress !== address) {
              const erc20item = {
                asset: erc20tx.token,
                assetContractAddress: erc20tx.tokenContractAddress,
                amount: erc20tx.tokenValue
              }
              trade.acquired.push(erc20item)
              acquiredLabels.push(`${erc20item.amount} ${erc20item.asset || erc20item.assetContractAddress}`)
            } else if (erc20tx.fromAddress === address && erc20tx.toAddress !== address) {
              const erc20item = {
                asset: erc20tx.token,
                assetContractAddress: erc20tx.tokenContractAddress,
                amount: erc20tx.tokenValue
              }
              trade.disposed.push(erc20item)
              disposedLabels.push(`${erc20item.amount} ${erc20item.asset || erc20item.assetContractAddress}`)
            } else {
              console.error(`Unexpected erc20tx contents in trade`, txGroup)
            }
          }

          if (!disposedLabels.length || !acquiredLabels.length) {
            console.error(`Unexpected trade contents: should have both disposed and acquired assets`, txGroup, trade)
          }
          trade.label += `: ${disposedLabels.join(', ')} -> ${acquiredLabels.join(', ')}`
          console.log(trade.label)
        }
      } else if (tx.method === 'Transfer' || tx.method === 'Safe Transfer From') {
        console.group(`Transfer from ${tx.fromAddress} to ${tx.toAddress} (tx ${tx.txId}`)
        const transfer = {
          txId: tx.txId,
          date: tx.date,
          fromAddress: tx.fromAddress,
          toAddress: tx.toAddress,
          acquired: [],
          disposed: [],
          fees: [{
            asset: 'MATIC',
            amount: tx.maticValueFee
          }],
          label: 'Transfer'
        }
        data.transfers.push(transfer)

        const generateLabel = function (disposedLabels, acquiredLabels) {
          let label = ''
          if (disposedLabels.length) {
            label += `Sent ${disposedLabels.join(', ')}`
          }
          if (acquiredLabels.length) {
            if (label) { label += '; ' }
            label += `Received ${acquiredLabels.join(', ')}`
          }
          return label
        }

        if (address === tx.fromAddress && address === tx.toAddress && tx.maticValueIn === '0' && tx.maticValueOut === '0') {
          // zero-size transfer to self
          console.log('Transfer 0 MATIC to self')
          transfer.acquired.push({
            asset: 'MATIC',
            amount: '0'
          })
          transfer.disposed.push({
            asset: 'MATIC',
            amount: '0'
          })
          transfer.label = 'Transfer 0 MATIC to self'
        } else {
          if (tx.maticValueIn && tx.maticValueIn !== '0') {
            transfer.acquired.push({
              asset: 'MATIC',
              amount: tx.maticValueIn
            })
            transfer.label = `Received ${tx.maticValueIn} MATIC`
            console.log(transfer.label)
          }
          if (tx.maticValueOut && tx.maticValueOut !== '0') {
            transfer.disposed.push({
              asset: 'MATIC',
              amount: tx.maticValueOut
            })
            transfer.label = `Sent ${tx.maticValueOut} MATIC`
            console.log(transfer.label)
          }
          // check for token transfers
          if (txGroup.erc20.length) {
            console.log(`ERC20 tokens are being transferred`)
            let disposedLabels = []
            let acquiredLabels = []
            for (const erc20tx of txGroup.erc20) {
              if (erc20tx.tokenValue !== '0') {
                if (address === erc20tx.fromAddress) {
                  transfer.disposed.push({
                    asset: erc20tx.token,
                    assetContractAddress: erc20tx.tokenContractAddress,
                    amount: erc20tx.tokenValue
                  })
                  disposedLabels.push(erc20tx.tokenValue + ' ' + (erc20tx.token || 'Unknown token'))
                }
                if (address === erc20tx.toAddress) {
                  transfer.acquired.push({
                    asset: erc20tx.token,
                    assetContractAddress: erc20tx.tokenContractAddress,
                    amount: erc20tx.tokenValue
                  })
                  acquiredLabels.push(erc20tx.tokenValue + ' ' + (erc20tx.token || 'Unknown token'))
                }
                if (!erc20tx.token) {
                  console.error(`Unrecognised token ${erc20tx.tokenContractAddress}`)
                }
              }
            }
            transfer.label = generateLabel(disposedLabels, acquiredLabels)
            console.log(transfer.label)
          }
          if (txGroup.erc721.length) {
            console.log(`ERC721 tokens are being transferred`)
            for (const erc721tx of txGroup.erc721) {
              console.error(` - TODO: need example of this to check against`)
              console.log(erc721tx)
              if (erc721tx.tokenValue !== '0') {
                if (address === erc721tx.fromAddress) {
                  transfer.disposed.push({
                    asset: erc721tx.token,
                    assetContractAddress: erc721tx.tokenContractAddress,
                    amount: erc721tx.tokenValue
                  })
                }
                if (address === erc721tx.toAddress) {
                  transfer.acquired.push({
                    asset: erc721tx.token,
                    assetContractAddress: erc721tx.tokenContractAddress,
                    amount: erc721tx.tokenValue
                  })
                }
              }
            }
          }
          if (txGroup.erc1155.length) {
            console.log(`ERC1155 tokens are being transferred`)
            let disposedLabels = []
            let acquiredLabels = []
            for (const erc1155tx of txGroup.erc1155) {
              if (erc1155tx.tokenValue !== '0') {
                const ghstPrice = findErc1155Price(erc1155tx.tokenContractAddress, erc1155tx.tokenId, erc1155tx.date)
                if (address === erc1155tx.fromAddress) {
                  transfer.disposed.push({
                    asset: erc1155tx.assetId,
                    assetContractAddress: erc1155tx.tokenContractAddress,
                    assetTokenId: erc1155tx.tokenId,
                    amount: erc1155tx.tokenValue,
                    ghstPrice
                  })
                  disposedLabels.push(erc1155tx.tokenValue + ' ' + (erc1155tx.assetLabel || `Unknown NFT #${erc1155tx.tokenId}`))
                }
                if (address === erc1155tx.toAddress) {
                  transfer.acquired.push({
                    asset: erc1155tx.assetId,
                    assetContractAddress: erc1155tx.tokenContractAddress,
                    assetTokenId: erc1155tx.tokenId,
                    amount: erc1155tx.tokenValue,
                    ghstPrice
                  })
                  acquiredLabels.push(erc1155tx.tokenValue + ' ' + (erc1155tx.assetLabel || `Unknown NFT #${erc1155tx.tokenId}`))
                }
              }
            }
            transfer.label = generateLabel(disposedLabels, acquiredLabels)
            console.log(transfer.label)
          }
        }

        console.groupEnd()
      } else {
        data.unprocessed.push(txGroup)
      }
    } else {
      // Handle txGroup without a main transaction

      // Baazaar sales
      if (
        // Look for Baazaar sale pattern (ERC1155):
        //  received GHST
        txGroup.erc20.length === 1 &&
        txGroup.erc20[0].toAddress === address &&
        txGroup.erc20[0].token === 'GHST' &&
        //  sent Aavegotchi ERC1155
        txGroup.erc1155.length === 1 &&
        txGroup.erc1155[0].fromAddress === address &&
        [CONTRACT_TO_ADDRESS['Aavegotchi'], CONTRACT_TO_ADDRESS['GotchiStaking']].includes(txGroup.erc1155[0].tokenContractAddress) &&
        //  no other transfers
        !txGroup.internal.length &&
        !txGroup.erc721.length
      ) {
        const erc20tx = txGroup.erc20[0]
        const ghstAmount = erc20tx.tokenValue
        const erc1155tx = txGroup.erc1155[0]
        const assetId = erc1155tx.assetId
        const assetLabel = erc1155tx.assetLabel
        const amount = erc1155tx.tokenValue
        const label = `Sell ${amount} ${assetLabel} (${assetId}) on Baazaar for ${ghstAmount} GHST`
        const sale = {
          txId: erc20tx.txId,
          date: erc20tx.date,
          acquired: [{
            asset: 'GHST',
            amount: ghstAmount
          }],
          disposed: [{
            tokenId: erc1155tx.tokenId,
            asset: assetId,
            assetLabel,
            assetContractAddress: erc1155tx.tokenContractAddress,
            amount
          }],
          fees: [],
          label
        }
        data.baazaarSales.push(sale)
        console.log(label)

      } else if (
        // Look for Baazaar sale pattern (ERC721):
        //  received GHST
        txGroup.erc20.length === 1 &&
        txGroup.erc20[0].toAddress === address &&
        txGroup.erc20[0].token === 'GHST' &&
        //  sent Aavegotchi ERC721
        txGroup.erc721.length === 1 &&
        txGroup.erc721[0].fromAddress === address &&
        [CONTRACT_TO_ADDRESS['Aavegotchi'], CONTRACT_TO_ADDRESS['GotchiRealm']].includes(txGroup.erc721[0].tokenContractAddress) &&
        //  no other transfers
        !txGroup.internal.length &&
        !txGroup.erc1155.length
      ) {
        const erc20tx = txGroup.erc20[0]
        const ghstAmount = erc20tx.tokenValue
        const erc721tx = txGroup.erc721[0]
        const assetId = erc721tx.assetId
        const assetLabel = erc721tx.assetLabel
        const label = `Sell ${assetLabel} (${assetId}) on Baazaar for ${ghstAmount} GHST`
        const sale = {
          txId: erc20tx.txId,
          date: erc20tx.date,
          acquired: [{
            asset: 'GHST',
            amount: ghstAmount
          }],
          disposed: [{
            asset: assetId,
            assetLabel,
            assetContractAddress: erc721tx.tokenContractAddress,
            amount: '1'
          }],
          fees: [],
          label
        }
        data.baazaarSales.push(sale)
        console.log(label)

      // GBM refunds
      } else if (txGroup.erc20.length === 1 && !txGroup.erc1155.length && !txGroup.erc721.length &&
        txGroup.erc20[0].toAddress === address &&
        [CONTRACT_TO_ADDRESS['GotchiGBM_Land']].includes(txGroup.erc20[0].fromAddress) &&
        txGroup.erc20[0].token === 'GHST'
      ) {
        const erc20tx = txGroup.erc20[0]
        const ghstAmount = erc20tx.tokenValue
        const label = `Receive GBM bid refund: ${ghstAmount} GHST`
        const refund = {
          txId: erc20tx.txId,
          date: erc20tx.date,
          ghstAmount,
          ghstRewardAmount: null,
          label
        }
        data.gbmRefunds.push(refund)
        console.log(label)

      // Scam token airdrops (ERC20)
      } else if (
        txGroup.erc20.length === 1 &&
        txGroup.erc20[0].toAddress === address &&
        txGroup.erc20[0].token.startsWith('Scam_') &&
        !txGroup.internal.length &&
        !txGroup.erc721.length &&
        !txGroup.erc1155.length
      ) {
        const erc20tx = txGroup.erc20[0]
        const asset = erc20tx.token
        const amount = erc20tx.tokenValue
        const label = `Receive scam token airdrop: ${amount} ${asset}`
        const airdrop = {
          txId: erc20tx.txId,
          date: erc20tx.date,
          acquired: [{
            asset,
            assetLabel: asset,
            assetContractAddress: erc20tx.tokenContractAddress,
            amount
          }],
          label
        }
        data.scamAirdrops.push(airdrop)
        console.log(label)

      // Scam token airdrops (ERC1155)
      } else if (
        txGroup.erc1155.length === 1 &&
        txGroup.erc1155[0].toAddress === address &&
        txGroup.erc1155[0].tokenContract.startsWith('Scam_') &&
        !txGroup.internal.length &&
        !txGroup.erc20.length &&
        !txGroup.erc721.length
      ) {
        const erc1155tx = txGroup.erc1155[0]
        const asset = `${erc1155tx.tokenContract}:${erc1155tx.tokenName}`
        const amount = erc1155tx.tokenValue
        const label = `Receive scam ERC1155 token airdrop: ${amount} ${asset}`
        const airdrop = {
          txId: erc1155tx.txId,
          date: erc1155tx.date,
          acquired: [{
            asset,
            assetLabel: asset,
            assetContractAddress: erc1155tx.tokenContractAddress,
            amount
          }],
          label
        }
        data.scamAirdrops.push(airdrop)
        console.log(label)

      // Misc ERC20 token received
      } else if (
        txGroup.erc20.length === 1 &&
        txGroup.erc20[0].toAddress === address &&
        !txGroup.internal.length &&
        !txGroup.erc721.length &&
        !txGroup.erc1155.length
      ) {
        const erc20tx = txGroup.erc20[0]
        const asset = erc20tx.token
        const amount = erc20tx.tokenValue
        const label = `Receive ${amount} ${asset} from ${erc20tx.fromAddress}`
        const deposit = {
          txId: erc20tx.txId,
          date: erc20tx.date,
          fromAddress: erc20tx.fromAddress,
          acquired: [{
            asset,
            assetContractAddress: erc20tx.tokenContractAddress,
            amount
          }],
          label
        }
        data.deposits.push(deposit)

        console.log(label)

      // Misc ERC1155 token received
      } else if (
        txGroup.erc1155.length === 1 &&
        txGroup.erc1155[0].toAddress === address &&
        !txGroup.internal.length &&
        !txGroup.erc721.length &&
        !txGroup.erc20.length
      ) {
        const erc1155tx = txGroup.erc1155[0]
        const asset = erc1155tx.assetId || erc1155tx.tokenContract
        const assetLabel = erc1155tx.assetLabel || erc1155tx.tokenContract
        const amount = erc1155tx.tokenValue
        const label = `Receive ${amount} ${assetLabel} (${asset}) from ${erc1155tx.fromAddress}`
        const ghstPrice = findErc1155Price(erc1155tx.tokenContractAddress, erc1155tx.tokenId, erc1155tx.date)
        const deposit = {
          txId: erc1155tx.txId,
          date: erc1155tx.date,
          fromAddress: erc1155tx.fromAddress,
          acquired: [{
            tokenId: erc1155tx.tokenId,
            asset,
            assetContractAddress: erc1155tx.tokenContractAddress,
            amount,
            ghstPrice
          }],
          label
        }
        data.deposits.push(deposit)

        console.log(label)
      } else {
        data.unprocessed.push(txGroup)
      }
    }
  }

  console.log(`Loaded data with ${Object.keys(allTransactions).length} transactions: found for ${Object.entries(data).map(([id, list]) => id === 'address' ? list : `${list.length} ${id}`).join(', ')}`)

  // Fetch additional data necessary to fully understand the transactions

  console.log(`----------- Fetch additional info -----------`)
  let gbmAbi = await readJsonFile('./gbmDiamondAbi.json')
  let gbmIface = new ethers.utils.Interface(gbmAbi)

  const initGbmAuction = function(auctionId) {
    if (!data.gbmAuctions[auctionId]) {
      data.gbmAuctions[auctionId] = {
        bids: [],
        refunds: [],
        claim: null,
      }
    }
  }

  let i = 0;
  for (const bid of data.gbmBids) {
    console.group(`Fetch transaction details for GBM bid ${bid.txId}`)
    const txDetails = await fetchTransaction(bid.txId)
    // console.log(txDetails)
    let auctionId = null
    for (const eventLog of txDetails.log_events) {
      // console.log({ eventLog })
      try {
        const decoded = gbmIface.parseLog({
          data: eventLog.raw_log_data,
          topics: eventLog.raw_log_topics
        })
        // console.log(`Log decoded for ${decoded.name}`)
        if (decoded.name === 'Auction_BidPlaced') {
          auctionId = decoded.args._auctionID.toString()
        }
      } catch (e) {
        // console.error(`Log not decoded`, e.message)
      }
    }

    if (auctionId) {
      console.log(`Auction ${auctionId}`)
      bid.auctionId = auctionId
      initGbmAuction(auctionId)
      data.gbmAuctions[auctionId].bids.push(bid)
    } else {
      console.error(`Didn't find auctionId for GBM bid ${bid.txId}`)
    }

    console.groupEnd()
    i++
    // if (i > 2) {
    //   break
    // }
  }

  i = 0;
  for (const refund of data.gbmRefunds) {
    console.group(`Fetch transaction details for GBM refund`)
    const txDetails = await fetchTransaction(refund.txId)
    //console.log(txDetails)
    let newBidder = null
    let incentiveAmount = null
    let auctionId = null
    for (const eventLog of txDetails.log_events) {
      // console.log({ eventLog })
      try {
        const decoded = gbmIface.parseLog({
          data: eventLog.raw_log_data,
          topics: eventLog.raw_log_topics
        })
        // console.log(`Log decoded for ${decoded.name}`)
        if (decoded.name === 'Auction_BidPlaced') {
          newBidder = decoded.args._bidder.toLowerCase()
        } else if (decoded.name === 'Auction_IncentivePaid') {
          if (decoded.args._earner.toLowerCase() === address) {
            incentiveAmount = ethers.utils.formatEther(decoded.args._incentiveAmount)
            auctionId = decoded.args._auctionID.toString()
          }
        }
      } catch (e) {
        // console.error(`Log not decoded`, e.message)
      }
    }
    // console.log(`New Bidder ${newBidder}`)
    // console.log(`Received incentive ${incentiveAmount}`)
    if (auctionId) {
      console.log(`Auction ${auctionId}`)
      refund.newBidder = newBidder,
      refund.ghstRewardAmount = incentiveAmount
      refund.auctionId = auctionId
      if (incentiveAmount) {
        refund.label += ` (reward: ${incentiveAmount} GHST)`
      } else {
        console.error(`Didn't find reward amound for GBM refund ${refund.txId}`)
      }
      console.log(refund.label)
      if (refund.newBidder === address) {
        console.log(`Outbid self!`)
      }

      initGbmAuction(auctionId)
      data.gbmAuctions[auctionId].refunds.push(refund)
    } else {
      console.error(`Didn't find auctionId for GBM refund ${refund.txId}`)
    }
    console.groupEnd()
    i++
    // if (i > 2) {
    //   break
    // }
  }

  // Group events (bids, refunds, claims) by auction ID
  const assignedAuctions = {}
  for (const claim of data.gbmClaims) {
    console.group(`Fetch transaction details for GBM claim ${claim.txId}`)
    const txDetails = await fetchTransaction(claim.txId)
    // console.log(txDetails)
    let auctionId = null
    for (let index = 0; index < txDetails.log_events.length; index++) {
      const eventLog = txDetails.log_events[index]
      // console.log({ eventLog })
      // TODO for some reason, raw_log_data is null for the relevant 'claim' event.
      // Instead, match it by the sender_address and pick the 2nd raw_log_topics value to get the auction ID
      // This is awful - there must be a better way to do it!
      if (GBM_CONTRACT_ADDRESSES.includes(eventLog.sender_address) &&
        eventLog.raw_log_data === null &&
        eventLog.raw_log_topics[0] === '0x36c817b01bdbc20b542bcc10ca808780e14aa4c1043a66966a7692de51df5113'
      ) {
        const auctionIdHex = eventLog.raw_log_topics[1]
        const auctionIdNum = new BigNumber(auctionIdHex).toString()
        if (assignedAuctions[auctionIdNum]) {
          // already found claim for this auction
          // (Need to check because batch claim can have multiple entries for same type of ERC1155)
          continue
        }
        // console.log(`Found ${auctionIdHex}`)
        // Check the next log: it should contain the transfer of the NFT
        // If it matches, use this auction ID (it might not if this is a batch claim)
        const nextEventLog = txDetails.log_events[index + 1]
        if (nextEventLog) {
          if (nextEventLog.decoded?.name === 'Transfer' &&
            nextEventLog.sender_address === claim.assetContractAddress &&
            nextEventLog.decoded.params.length === 3 &&
            nextEventLog.raw_log_topics.length === 4
          ) {
            const tokenId = new BigNumber(nextEventLog.raw_log_topics[3]).toString()
            // console.log(`Next event is a ERC721 transfer of token ${tokenId}`)
            if (tokenId === claim.tokenId) {
              // console.log(`Found matching entry`)
              auctionId = new BigNumber(auctionIdHex).toString()
              break
            }
          } else if (nextEventLog.decoded?.name === 'TransferSingle' &&
            nextEventLog.sender_address === claim.assetContractAddress &&
            nextEventLog.decoded.params.length === 5
          ) {
            const tokenId = nextEventLog.decoded.params.find(({ name }) => name === '_id').value
            // console.log(`Next event is a ERC1155 transfer of token ${tokenId}`)
            if (tokenId === claim.tokenId) {
              // console.log(`Found matching entry`)
              auctionId = new BigNumber(auctionIdHex).toString()
              break
            }
          }
        }
      }
    }

    if (auctionId) {
      console.log(`Auction ${auctionId}`)
      claim.auctionId = auctionId

      assignedAuctions[auctionId] = true

      initGbmAuction(auctionId)
      data.gbmAuctions[auctionId].claim = claim
    } else {
      console.error(`Didn't find auctionId for GBM claim ${claim.txId}`)
    }
    console.groupEnd()
    i++
    // if (i > 15) {
    //   break
    // }
  }

  // Now that the GBM events are grouped by auctionId, annotate them where possible
  for (const auctionId in data.gbmAuctions) {
    const auction = data.gbmAuctions[auctionId]
    if (auction.claim) {
      for (const item of [...auction.bids, ...auction.refunds]) {
        item.label += ` (${auction.claim.assetLabel} ${auction.claim.asset})`
      }
      if (auction.bids.length) {
        // find the highest bid
        const sortedBids = [...auction.bids]
        sortedBids.sort((a, b) => {
          const aAmount = a.ghstAmount - 0
          const bAmount = b.ghstAmount - 0
          if (aAmount === bAmount) {
            return 0
          }
          return aAmount > bAmount ? -1 : 1
        })
        auction.claim.ghstAmount = sortedBids[0].ghstAmount
      } else {
        auction.claim.ghstAmount = null
        console.error(`Couldn't find auction claim's corresponding bid price - please ensure all GBM transactions are provided in the polygonscan export`, auction.claim)
      }
    }
  }

  // Finished, export result
  await writeJsonFile(filenameOut, { data, allTransactions })
  console.log(`Written ${filenameOut}`)
}

function cleanExportedNumber(numberString) {
  if (!numberString) { return numberString }
  // polygonscan exports large numbers with thousands separator ','
  return numberString.replaceAll(',', '')
}