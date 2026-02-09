const BigNumber = require('bignumber.js')
const { readJsonFile, readCsvFile, writeJsonFile } = require('./fileUtils.js')
const fetchTransaction = require('./fetchTransaction.js')
const fetchTransactionEthers = require('./fetchTransactionEthers.js')
const fetchTransactionReceiptEthers = require('./fetchTransactionReceiptEthers.js')
const ethers = require('ethers')
// Don't use exponential notation
BigNumber.config({ EXPONENTIAL_AT: [-100, 100] })

const ERC1155_PRICES_FILENAME = './prices/erc1155PricesBase.json'

const SCAM_DUST_FROM_ADDRESSES = [
  // '0xd24d554728385fc84fcf19d53cfea5f89a6d339b',
]

const ADDRESS_TO_TOKEN = {
  '0xcd2f22236dd9dfe2356d7c543161d4d260fd9bcb': 'GHST',
  '0x2028b4043e6722ea164946c82fe806c4a43a0ff4': 'FUD',
  '0xa32137bfb57d2b6a9fd2956ba4b54741a6d54b58': 'FOMO',
  '0x15e7cac885e3730ce6389447bc0f7ac032f31947': 'ALPHA',
  '0xe52b9170ff4ece4c35e796ffd74b57dec68ca0e5': 'KEK',
  '0x4d140ce792bedc430498c2d219afbc33e2992c9d': 'GLTR',
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USDC',
  '0xb435cb9cee20efce58c452f646552c3ad744ed64': 'Scam_Token_ERC20TOKEN_0xb435cb9cee20efce58c452f646552c3ad744ed64',
  '0x18c79a3c5f74ae0eedb87917f2a870ed84ebf84f': 'Scam_Token_ERC20TOKEN_0x18c79a3c5f74ae0eedb87917f2a870ed84ebf84f',
  '0xd01c8f05a9b7d5c2672a590b563ced2cb50d24a6': 'Scam_Token_ERC20TOKEN_0xd01c8f05a9b7d5c2672a590b563ced2cb50d24a6',
  '0xda932bcc910ec2dbdcbc49e01f8a5b36be9deefb': 'Scam_Token_ERC20TOKEN_0xda932bcc910ec2dbdcbc49e01f8a5b36be9deefb',
  '0xfaf87e196a29969094be35dfb0ab9d0b8518db84': 'Scam_Token_ACHIVX_0xfaf87e196a29969094be35dfb0ab9d0b8518db84',
  '0x3319e7bd7e8792f313aef8f572cbb0470bfd38a2': 'Scam_Token_ERC20TOKEN_0x3319e7bd7e8792f313aef8f572cbb0470bfd38a2',
  '0xbcd73d9c3de8884c9aaaf9b2e4f0a48a64f12a1b': 'Scam_Token_ERC20TOKEN_0xbcd73d9c3de8884c9aaaf9b2e4f0a48a64f12a1b',
  '0x7b6eb7d296be4084737dc5f3c7ea8faa8fcda1b4': 'Scam_Token_ERC20TOKEN_0x7b6eb7d296be4084737dc5f3c7ea8faa8fcda1b4',
  '0x507b8c8053c20c40d8f448d9b9a4054a981544a7': 'Scam_Token_ERC20TOKEN_0x507b8c8053c20c40d8f448d9b9a4054a981544a7',
  '0x1e358596f48420fe4cd147dcc850661632125e21': 'Scam_Token_ERC20TelegramTronVanity88_bot_0x1e358596f48420fe4cd147dcc850661632125e21',
  '0xe3758013cd2258e8d4dcc8bd6599aebb50681594': 'Scam_Token_ERC20TOKEN_0xe3758013cd2258e8d4dcc8bd6599aebb50681594',
  '0x9f6218959f3a1d0f5e55c974678dae820087b315': 'Scam_Token_ERC20OpenAI_0x9f6218959f3a1d0f5e55c974678dae820087b315',
  '0x6537aef3eb037e3da7f7ff6dbf52038dd6d7fc75': 'Scam_Token_ERC20TOKEN_0x6537aef3eb037e3da7f7ff6dbf52038dd6d7fc75',
  '0xcf2dd9ddf41ada664ed7d7b319a393460140f45b': 'Scam_Token_ERC20OfficialBarronTrump_0xcf2dd9ddf41ada664ed7d7b319a393460140f45b',
  '0xfae7d01301e2eeede488f0953547e712a56c5e1d': 'Scam_Token_ERC20OracleAI_0xfae7d01301e2eeede488f0953547e712a56c5e1d',
  '0xc2fad67ceadbde7001ca70236cde9f672edc573b': 'Scam_Token_ERC20TOKEN_0xc2fad67ceadbde7001ca70236cde9f672edc573b',
  '0xe113c82a9b6382d60ac264f61aae60f764f57d5a': 'Scam_Token_ERC20DUCKYDuckythebrain_0xe113c82a9b6382d60ac264f61aae60f764f57d5a',
  '0xf4bcff93f2f36a926c5e51ccfbe33f468137e83e': 'Scam_Token_ERC20TOKEN_0xf4bcff93f2f36a926c5e51ccfbe33f468137e83e',
  '0xb8ac1e065924c11ac2084150bd46142173794ad6': 'Scam_Token_ERC20TOKEN_0xb8ac1e065924c11ac2084150bd46142173794ad6',
  '0x79624893f8fbd6c6e362fdb60832be71a03ce61f': 'Scam_Token_ERC20TOKEN_0x79624893f8fbd6c6e362fdb60832be71a03ce61f',
  '0xa2e78aabef4cd79f554991845a17d3c30282f180': 'Scam_Token_ERC20MWXAI_0xa2e78aabef4cd79f554991845a17d3c30282f180',
  '0x9765eaa10b7416da46a5f3de7f3f55ccfa12ce91': 'Scam_Token_ERC20IRCLETOKENDISTRIBUTION_0x9765eaa10b7416da46a5f3de7f3f55ccfa12ce91'
}
const TOKEN_TO_ADDRESS = Object.fromEntries(Object.entries(ADDRESS_TO_TOKEN).map(([id, value]) => [value, id]))

const ADDRESS_TO_CONTRACT = {
  '0xa99c4b08201f2913db8d28e71d020c4298f29dbf': 'Aavegotchi', // Portals, Gotchi, Wearables
  '0x052e6c114a166b0e91c2340370d72d4c33752b4b': 'AavegotchiWearables', // Wearables Diamond (since ~Dec 2022?)
  '0xa02d547512bb90002807499f05495fe9c4c3943f': 'GotchiStaking', // Staking, Raffle tickets
  '0x4b0040c3646d3c44b8a28ad7055cfcf536c05372': 'GotchiRealm', // Parcels
  '0xebba5b725a2889f7f089a6cae0246a32cad4e26b': 'GotchiInstallations',
  '0x617fdb8093b309e4699107f48812b407a7c37938': 'GotchiTiles',
  '0x75c8866f47293636f1c32ecbcd9168857dbefc56': 'GotchiAirdrops', // Claimable airdrops: H1 bg, Drop tickets
  '0x6c723cac1e35fe29a175b287ae242d424c52c1ce': 'GotchiRaffles', // Raffle submission/claiming
  '0x50af2d63b839aa32b4166fd1cb247129b715186c': 'GotchiForge',
  '0x80320a0000c7a6a34086e2acad6915ff57ffda31': 'GotchiGBM',
  '0xab59ca4a16925b0a4bac5026c94beb20a29df479': 'FAKEGotchis',
  '0x2c1a288353e136b9e4b467aadb307133fffeab25': 'VersePayout', // Alchemica payouts from Gotchiverse Apr 2022
  '0x2e31367f1d773cc1cc071a16ccb70ef4ae1ccdba': 'GotchiBattlerPayout',
  '0x111111125421ca6dc452d289314280a0f8842a65': '1inch1',
  '0x9da2b6102bc1465a0897a1b99d4c30feb69b14c4': 'Scam_Token_$HYPE airdrop',
  '0x07b0727d24397b368e8d7ee1657b3ac6efae6220': 'Scam_Token_0x07b0727d24397b368e8d7ee1657b3ac6efae6220',
  '0x35bd01879726c131787c08d760409ac7689877f6': 'Scam_Token_0x35bd01879726c131787c08d760409ac7689877f6',
  '0x4fd191a6486b9f8af453a917eb1354dd79a0dced': 'Scam_Token_0x4fd191a6486b9f8af453a917eb1354dd79a0dced',
  '0x7b1292f080596f9f3a0f1e740e7e483f07b63bc9': 'Scam_Token_0x7b1292f080596f9f3a0f1e740e7e483f07b63bc9',
  '0x0c73e93abf4ab30bd4501d826301a92aeb9ce71a': 'Scam_Token_0x0c73e93abf4ab30bd4501d826301a92aeb9ce71a',
  '0xc0c359c979d720ad236c945fd57ca3899ec01c5d': 'Scam_Token_0xc0c359c979d720ad236c945fd57ca3899ec01c5d',
  '0x0a87e92cddb4107f059972347a36059021264c0d': 'Scam_Token_0x0a87e92cddb4107f059972347a36059021264c0d',
  '0xc34f23943424188b700feaa9a88830e8b7d1ca23': 'Scam_Token_0xc34f23943424188b700feaa9a88830e8b7d1ca23',
  '0x677793239631d31ab2f412e0b84e00369a2be25d': 'Scam_Token_0x677793239631d31ab2f412e0b84e00369a2be25d',
  '0xa14cbc7bff616780be87c11ba42d9073c672efe1': 'Scam_Token_0xa14cbc7bff616780be87c11ba42d9073c672efe1',
  '0x850b12994188992ea4f26240b04ac698721554f2': 'Scam_Token_0x850b12994188992ea4f26240b04ac698721554f2',
  '0x1e2ea5db3aeb89f9cdf8a89a54d151872f833851': 'Scam_Token_0x1e2ea5db3aeb89f9cdf8a89a54d151872f833851',
  '0x3b13d0f863f1e5f6805a85016701420f41bbddd5': 'Scam_Token_0x3b13d0f863f1e5f6805a85016701420f41bbddd5',
  '0xaddc6cb9eb1b00e6ee4a10af89284d61ae71cb4b': 'Scam_Token_0xaddc6cb9eb1b00e6ee4a10af89284d61ae71cb4b',
  '0x597c44171437c95863b49b6bea9c6e4b31c11151': 'Scam_Token_0x597c44171437c95863b49b6bea9c6e4b31c11151',
}

const CONTRACT_TO_ADDRESS = Object.fromEntries(Object.entries(ADDRESS_TO_CONTRACT).map(([id, value]) => [value, id]))

const GBM_CONTRACT_ADDRESSES = [
  CONTRACT_TO_ADDRESS['GotchiGBM'],
]

const CONTRACT_ERC721 = {
  [CONTRACT_TO_ADDRESS['Aavegotchi']]: 'AG-GOTCHI',
  [CONTRACT_TO_ADDRESS['GotchiRealm']]: 'AG-REALM'
}

const CONTRACT_ERC1155 = {
  '0xa99c4b08201f2913db8d28e71d020c4298f29dbf': {
    // wearables will be populated later
  },
  '0x052e6c114a166b0e91c2340370d72d4c33752b4b': {
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
  },
  '0xebba5b725a2889f7f089a6cae0246a32cad4e26b': {
    '1': {
      asset: 'GV-LGA',
      label: 'LE Golden Aaltaar',
      upgradesTo: '2'
    },
    '10': {
      asset: 'GV-ALT-1',
      label: 'Aaltaar L1',
      upgradesTo: '11'
    },
    '11': {
      asset: 'GV-ALT-2',
      label: 'Aaltaar L2',
      upgradesTo: '12'
    },
    '12': {
      asset: 'GV-ALT-3',
      label: 'Aaltaar L3',
      upgradesTo: '13'
    },
    '13': {
      asset: 'GV-ALT-4',
      label: 'Aaltaar L4',
      upgradesTo: '14'
    },
    '14': {
      asset: 'GV-ALT-5',
      label: 'Aaltaar L5',
      upgradesTo: '15'
    },
    '15': {
      asset: 'GV-ALT-6',
      label: 'Aaltaar L6',
      upgradesTo: '16'
    },
    '65': {
      asset: 'GV-HRV-FOMO-1',
      label: 'FOMO Harvester L1',
      upgradesTo: '66'
    },
    '66': {
      asset: 'GV-HRV-FOMO-2',
      label: 'FOMO Harvester L2',
      upgradesTo: '67'
    },
    '67': {
      asset: 'GV-HRV-FOMO-3',
      label: 'FOMO Harvester L3',
      upgradesTo: '68'
    },
    '68': {
      asset: 'GV-HRV-FOMO-4',
      label: 'FOMO Harvester L4',
      upgradesTo: '69'
    },
    '69': {
      asset: 'GV-HRV-FOMO-5',
      label: 'FOMO Harvester L5',
      upgradesTo: '70'
    },
    '83': {
      asset: 'GV-HRV-KEK-1',
      label: 'KEK Harvester L1',
      upgradesTo: '84'
    },
    '84': {
      asset: 'GV-HRV-KEK-2',
      label: 'KEK Harvester L2',
      upgradesTo: '85'
    },
    '85': {
      asset: 'GV-HRV-KEK-3',
      label: 'KEK Harvester L3',
      upgradesTo: '86'
    },
    '86': {
      asset: 'GV-HRV-KEK-4',
      label: 'KEK Harvester L4',
      upgradesTo: '87'
    },
    '87': {
      asset: 'GV-HRV-KEK-5',
      label: 'KEK Harvester L5',
      upgradesTo: '88'
    },
    '101': {
      asset: 'GV-RES-FOMO-1',
      label: 'FOMO Reservoir L1',
      upgradesTo: '102'
    },
    '102': {
      asset: 'GV-RES-FOMO-2',
      label: 'FOMO Reservoir L2',
      upgradesTo: '103'
    },
    '103': {
      asset: 'GV-RES-FOMO-3',
      label: 'FOMO Reservoir L3',
      upgradesTo: '104'
    },
    '104': {
      asset: 'GV-RES-FOMO-4',
      label: 'FOMO Reservoir L4',
      upgradesTo: '105'
    },
    '105': {
      asset: 'GV-RES-FOMO-5',
      label: 'FOMO Reservoir L5',
      upgradesTo: '106'
    },
    '106': {
      asset: 'GV-RES-FOMO-6',
      label: 'FOMO Reservoir L6',
      upgradesTo: '107'
    },
    '119': {
      asset: 'GV-RES-KEK-1',
      label: 'KEK Reservoir L1',
      upgradesTo: '120'
    },
    '120': {
      asset: 'GV-RES-KEK-2',
      label: 'KEK Reservoir L2',
      upgradesTo: '121'
    },
    '121': {
      asset: 'GV-RES-KEK-3',
      label: 'KEK Reservoir L3',
      upgradesTo: '122'
    },
    '122': {
      asset: 'GV-RES-KEK-4',
      label: 'KEK Reservoir L4',
      upgradesTo: '123'
    },
    '123': {
      asset: 'GV-RES-KEK-5',
      label: 'KEK Reservoir L5',
      upgradesTo: '124'
    }
  },
  '0x617fdb8093b309e4699107f48812b407a7c37938': {
    '1': {
      asset: 'GV-TIL-1',
      label: 'LE Golden Tile - Gotchiverse'
    },
    '2': {
      asset: 'GV-TIL-2',
      label: 'LE Golden Tile - Portal'
    },
    '3': {
      asset: 'GV-TIL-3',
      label: 'LE Golden Tile - Gotchi'
    },
    '4': {
      asset: 'GV-TIL-4',
      label: 'LE Purple Grass'
    },
    '6': {
      asset: 'GV-TIL-6',
      label: 'LE Cyan Grass'
    }
  },
  '0x50af2d63b839aa32b4166fd1cb247129b715186c': {
    '355': {
      asset: 'AG-SCH-355',
      label: 'Safety Glasses Schematic'
    },
    '357': {
      asset: 'AG-SCH-357',
      label: 'Nail Gun Schematic'
    }
  }
}

const importWearables = async function () {
  const wearables = await readJsonFile('./wearables.json')
  console.log(`Found ${wearables.length} wearables`)
  for (const wearable of wearables) {
    CONTRACT_ERC1155['0xa99c4b08201f2913db8d28e71d020c4298f29dbf'][`${wearable.id}`] = {
      asset: `AG-WEAR-${wearable.id}`,
      label: wearable.name
    }
    CONTRACT_ERC1155['0x052e6c114a166b0e91c2340370d72d4c33752b4b'][`${wearable.id}`] = {
      asset: `AG-WEAR-${wearable.id}`,
      label: wearable.name
    }
  }
}

const getInstallationAsset = function (installationId) {
  return CONTRACT_ERC1155[CONTRACT_TO_ADDRESS['GotchiInstallations']][installationId]
}

module.exports.processExports = async (address, fileExport, fileExportInternal, fileExportERC20, fileExportERC721and1155, filenameOut) => {
  if (!address || !fileExport || !fileExportInternal || !fileExportERC20 || !fileExportERC721and1155 || !filenameOut) {
    console.error('Please provide all parameters')
    return
  }
  if ([fileExport, fileExportInternal, fileExportERC20, fileExportERC721and1155].includes(filenameOut)) {
    console.error('Please provide a different output filename')
    return
  }
  address = address.toLowerCase()

  await importWearables()

  const erc1155Prices = await readJsonFile(ERC1155_PRICES_FILENAME)
  const AavegotchiContractAddress = CONTRACT_TO_ADDRESS['Aavegotchi']
  const AavegotchiWearablesContractAddress = CONTRACT_TO_ADDRESS['AavegotchiWearables']
  const findErc1155Price = function(tokenAddress, tokenId, txDate) {
    const date = txDate.substring(0, txDate.indexOf(' ')) // just want the 'YYYY-MM-DD', assume UTC
    // console.log(`Look up ERC1155 price for ${tokenAddress} ${tokenId} at ${date}`)
    let price = erc1155Prices[tokenAddress]?.[tokenId]?.[date] || null
    if (!price) {
      // Special case: wearables were originally under the main Aavegotchi token address,
      // but in late 2022/2023 changed to the Wearable Diamond address.
      if (tokenAddress === AavegotchiWearablesContractAddress) {
        // Prices are stored under the AavegotchiContractAddress
        price = erc1155Prices[AavegotchiContractAddress]?.[tokenId]?.[date] || null
      }
      if (!price) {
        console.warn(`Couldn't find ERC1155 price for ${tokenAddress} ${tokenId} at ${date}`)
      }
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
  // "Transaction Hash","Blockno","UnixTimestamp","DateTime (UTC)","From","To","ContractAddress","Value_IN(ETH)","Value_OUT(ETH)",
  // "CurrentValue @ $2092.17175493234/ETH","TxnFee(ETH)","TxnFee(USD)","Historical $Price/ETH","Status","ErrCode","Method"

  const transactionColumns = [
    'txId',
    'block',
    'timestamp',
    'date',
    'fromAddress',
    'toAddress',
    'contractAddress',
    'ethValueIn',
    'ethValueOut',
    'currentUsdValue',
    'ethValueFee',
    'usdValueFee',
    'priceUsdEth',
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
      ethValueIn: cleanExportedNumber(tx.ethValueIn),
      ethValueOut: cleanExportedNumber(tx.ethValueOut),
      ethValueFee: cleanExportedNumber(tx.ethValueFee),
      status: tx.status,
      errorCode: tx.errorCode,
      method: tx.method
    })
  }

  // "Transaction Hash","Blockno","UnixTimestamp","DateTime (UTC)","ParentTxFrom","ParentTxTo","ParentTxETH_Value","From","TxTo",
  // "ContractAddress","Value_IN(ETH)","Value_OUT(ETH)","CurrentValue @ $2092.17175493234/ETH","Historical $Price/ETH","Status","ErrCode","Type"
  const internalTxColumns = [
    'txId',
    'block',
    'timestamp',
    'date',
    'callerAddress',
    'contractAddress', // contract being called
    'ParentTxETH_Value',
    'fromAddress',
    'toAddress', // own address, when being sent eth
    null, // header says 'ContractAddress' but it's an empty string in export
    'ethValueIn',
    'ethValueOut',
    'currentUsdValue',
    'priceUsdEth',
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
        ethValueIn: cleanExportedNumber(tx.ethValueIn),
        ethValueOut: cleanExportedNumber(tx.ethValueOut),
        status: tx.status,
        errorCode: tx.errorCode,
        type: tx.type
      })
    }
  }

  // "Transaction Hash","Blockno","UnixTimestamp","DateTime (UTC)","From","To","TokenValue","USDValueDayOfTx","ContractAddress","TokenName","TokenSymbol"
  const erc20TxColumns = [
    'txId',
    'block',
    'timestamp',
    'date',
    'fromAddress',
    'toAddress',
    'tokenValue',
    'usdValue',
    'tokenContractAddress',
    'tokenName',
    'tokenSymbol'
  ]

  const findErc20TxColumns = function (fileContents) {
    return erc20TxColumns
  }

  const erc20Txs = await readCsvFile(fileExportERC20, findErc20TxColumns)
  const erc20ScamEntries = []
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
      console.log(`ERC20 transaction for unknown token: ${tx.tokenContractAddress}`, tx)
      const simplifiedName = tx.tokenName.replaceAll(/\W/g, "")
      erc20ScamEntries.push(`'${tx.tokenContractAddress}': 'Scam_Token_${simplifiedName}_${tx.tokenContractAddress}'`)
    }
  }
  if (erc20ScamEntries.length) {
    console.log('All unknown ERC20s:')
    console.log([...new Set(erc20ScamEntries)].join(",\n"))
  }

  // "Transaction Hash","Blockno","UnixTimestamp","DateTime (UTC)","From","To","ContractAddress","TokenName","TokenSymbol","Token ID","Type","Quantity"
  const erc721and1155TxColumns = [
    'txId',
    'block',
    'timestamp',
    'date',
    'fromAddress',
    'toAddress',
    'tokenContractAddress',
    'tokenName',
    'tokenSymbol',
    'tokenId',
    'type',
    'quantity'
  ]

  const findErc721and1155TxColumns = function (fileContents) {
    return erc721and1155TxColumns
  }

  // first look at ERC721
  const erc721and1155Txs = await readCsvFile(fileExportERC721and1155, findErc721and1155TxColumns)
  for (const tx of erc721and1155Txs) {
    if (tx.type !== "721") { continue }
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

  // then look at ERC1155
  const erc155ScamEntries = []
  for (const tx of erc721and1155Txs) {
    if (tx.type !== "1155") { continue }
    initTransaction(tx.txId)
    const tokenContract = ADDRESS_TO_CONTRACT[tx.tokenContractAddress] || ''
    if (!tokenContract) {
      console.log(`Unknown ERC1155 contract: ${tx.tokenContractAddress} (${tx.tokenName})`)
      const simplifiedName = tx.tokenName.replaceAll(/\W/g, "")
      erc155ScamEntries.push(`'${tx.tokenContractAddress}': 'Scam_Token_${simplifiedName}_${tx.tokenContractAddress}'`)
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
      tokenValue: cleanExportedNumber(tx.quantity),
      assetId: tokenDetails?.asset || '',
      assetLabel: tokenDetails?.label || '',
      tokenName: tx.tokenName,
      tokenSymbolFromPolygonscan: tx.tokenSymbol
    })
  }
  if (erc155ScamEntries.length) {
    console.log('All unknown ERC1155s:')
    console.log([...new Set(erc155ScamEntries)].join(",\n"))
  }

  // Inspect and categorise transactions

  const data = {
    address,
    approvals: [],
    reverted: [],
    deposits: [],
    depositsScamDust: [],
    transfers: [],
    trades: [],
    gotchiSummons: [],
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
    scamTransfers: [],
    gotchiTransfersOut: [],
    gotchiTransfersIn: [],
    gotchiverseIncome: [],
    gotchiLendingUpfrontFees: [],
    gotchiLendingBorrowingFees: [],
    gotchiverseCrafting: [],
    gotchiverseInstallationsEquipped: [],
    gotchiverseInstallationUpgrades: [],
    gotchiBattlerIncome: [],
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
      const isCallingGotchiRealm = tx.fromAddress === address && tx.toAddress === CONTRACT_TO_ADDRESS['GotchiRealm']

      if (tx.errorCode === 'execution reverted') {
        data.reverted.push({
          txId: tx.txId,
          date: tx.date,
          ethValueFee: tx.ethValueFee
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
          ethValueFee: tx.ethValueFee
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
            ethValueFee: tx.ethValueFee,
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
            ethValueFee: tx.ethValueFee,
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
                ethValueFee: !assignedFee ? tx.ethValueFee : '0',
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
          ethValueFee: tx.ethValueFee,
          label: 'Approve transfer of raffle tickets'
        })
      } else if (tx.fromAddress === address && tx.toAddress === CONTRACT_TO_ADDRESS['GotchiInstallations'] && tx.method === 'Set Approval For All') {
        data.approvals.push({
          txId: tx.txId,
          date: tx.date,
          fromAddress: tx.fromAddress,
          tokenAddress: tx.toAddress,
          token: 'AG-REALM', // just for somewhere to log the event
          ethValueFee: tx.ethValueFee,
          label: 'Approve transfer of AG Installations'
        })
      } else if (isCallingGotchiRealm && tx.method === 'Set Approval For All') {
        data.approvals.push({
          txId: tx.txId,
          date: tx.date,
          fromAddress: tx.fromAddress,
          tokenAddress: tx.toAddress,
          token: 'AG-REALM',
          ethValueFee: tx.ethValueFee,
          label: 'Approve transfer of AG-REALM'
        })
      } else if (tx.fromAddress === address && [CONTRACT_TO_ADDRESS['AavegotchiWearables'], CONTRACT_TO_ADDRESS['GotchiTiles']].includes(tx.toAddress)
            && tx.method === 'Set Approval For All') {
        data.approvals.push({
          txId: tx.txId,
          date: tx.date,
          fromAddress: tx.fromAddress,
          tokenAddress: tx.toAddress,
          token: 'Gotchi', // just for somewhere to log the event
          ethValueFee: tx.ethValueFee,
          label: 'Approve transfer of AG Assets'
        })
      } else if (isCallingGotchiRealm && ['Equip Installation', 'Batch Equip'].includes(tx.method)) {
        if (
          txGroup.erc1155.length === 0 || txGroup.internal.length || txGroup.erc20.length || txGroup.erc721.length
        ) {
          console.error(`Unexpected 'Equip Installation' txGroup contents`, txGroup)
        } else {
          const erc1155tx = txGroup.erc1155[0]
          const assets = txGroup.erc1155.map(erc1155tx => ({
            asset: erc1155tx.assetId,
            assetContractAddress: erc1155tx.tokenContractAddress,
            assetLabel: erc1155tx.assetLabel,
            amount: erc1155tx.tokenValue
          }))
          const label = `Equip installations ${assets.map(a => `${a.amount} ${a.assetLabel} [${a.asset}]`).join(', ')}`
          data.gotchiverseInstallationsEquipped.push({
            txId: tx.txId,
            date: tx.date,
            assets,
            ethValueFee: tx.ethValueFee,
            label
          })
          console.log(label + ' (lookup land later...)')
        }
      } else if (tx.fromAddress === address && tx.toAddress === CONTRACT_TO_ADDRESS['GotchiInstallations'] && tx.method === 'Upgrade Installation') {
        if (
          !txGroup.erc20.length || txGroup.erc721.length || txGroup.erc1155.length || txGroup.internal.length
        ) {
          console.error(`Unexpected 'Upgrade Installation' txGroup contents`, txGroup)
        } else {
          // This transaction spends alchemica to upgrade installations.
          // It goes to multiple destinations: group them by token type, and remove any with 0 value.
          const assetsByToken = {}
          for (const erc20tx of txGroup.erc20) {
            if ((erc20tx.tokenValue - 0) === 0) {
              continue
            }
            if (erc20tx.fromAddress !== address) {
              console.error(`Unexpected 'Upgrade Installation' txGroup contents: erc20 token not transferred from main address`, erc20tx)
              continue
            }
            if (!assetsByToken[erc20tx.token]) {
              assetsByToken[erc20tx.token] = {
                asset: erc20tx.token,
                assetContractAddress: erc20tx.tokenContractAddress,
                amount: new BigNumber(0)
              }
            }
            const asset = assetsByToken[erc20tx.token]
            asset.amount = asset.amount.plus(new BigNumber(erc20tx.tokenValue))
          }
          const disposed = Object.values(assetsByToken)
          const label = disposed.map(a => `${a.amount} ${a.asset}`).join(', ')
          data.gotchiverseInstallationUpgrades.push({
            txId: tx.txId,
            date: tx.date,
            disposed,
            ethValueFee: tx.ethValueFee,
            label
          })
          console.log(`Upgrade installation, cost ${label} (lookup land and installation later...)`)
        }
      } else if (isCallingAavegotchi && ['Agree Gotchi Lending'].includes(tx.method)) {
        // The account is borrowing a gotchi, spending GHST fee (optionally!) and receiving a gotchi
        if (
          txGroup.erc1155.length || txGroup.internal.length ||
          txGroup.erc721.length !== 1 || txGroup.erc721[0].toAddress !== address ||
          (
            // optional GHST fee, but nothing else
            txGroup.erc20.length > 0 &&
            (
              txGroup.erc20.length > 1 ||
              txGroup.erc20[0].token !== 'GHST' ||
              txGroup.erc20[0].fromAddress !== address
            )
          )
        ) {
          console.error(`Unexpected 'Agree Gotchi Lending' txGroup contents`, txGroup)
        } else {
          const erc20tx = txGroup.erc20[0]
          const label = `Borrow Aavegotchi, paying ${erc20tx ? `${erc20tx.tokenValue} GHST` : 'no'} fee`
          // if there is a fee, record it
          if (erc20tx) {
            const event = {
              txId: tx.txId,
              date: tx.date,
              asset: erc20tx.token,
              assetContractAddress: erc20tx.tokenContractAddress,
              amount: erc20tx.tokenValue,
              ethValueFee: tx.ethValueFee,
              label
            }
            data.gotchiLendingBorrowingFees.push(event)
          } else {
            // No fee: record game action for the transaction fee
            const action = {
              txId: tx.txId,
              date: tx.date,
              ethValueFee: tx.ethValueFee,
              label
            }
            data.gameActions.push(action)
          }
          console.log(label)
        }
      } else if (isCallingAavegotchi && ['Claim Aavegotchi'].includes(tx.method)) {
        if (txGroup.erc20.length !== 1 || txGroup.erc721.length || txGroup.erc1155.length || txGroup.internal.length) {
          console.error(`Unexpected 'Claim Aavegotchi from Portal' txGroup contents`, txGroup)
        } else {
          const erc20tx = txGroup.erc20[0]
          const pocketAddress = erc20tx.toAddress
          const label = `Summon Aavegotchi from portal, depositing ${erc20tx.tokenValue} ${erc20tx.token || 'Unknown Token'} into Gotchi Pocket`
          const event = {
            txId: tx.txId,
            date: tx.date,
            pocketAddress,
            asset: erc20tx.token,
            assetContractAddress: erc20tx.tokenContractAddress,
            amount: erc20tx.tokenValue,
            ethValueFee: tx.ethValueFee,
            label
          }
          data.gotchiSummons.push(event)
          console.log(label)
        }
      } else if (['Claim And End Gotchi Lending', 'Channel Alchemica', 'Claim Available Alchemica'].includes(tx.method) && txGroup.erc20.length) {
        data.gotchiverseIncome.push(txGroup)
        console.log(tx.method + ' with income')
      } else if (
          isCallingAavegotchi && ['Open Portals', 'Interact', 'Set Aavegotchi Name', 'Equip Wearables',
            'Batch Drop Claim XP Drop',
            'Spend Skill Points', 'Set Pet Operator For All', 'Cancel ERC721Listing', 'Cancel ERC1155Listing',
            'Create Whitelist', 'Update Whitelist', 'Remove Addresses From Whitelist',
            'Add Gotchi Lending', 'Cancel Gotchi Lending By Token', 'Cancel Gotchi Lending',
            'Claim And End Gotchi Lending' // we captured the version of this with erc20 income earlier
          ].includes(tx.method)
          ||
          tx.toAddress === CONTRACT_TO_ADDRESS['GotchiRealm'] && [
            'Channel Alchemica', // we captured the version of this with erc20 income earlier; no-income happens when channeling a borrowed gotchi
            'Claim Available Alchemica', // we captured the version of this with erc20 income earlier (hot wallet claims but no erc20 income to hot wallet since alchemica goes to escrow first)
            'Start Surveying',
            'Set Parcels Access Rights',
            'Set Parcels Access Right With Whitelists'
          ].includes(tx.method)
          ||
          tx.toAddress === CONTRACT_TO_ADDRESS['GotchiInstallations'] && [
            'Finalize Upgrades' // This actually mints the upgraded installations, but we will handle them in the earlier upgrade tx; just record ETH fee
          ].includes(tx.method)
          ||
          tx.toAddress === '0xb4cd476e1afb22089a35a1102eae208f15ecdc79' && [
            'Enable Pet Operator'
          ].includes(tx.method)
        ) {
        const label = tx.method
        const action = {
          txId: tx.txId,
          date: tx.date,
          ethValueFee: tx.ethValueFee,
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
          const pocketAddress = outOfPocket ? erc20tx.fromAddress : erc20tx.toAddress
          const label = `Transfer ${erc20tx.tokenValue} ${erc20tx.token || 'Unknown Token'} ${outOfPocket ? 'out of' : 'into'} Gotchi Pocket`
          const transfer = {
            txId: tx.txId,
            date: tx.date,
            outOfPocket,
            pocketAddress,
            asset: erc20tx.token,
            assetContractAddress: erc20tx.tokenContractAddress,
            amount: erc20tx.tokenValue,
            ethValueFee: tx.ethValueFee,
            type: 'Transfer Escrow',
            label
          }
          data.pocketTransfers.push(transfer)
          console.log(label)
        }
      } else if (isCallingAavegotchi && tx.method === 'Batch Transfer Escrow') {
        if (!txGroup.erc20.length || txGroup.erc721.length || txGroup.erc1155.length || txGroup.internal.length) {
          console.error(`Unexpected Gotchi Pocket transfer txGroup contents`, txGroup)
        } else {
          let handledFee = false
          for (const erc20tx of txGroup.erc20) {
            const outOfPocket = erc20tx.toAddress === address
            const pocketAddress = outOfPocket ? erc20tx.fromAddress : erc20tx.toAddress
            const label = `Transfer ${erc20tx.tokenValue} ${erc20tx.token || 'Unknown Token'} ${outOfPocket ? 'out of' : 'into'} Gotchi Pocket (batch tx)`
            const transfer = {
              txId: tx.txId,
              date: tx.date,
              outOfPocket,
              pocketAddress,
              asset: erc20tx.token,
              assetContractAddress: erc20tx.tokenContractAddress,
              amount: erc20tx.tokenValue,
              ethValueFee: !handledFee ? tx.ethValueFee : '0',
              type: 'Transfer Escrow',
              label
            }
            handledFee = true
            data.pocketTransfers.push(transfer)
            console.log(label)
          }
        }
      } else if (isCallingAavegotchi && ['Set ERC1155Listing', 'Add ERC721Listing'].includes(tx.method)) {
        if (txGroup.erc20.length || txGroup.erc721.length || txGroup.erc1155.length) {
          console.error(`Unexpected Baazaar listing txGroup contents`, txGroup)
        } else {
          const label = `Add Baazaar listing`
          data.baazaarListings.push({
            txId: tx.txId,
            date: tx.date,
            ghstAmount: 0, // No listing fee on Base
            ethValueFee: tx.ethValueFee,
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
              asset: 'ETH',
              amount: tx.ethValueFee
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
            ethValueFee: !assignedFee ? tx.ethValueFee : '0',
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
            ethValueFee: !assignedFee ? tx.ethValueFee : '0',
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
              ethValueFee: !assignedFee ? tx.ethValueFee : '0',
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
          ethValueFee: tx.ethValueFee,
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
              ethValueFee: !assignedFee ? tx.ethValueFee : '0',
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
              ethValueFee: !assignedFee ? tx.ethValueFee : '0',
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
            ethValueFee: tx.ethValueFee,
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
            ethValueFee: tx.ethValueFee,
            label
          })
          console.log(label)
        }
      } else if (
          tx.fromAddress === address &&
          [CONTRACT_TO_ADDRESS['GotchiTiles'], CONTRACT_TO_ADDRESS['GotchiInstallations']].includes(tx.toAddress) &&
          ['Craft Tiles', 'Craft Installations'].includes(tx.method) &&
          txGroup.erc1155.length
        ) {

        const acquired = []
        const disposed = []

        // Incoming tiles/installations are erc1155
        for (const erc1155tx of txGroup.erc1155) {
          if (erc1155tx.toAddress !== address) {
            console.error(`Unexpected ${tx.method} erc1155 toAddress contents`, txGroup)
          } else {
            const amount = erc1155tx.tokenValue
            const assetContractAddress = erc1155tx.tokenContractAddress
            const tokenId = erc1155tx.tokenId
            // If we already have an entry for this same erc1155, add the amount
            const matchingEntry = acquired.find(entry => entry.assetContractAddress === assetContractAddress && entry.tokenId === tokenId)
            if (matchingEntry) {
              matchingEntry.amount = new BigNumber(matchingEntry.amount).plus(new BigNumber(amount)).toString()
            } else {
              acquired.push({
                asset: erc1155tx.assetId,
                assetLabel: erc1155tx.assetLabel,
                assetContractAddress,
                tokenId,
                amount
              })
            }
          }
        }

        // Outgoing erc20 used for crafting
        for (const erc20tx of txGroup.erc20) {
          if (erc20tx.fromAddress === address && erc20tx.toAddress !== address) {
            const amount = erc20tx.tokenValue
            const assetContractAddress = erc20tx.tokenContractAddress
            // If we already have an entry for this same erc20, add the amount
            const matchingEntry = disposed.find(entry => entry.assetContractAddress === assetContractAddress)
            if (matchingEntry) {
              matchingEntry.amount = new BigNumber(matchingEntry.amount).plus(new BigNumber(amount)).toString()
            } else {
              disposed.push({
                asset: erc20tx.token,
                assetContractAddress,
                amount
              })
            }
          } else {
            console.error(`Unexpected erc20tx contents in ${tx.method}`, txGroup)
          }
        }

        const label = `${tx.method}: ${acquired.map(item => `${item.amount} "${item.assetLabel}"`).join(', ')} for ${disposed.map(item => `${item.amount} ${item.asset}`).join(', ')}`
        data.gotchiverseCrafting.push({
          txId: tx.txId,
          date: tx.date,
          label,
          acquired,
          disposed,
          fees: [{
            asset: 'ETH',
            amount: tx.ethValueFee
          }]
        })
        console.log(label)
      } else if (
          tx.fromAddress === address &&
          [CONTRACT_TO_ADDRESS['1inch1'], CONTRACT_TO_ADDRESS['1inch2'], CONTRACT_TO_ADDRESS['1inch3'], CONTRACT_TO_ADDRESS['1inch4']].includes(tx.toAddress) &&
          ['0x7c025200', '0x415565b0', 'Swap'].includes(tx.method)
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
              asset: 'ETH',
              amount: tx.ethValueFee
            }]
          })
          data.trades.push(trade)

          let disposedLabels = []
          let acquiredLabels = []
          // main tx
          if (tx.ethValueIn !== '0') {
            trade.acquired.push({
              asset: 'ETH',
              amount: tx.ethValueIn
            })
            acquiredLabels.push(`${tx.ethValueIn} ETH`)
          }
          if (tx.ethValueOut !== '0') {
            trade.disposed.push({
              asset: 'ETH',
              amount: tx.ethValueOut
            })
            disposedLabels.push(`${tx.ethValueOut} ETH`)
          }
          // internal tx
          for (const internalTx of txGroup.internal) {
            if (internalTx.toAddress !== address) {
              console.error(`Unexpected toAddress in trade erc20 tx`, txGroup)
            } else if (internalTx.ethValueOut !== '0') {
              console.error(`Unexpected ethValueOut in trade erc20 tx`, txGroup)
            } else if (internalTx.ethValueIn !== '0') {
              trade.acquired.push({
                asset: 'ETH',
                amount: internalTx.ethValueIn
              })
              acquiredLabels.push(`${internalTx.ethValueIn} ETH`)
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
            asset: 'ETH',
            amount: tx.ethValueFee
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

        if (address === tx.fromAddress && address === tx.toAddress && tx.ethValueIn === '0' && tx.ethValueOut === '0') {
          // zero-size transfer to self
          console.log('Transfer 0 ETH to self')
          transfer.acquired.push({
            asset: 'ETH',
            amount: '0'
          })
          transfer.disposed.push({
            asset: 'ETH',
            amount: '0'
          })
          transfer.label = 'Transfer 0 ETH to self'
        } else {
          if (tx.ethValueIn && tx.ethValueIn !== '0') {
            transfer.acquired.push({
              asset: 'ETH',
              amount: tx.ethValueIn
            })
            transfer.label = `Received ${tx.ethValueIn} ETH`
            console.log(transfer.label)
          }
          if (tx.ethValueOut && tx.ethValueOut !== '0') {
            transfer.disposed.push({
              asset: 'ETH',
              amount: tx.ethValueOut
            })
            transfer.label = `Sent ${tx.ethValueOut} ETH`
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

      const ALCHEMICA_ADDRESSES = ['FUD', 'FOMO', 'ALPHA', 'KEK'].map(token => TOKEN_TO_ADDRESS[token])

      if (
        // Gotchi transfer out (ERC721): could be Baazaar or Lending, will need more info
        //  sent Aavegotchi ERC721
        txGroup.erc721.length > 0 &&  // Batch claim-and-end lending can involve multiple gotchis
        txGroup.erc721[0].fromAddress === address &&
        txGroup.erc721[0].tokenContractAddress === CONTRACT_TO_ADDRESS['Aavegotchi']
      ) {
        data.gotchiTransfersOut.push(txGroup)
        // console.log('Gotchi transfer out (to inspect)')

      } else if (
        // Gotchi transfer in (ERC721): could be a gift or Lending, will need more info
        //  no other assets moved
        txGroup.erc20.length === 0 &&
        txGroup.erc1155.length === 0 &&
        //  received Aavegotchi ERC721
        txGroup.erc721.length === 1 &&
        txGroup.erc721[0].toAddress === address &&
        txGroup.erc721[0].tokenContractAddress === CONTRACT_TO_ADDRESS['Aavegotchi']
      ) {

        data.gotchiTransfersIn.push(txGroup)
        // console.log('Gotchi transfer in (to inspect)')

      // Gotchi Battler
      } else if (
        txGroup.erc721.length === 0 &&
        txGroup.erc1155.length === 0 &&
        txGroup.erc20.length &&
        txGroup.erc20.every(
          erc20tx => erc20tx.toAddress === address &&
            [CONTRACT_TO_ADDRESS['GotchiBattlerPayout']].includes(erc20tx.fromAddress)
            // payout token can vary, allow any
        )
      ) {
        // Extract income
        const date = txGroup.erc20[0].date
        const acquired = []
        for (const erc20tx of txGroup.erc20) {
          if (erc20tx.tokenValue !== '0') {
            acquired.push({
              asset: erc20tx.token,
              assetContractAddress: erc20tx.tokenContractAddress,
              amount: erc20tx.tokenValue
            })
          }
        }
        const label = `Gotchi Battler winnings (${acquired.map(item => `${item.amount} ${item.asset}`).join(', ')})`
        data.gotchiBattlerIncome.push({
          txId: txGroup.txId,
          date,
          label,
          acquired,
          fees: []
        })
        console.log(label)

      // Gotchiverse
      } else if (
        txGroup.erc721.length === 0 &&
        txGroup.erc1155.length === 0 &&
        txGroup.erc20.length &&
        txGroup.erc20.every(
          erc20tx => erc20tx.toAddress === address &&
            [CONTRACT_TO_ADDRESS['VersePayout'], CONTRACT_TO_ADDRESS['VersePayout2'], CONTRACT_TO_ADDRESS['VersePayout3'], CONTRACT_TO_ADDRESS['GotchiRealm']].includes(erc20tx.fromAddress) &&
            ALCHEMICA_ADDRESSES.includes(erc20tx.tokenContractAddress)
        )
      ) {
        data.gotchiverseIncome.push(txGroup)
        // console.log('Gotchiverse income')
      } else if (
        txGroup.erc721.length === 1 &&
        txGroup.erc721[0].tokenContractAddress === CONTRACT_TO_ADDRESS['Aavegotchi'] &&
        txGroup.erc721[0].toAddress === address &&
        txGroup.erc1155.length === 0 &&
        txGroup.erc20.length &&
        txGroup.erc20.every(
          erc20tx => erc20tx.toAddress === address && ALCHEMICA_ADDRESSES.includes(erc20tx.tokenContractAddress)
        )
      ) {
        data.gotchiverseIncome.push(txGroup)
        // console.log('Gotchiverse claimAndEndGotchiLending by borrower with income (alchemica)')
      } else if (
        txGroup.erc721.length === 0 &&
        txGroup.erc1155.length === 0 &&
        txGroup.erc20.length &&
        txGroup.erc20.every(
          erc20tx => erc20tx.toAddress === address && ALCHEMICA_ADDRESSES.includes(erc20tx.tokenContractAddress)
        )
      ) {
        data.gotchiverseIncome.push(txGroup)
        // we'll have to look up the main contract/method called later
        // console.log('Possibly Gotchiverse income (alchemica), or a transfer in ' + txGroup.txId)
      // Baazaar sales
      } else if (
        // Look for Baazaar sale pattern (ERC1155):
        //  received GHST
        txGroup.erc20.length === 1 &&
        txGroup.erc20[0].toAddress === address &&
        txGroup.erc20[0].token === 'GHST' &&
        //  sent Aavegotchi ERC1155
        txGroup.erc1155.length === 1 &&
        txGroup.erc1155[0].fromAddress === address &&
        [CONTRACT_TO_ADDRESS['Aavegotchi'], CONTRACT_TO_ADDRESS['AavegotchiWearables'], CONTRACT_TO_ADDRESS['GotchiInstallations'], CONTRACT_TO_ADDRESS['GotchiTiles'], CONTRACT_TO_ADDRESS['GotchiStaking'], CONTRACT_TO_ADDRESS['GotchiForge']].includes(txGroup.erc1155[0].tokenContractAddress) &&
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
        GBM_CONTRACT_ADDRESSES.includes(txGroup.erc20[0].fromAddress) &&
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

      // GBM claims by the seller (main account is buyer)
      } else if (
        // an NFT has been sent from the GBM contract to the main address
        (txGroup.erc721.length && txGroup.erc721[0].toAddress === address && txGroup.erc721[0].fromAddress === CONTRACT_TO_ADDRESS['GotchiGBM_2023-02']) ||
        (txGroup.erc1155.length && txGroup.erc1155[0].toAddress === address && txGroup.erc1155[0].fromAddress === CONTRACT_TO_ADDRESS['GotchiGBM_2023-02'])
      ) {

        console.group(`Third-party claiming won GBM items`)

        for (const erc721tx of txGroup.erc721) {
          const assetId = erc721tx.assetId
          const assetLabel = erc721tx.assetLabel
          const label = `Claim GBM item: 1 ${assetLabel} (${assetId})`
          if (erc721tx.toAddress !== address) {
            console.error(`Unexpected destination of GBM item in tx ${erc1155tx.txId}`)
          }
          data.gbmClaims.push({
            txId: erc1155tx.txId,
            date: erc1155tx.date,
            tokenId: erc721tx.tokenId,
            asset: assetId,
            assetLabel,
            assetContractAddress: erc721tx.tokenContractAddress,
            amount: '1',
            ethValueFee: '0',
            label
          })
          console.log(label)
        }

        for (const erc1155tx of txGroup.erc1155) {
          const assetId = erc1155tx.assetId
          const assetLabel = erc1155tx.assetLabel
          const amount = erc1155tx.tokenValue
          const label = `Claim GBM item: ${amount} ${assetLabel} (${assetId})`
          if (erc1155tx.toAddress !== address) {
            console.error(`Unexpected destination of GBM item in tx ${erc1155tx.txId}`)
          }
          data.gbmClaims.push({
            txId: erc1155tx.txId,
            date: erc1155tx.date,
            tokenId: erc1155tx.tokenId,
            asset: assetId,
            assetLabel,
            assetContractAddress: erc1155tx.tokenContractAddress,
            amount,
            ethValueFee: '0',
            label
          })
          console.log(label)
        }

        console.groupEnd()


      // Scam token zero-value transfers (ERC20)
      } else if (
        txGroup.erc20.length === 1 &&
        txGroup.erc20[0].fromAddress === address &&
        txGroup.erc20[0].tokenValue === '0' &&
        !txGroup.internal.length &&
        !txGroup.erc721.length &&
        !txGroup.erc1155.length
      ) {
        const erc20tx = txGroup.erc20[0]
        const asset = erc20tx.token
        const label = `Scam token zero-value transfer: ${asset}`
        const transfer = {
          txId: erc20tx.txId,
          date: erc20tx.date,
          label
        }
        data.scamTransfers.push(transfer)
        console.log(label)


      // Scam token airdrops (ERC20)
      } else if (
        txGroup.erc20.length === 1 &&
        (
          txGroup.erc20[0].toAddress === address ||
          txGroup.erc20[0].fromAddress === address
        ) &&
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

      // Scam token airdrops (ERC721)
      } else if (
        txGroup.erc721.length === 1 &&
        txGroup.erc721[0].toAddress === address &&
        txGroup.erc721[0].tokenContract.startsWith('Scam_') &&
        !txGroup.internal.length &&
        !txGroup.erc20.length &&
        !txGroup.erc1155.length
      ) {
        const erc721tx = txGroup.erc721[0]
        const asset = `${erc721tx.tokenContract}:${erc721tx.tokenName}`
        const amount = erc721tx.tokenValue
        const label = `Receive scam ERC721 token airdrop: ${asset}`
        const airdrop = {
          txId: erc721tx.txId,
          date: erc721tx.date,
          acquired: [{
            asset,
            assetLabel: asset,
            assetContractAddress: erc721tx.tokenContractAddress,
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
        const isScamDust = SCAM_DUST_FROM_ADDRESSES.includes(erc20tx.fromAddress)
        const fromLabel = isScamDust ? 'Scam Dust' : erc20tx.fromAddress
        const label = `Receive ${amount} ${asset} from ${fromLabel}`
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
        if (isScamDust) {
          data.depositsScamDust.push(deposit)
        } else {
          data.deposits.push(deposit)
        }

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

  // Lending and gotchiverse
  const gotchiDiamondAbi = await readJsonFile('./gotchiDiamondAbi.json')
  const gotchiDiamondIface = new ethers.utils.Interface(gotchiDiamondAbi)

  // Gotchi Realm diamond: changes over time
  // https://louper.dev/diamond/0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11?network=polygon
  // https://github.com/aavegotchi/aavegotchi-realm-diamond/tree/master/diamondABI
  // diamond_realm.json
  // 2022-06-15
  const gotchiRealm1Abi = await readJsonFile('./gotchiRealm1Abi.json')
  const gotchiRealm1Iface = new ethers.utils.Interface(gotchiRealm1Abi)
  // 2022-06-28 commit removes function "0x3fa75b65"
  // 2023-01-14
  const gotchiRealm2Abi = await readJsonFile('./gotchiRealm2Abi.json')
  const gotchiRealm2Iface = new ethers.utils.Interface(gotchiRealm2Abi)

  // https://louper.dev/diamond/0xebba5b725a2889f7f089a6cae0246a32cad4e26b?network=polygon
  // https://github.com/aavegotchi/aavegotchi-realm-diamond/tree/master/diamondABI
  // diamond_installation.json
  // 2022-07-25
  const gotchiInstallation1Abi = await readJsonFile('./gotchiInstallation1Abi.json')
  const gotchiInstallation1Iface = new ethers.utils.Interface(gotchiInstallation1Abi)
  // 2022-09-02 louper shows function removed "0xf5741bb8" and added "0x7a8555b9"
  // 2023-01-14
  const gotchiInstallation2Abi = await readJsonFile('./gotchiInstallation2Abi.json')
  const gotchiInstallation2Iface = new ethers.utils.Interface(gotchiInstallation2Abi)

  const gotchiVaultAbi = await readJsonFile('./gotchiVaultAbi.json')
  const gotchiVaultIface = new ethers.utils.Interface(gotchiVaultAbi)
  const provider = new ethers.providers.JsonRpcProvider('https://base-rpc.publicnode.com')

  // Fetch transactions for gotchiverseInstallationsEquipped, so we can look up the land
  for (const equippedEvent of data.gotchiverseInstallationsEquipped) {
    const tx = await fetchTransactionEthers(provider, equippedEvent.txId)
    const txDate = new Date(equippedEvent.date)
    let iface
    if (txDate - 0 < new Date('2022-06-28') - 0) {
      // console.log('Using iface 1', equippedEvent.date)
      iface = gotchiRealm1Iface
    } else {
      // console.log('Using iface 2', equippedEvent.date)
      iface = gotchiRealm2Iface
    }
    const decodedInput = iface.parseTransaction({ data: tx.data, value: tx.value })
    if (['equipInstallation', 'batchEquip'].includes(decodedInput.name)) {
      const realmId = decodedInput.args._realmId.toString()
      console.log(`Equipped installations to land ${realmId}`)
      equippedEvent.realmId = realmId;
      equippedEvent.label += ` to land ${realmId}`
    } else {
      console.error('Unexpected method call when equipping installations for tx', equippedEvent.txId, decodedInput)
    }
  }

  // Fetch transactions for gotchiverseInstallationUpgrades, so we can look up the installations and land
  for (const upgradeEvent of data.gotchiverseInstallationUpgrades) {
    const tx = await fetchTransactionEthers(provider, upgradeEvent.txId)
    const txDate = new Date(upgradeEvent.date)
    let iface
    if (txDate - 0 < new Date('2022-09-02') - 0) {
      // console.log('Using iface 1', equippedEvent.date)
      iface = gotchiInstallation1Iface
    } else {
      // console.log('Using iface 2', equippedEvent.date)
      iface = gotchiInstallation2Iface
    }
    const decodedInput = iface.parseTransaction({ data: tx.data, value: tx.value })
    // console.log(decodedInput.name, decodedInput.args)
    const realmId = decodedInput.args._upgradeQueue.parcelId.toString()
    const installationId = decodedInput.args._upgradeQueue.installationId.toString()
    const installationAsset = getInstallationAsset(installationId)
    if (!installationAsset) {
      console.error(`Can't find installation asset ${installationId} for upgrade event ${upgradeEvent.txId}`)
    }
    const upgradedInstallationAssetId = installationAsset.upgradesTo
    const upgradedInstallationAsset = getInstallationAsset(upgradedInstallationAssetId)
    if (!upgradedInstallationAsset) {
      console.error(`Can't find installation asset ${upgradedInstallationAssetId} for upgrade event ${upgradeEvent.txId}`)
    }
    upgradeEvent.realmId = realmId
    upgradeEvent.originalInstallation = {
      id: installationId,
      ...installationAsset
    },
    upgradeEvent.upgradedInstallation = {
      id: upgradedInstallationAssetId,
      ...upgradedInstallationAsset
    }
    upgradeEvent.label = `Upgrade installation "${installationAsset.label}" [${installationId}] on land ${realmId}` +
      ` to "${upgradedInstallationAsset.label}" [${upgradedInstallationAssetId}] (cost: ${upgradeEvent.label})`
    console.log(upgradeEvent.label)
  }

  // Process gotchiverseIncome events to standard format, with ethValueFee (if has 'main' tx) and ERC20 tokens.
  const gotchiverseIncomeToKeep = []
  for (const txGroup of data.gotchiverseIncome) {
    // Warn if unexpected format
    if (!txGroup.erc20.length ||
      txGroup.internal.length ||
      txGroup.erc1155.length ||
      txGroup.erc721.length > 1 ||
      txGroup.erc721[0] && txGroup.erc721[0].tokenContractAddress !== CONTRACT_TO_ADDRESS['Aavegotchi']
    ) {
      console.error(`Unexpected txGroup contents for gotchiverseIncome ${txGroup.txId}`)
      continue
    }
    // Confirm the type of event: channeling, harvesting, lending, batch payouts
    let knownMethod = null
    let tx = null
    if (
      txGroup.main.length === 1 &&
      txGroup.main[0].toAddress.toLowerCase() === CONTRACT_TO_ADDRESS['GotchiRealm'] &&
      ['Channel Alchemica', 'Claim Available Alchemica'].includes(txGroup.main[0].method)
    ) {
      knownMethod = txGroup.main[0].method
    } else {
      tx = await fetchTransactionEthers(provider, txGroup.txId)
      if (tx.to.toLowerCase() === CONTRACT_TO_ADDRESS['Aavegotchi']) {
        const decodedInput = gotchiDiamondIface.parseTransaction({ data: tx.data, value: tx.value })
        knownMethod = decodedInput.name
      } else if ([CONTRACT_TO_ADDRESS['VersePayout'], CONTRACT_TO_ADDRESS['VersePayout2'], CONTRACT_TO_ADDRESS['VersePayout3']].includes(tx.from.toLowerCase())) {
        knownMethod = 'Batch payout'
      } else {
        // console.log(`Unexpected gotchiverseIncome tx ${txGroup.txId}`)
        // we'll store this elsewhere in data
      }
    }

    // Extract income
    const date = txGroup.erc20[0].date
    const acquired = []
    for (const erc20tx of txGroup.erc20) {
      if (erc20tx.tokenValue !== '0') {
        acquired.push({
          asset: erc20tx.token,
          assetContractAddress: erc20tx.tokenContractAddress,
          amount: erc20tx.tokenValue
        })
      }
    }
    if (!acquired.length) {
      // no income to record
      // If this was self-submitted, log it as a game event for the ETH fee
      if (txGroup.main.length) {
        data.gameActions.push({
            txId: txGroup.txId,
            date,
            ethValueFee: txGroup.main[0].ethValueFee,
            label: txGroup.main[0].method
        })
        console.log(`Gotchiverse ${txGroup.main[0].method} (no income)`)
      } else {
        // console.log('Gotchiverse claim without income')
      }
    } else {
      // record income
      const fees = []
      if (txGroup.main.length) {
        fees.push({
          asset: 'ETH',
          amount: txGroup.main[0].ethValueFee
        })
      }
      if (knownMethod) {
        const label = `Gotchiverse income (${acquired.map(item => `${item.amount} ${item.asset}`).join(', ')}) via ${knownMethod}`
        console.log(label)
        gotchiverseIncomeToKeep.push({
          txId: txGroup.txId,
          date,
          label,
          acquired,
          fees
        })
      } else {
        // Not recognised as gotchiverse income, so record as deposit or unprocessed
        if (!txGroup.main.length && tx) {
          const fromAddress = tx.from.toLowerCase()
          const label = `Receive ${acquired.map(item => `${item.amount} ${item.asset}`).join(', ')} from ${fromAddress}`
          data.deposits.push({
            txId: txGroup.txId,
            date,
            label,
            fromAddress,
            acquired
          })
          console.log(label)
        } else {
          data.unprocessed.push(txGroup)
        }
      }
    }
  }
  data.gotchiverseIncome = gotchiverseIncomeToKeep

  // Fetch tx for gotchiTransfersOut and gotchiTransfersIn:
  //   - if from lending, remove from this list
  //      - if gotchiTransfersOut has GHST received from upfront fee, log this
  //   - leave remaining gotchiTransfersIn/gotchiTransfersOut in this list for manual review

  const gotchiTransfersOutToKeep = []
  for (const txGroup of data.gotchiTransfersOut) {
    const tx = await fetchTransactionEthers(provider, txGroup.txId)
    // console.log({ tx })
    const toAddress = tx.to.toLowerCase()
    let decodedInput
    if (toAddress == CONTRACT_TO_ADDRESS['Aavegotchi']) {
      decodedInput = gotchiDiamondIface.parseTransaction({ data: tx.data, value: tx.value })
    } else if (toAddress === CONTRACT_TO_ADDRESS['GotchiVault']) {
      decodedInput = gotchiVaultIface.parseTransaction({ data: tx.data, value: tx.value })
    } else {
      console.error(`Unrecognised contract in transaction which transfers out a gotchi. tx: ${txGroup.txId}, to: ${toAddress}`)
    }
    // console.log({
    //   txId: txGroup.txId,
    //   name: decodedInput.name,
    //   signature: decodedInput.signature,
    //   args: decodedInput.args
    // })

    if (toAddress == CONTRACT_TO_ADDRESS['Aavegotchi'] && decodedInput.name === 'agreeGotchiLending') {
      // We'll ignore the gotchi transfer for lending, but there may be some income to log
      if (
        // Look for GHST fee received
        txGroup.erc20.length === 1 &&
        txGroup.erc20[0].tokenContractAddress === TOKEN_TO_ADDRESS['GHST'] &&
        txGroup.erc20[0].toAddress === address
      ) {
        const erc20tx = txGroup.erc20[0]
        const ghstAmount = erc20tx.tokenValue
        const label = `Gotchi lending agreed (${ghstAmount} GHST fee)`
        data.gotchiLendingUpfrontFees.push({
          txId: txGroup.txId,
          date: erc20tx.date,
          label,
          acquired: [
            {
              asset: "GHST",
              assetContractAddress: erc20tx.tokenContractAddress,
              amount: ghstAmount
            }
          ]
        })
        console.log(label)
      } else {
        console.log('Gotchi lending agreed (no fee) ' + txGroup.txId)
      }
    } else if (
      (
        toAddress === CONTRACT_TO_ADDRESS['GotchiVault'] &&
        decodedInput.name === 'claimAndEndGotchiLending'
      )
      ||
      (
        toAddress === CONTRACT_TO_ADDRESS['Aavegotchi'] &&
        ['claimAndEndGotchiLending', 'batchClaimAndEndGotchiLending'].includes(decodedInput.name)
      )
    ) {
      // This is when an owner claims back their lent-out gotchis,
      // which distributes any alchemica back to the borrowers.
      // We'll ignore the gotchi transfer for lending, but there may be some income to log
      if (txGroup.erc20.length) {
        // Group by ERC20 token type
        const assetsByToken = {}
        for (const erc20tx of txGroup.erc20) {
          if ((erc20tx.tokenValue - 0) === 0) {
            continue
          }
          if (erc20tx.toAddress !== address) {
            console.error(`Unexpected '${decodedInput.name}' txGroup contents: erc20 token not transferred to main address`, erc20tx)
            continue
          }
          if (!assetsByToken[erc20tx.token]) {
            assetsByToken[erc20tx.token] = {
              asset: erc20tx.token,
              assetContractAddress: erc20tx.tokenContractAddress,
              amount: new BigNumber(0)
            }
          }
          const asset = assetsByToken[erc20tx.token]
          asset.amount = asset.amount.plus(new BigNumber(erc20tx.tokenValue))
        }
        const acquired = Object.values(assetsByToken)

        const label = `Gotchiverse income (${acquired.map(item => `${item.amount} ${item.asset}`).join(', ')}) via borrowing gotchis (${decodedInput.name})`
        const erc20tx = txGroup.erc20[0]
        data.gotchiverseIncome.push({
          txId: txGroup.txId,
          date: erc20tx.date,
          label,
          acquired,
          fees: []
        })
        console.log(label)
      } else {
        console.log(`Claim of borrowed gotchis without any income to record (tx: ${txGroup.txId})`)
      }
    } else {
      // Misc other gotchi transfer
      gotchiTransfersOutToKeep.push(txGroup)
      console.log(`Gotchi transfer ${decodedInput.name}`)
    }
  }
  data.gotchiTransfersOut = gotchiTransfersOutToKeep

  // These gotchi transfers-in don't have income (those would have been put in gotchiverseIncome earlier)
  const gotchiTransfersInToKeep = []
  for (const txGroup of data.gotchiTransfersIn) {
    const tx = await fetchTransactionEthers(provider, txGroup.txId)
    // console.log({ tx })
    const decodedInput = gotchiDiamondIface.parseTransaction({ data: tx.data, value: tx.value })
    if (decodedInput.name === 'claimAndEndGotchiLending') {
      console.log('Gotchi lending finished by borrower (no income to record) ' + txGroup.txId)
    } else {
      gotchiTransfersInToKeep.push(txGroup)
    }
  }
  data.gotchiTransfersIn = gotchiTransfersInToKeep

  console.log(`After processing lending, we now have ${Object.keys(allTransactions).length} transactions: found for ${Object.entries(data).map(([id, list]) => id === 'address' ? list : `${list.length} ${id}`).join(', ')}`)


  // GBM
  // TODO switch over to ethers to fetch and parse txs

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
        console.error(`Couldn't find auction claim's corresponding bid price - please ensure all GBM transactions are provided in the basescan export`, auction.claim)
      }
    }
  }

  // Look for 1inch trades that were executed by the aggregation router,
  // which are ERC20 transfers with one token in and a different token out (or one ETH internal transfer)
  const nowProcessed = []
  const is1inchOrderFilledLog = function (log) {
    return log && [CONTRACT_TO_ADDRESS['1inch1'], CONTRACT_TO_ADDRESS['1inch2']].includes(log.address.toLowerCase())
  }
  for (const txGroup of data.unprocessed) {
    if (
      !txGroup.main.length &&
      !txGroup.erc721.length &&
      !txGroup.erc1155.length &&
      (
        (!txGroup.internal.length && txGroup.erc20.length === 2) ||
        (txGroup.internal.length === 1 && txGroup.erc20.length === 1)
      )
    ) {
      // extract acquired and disposed asset details from erc20/internal transfers to/from the target address
      let acquiredAsset = null
      let disposedAsset = null
      let date = txGroup.erc20[0].date
      if (txGroup.internal.length) {
        // 1 ETH transfer, 1 erc20 transfer
        if (
          txGroup.internal[0].toAddress === address &&
          txGroup.erc20[0].fromAddress === address
        ) {
          // received ETH, disposed ERC20
          acquiredAsset = {
            asset: 'ETH',
            amount: txGroup.internal[0].ethValueIn
          }
          disposedAsset = {
            asset: txGroup.erc20[0].token,
            assetContractAddress: txGroup.erc20[0].tokenContractAddress,
            amount: txGroup.erc20[0].tokenValue
          }
        } else {
          // TODO could add support for selling ETH for ERC20, but don't have an example transaction for it yet
          // unknown transfer pattern, leave it unprocessed
          continue
        }
      } else {
        // 2 erc20 transfers
        const txsToAddress = txGroup.erc20.filter(tx => tx.toAddress === address)
        const txsFromAddress = txGroup.erc20.filter(tx => tx.fromAddress === address)
        if (
          txsToAddress.length === 1 &&
          txsFromAddress.length === 1 &&
          txsToAddress[0].token !== txsFromAddress[0].token
        ) {
          const tokenSold = txsFromAddress[0]
          const tokenBought = txsToAddress[0]
          acquiredAsset = {
            asset: tokenBought.token,
            assetContractAddress: tokenBought.tokenContractAddress,
            amount: tokenBought.tokenValue
          }
          disposedAsset = {
            asset: tokenSold.token,
            assetContractAddress: tokenSold.tokenContractAddress,
            amount: tokenSold.tokenValue
          }
        } else {
          // unknown transfer pattern, leave it unprocessed
          continue
        }
      }
      if (acquiredAsset && disposedAsset) {
        // console.log(`unprocessed likely trade of ${disposedAsset.amount} ${disposedAsset.asset} to ${acquiredAsset.amount} ${acquiredAsset.asset}`, txGroup)
        const tx = await fetchTransactionReceiptEthers(provider, txGroup.txId)
        // console.log('Fetched tx receipt', tx)
        // Transaction receipt event logs contain an OrderFilled for 1inch contract
        if (tx.logs.some(is1inchOrderFilledLog)) {
          const soldLabel = `${disposedAsset.amount} ${disposedAsset.asset || disposedAsset.assetContractAddress}`
          const boughtLabel = `${acquiredAsset.amount} ${acquiredAsset.asset || acquiredAsset.assetContractAddress}`
          const label = `1inch gasless trade: ${soldLabel} -> ${boughtLabel} (${date})`
          console.log(label)
          // construct trade record, and remove from unprocessed
          nowProcessed.push(txGroup)
          const trade = ({
            txId: txGroup.txId,
            date,
            label,
            acquired: [acquiredAsset],
            disposed: [disposedAsset],
            fees: []
          })
          data.trades.push(trade)
        }
      }
    }
  }
  if (nowProcessed.length) {
    data.unprocessed = data.unprocessed.filter(item => !nowProcessed.includes(item))
  }


  console.log(`After processing gasless trades, we now have ${Object.keys(allTransactions).length} transactions: found for ${Object.entries(data).map(([id, list]) => id === 'address' ? list : `${list.length} ${id}`).join(', ')}`)

  // Finished, export result
  await writeJsonFile(filenameOut, { data, allTransactions })
  console.log(`Written ${filenameOut}`)
}

function cleanExportedNumber(numberString) {
  if (!numberString) { return numberString }
  // polygonscan exports large numbers with thousands separator ','
  return numberString.replaceAll(',', '')
}