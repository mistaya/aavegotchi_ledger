const BigNumber = require('bignumber.js')
const axios = require('axios')
const { writeJsonFile, readJsonFile } = require('../fileUtils.js')
const { DateTime } = require('luxon')

const ERC721_SALES_FILENAME = 'erc721Sales.json'
const ERC721_ANNOTATED_FILENAME = 'erc721SalesAnnotated.json'
const ERC1155_SALES_FILENAME = 'erc1155Sales.json'
const ERC1155_ANNOTATED_FILENAME = 'erc1155SalesAnnotated.json'
const ERC1155_PRICES_FILENAME = 'erc1155Prices.json'

const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic'
const FETCH_PAGE_SIZE = 1000

const fetchErc721Sales = function () {
  return new Promise((resolve, reject) => {
    let erc721Listings = []
    let lastId = ''
    const fetchFromSubgraph = function () {
      console.log(`Fetching batch of ERC721 listings... ${lastId}`)
      axios.post(SUBGRAPH_URL, {
        query: `{
          erc721Listings(first: ${FETCH_PAGE_SIZE}, orderBy: id, where: { id_gt: "${lastId}", cancelled: false, buyer_not: null }) {
            id
            category
            erc721TokenAddress
            tokenId
            seller
            buyer
            timeCreated
            timePurchased
            priceInWei
            gotchi {
              id
            }
            portal {
              id
            }
            parcel{
              id
              parcelHash
            }
            hauntId
            kinship
            baseRarityScore
            modifiedRarityScore
            equippedWearables
            fudBoost
            fomoBoost
            alphaBoost
            kekBoost
            district
            size
          }
        }`
      }).then(async response => {
        if (response.data.data?.erc721Listings) {
          erc721Listings = erc721Listings.concat(response.data.data.erc721Listings)
          if (response.data.data.erc721Listings.length < FETCH_PAGE_SIZE) {
            // finished fetching all pages
            await writeJsonFile(ERC721_SALES_FILENAME, erc721Listings)
            console.log(`Fetched all ERC721 sales and written ${ERC721_SALES_FILENAME}`)
            resolve()
            return
          }
          // fetch the next page of results
          lastId = erc721Listings[erc721Listings.length - 1].id
          fetchFromSubgraph()
        } else {
          console.error('Unexpected response', response.data?.errors)
          reject()
        }
      }).catch(error => {
        console.error(error)
        reject()
      })
    }

    fetchFromSubgraph()
  })
}

const fetchErc1155Sales = function () {
  return new Promise((resolve, reject) => {
    let sales = []
    let lastId = ''
    const fetchFromSubgraph = function () {
      console.log(`Fetching batch of ERC1155 listings... ${lastId}`)
      axios.post(SUBGRAPH_URL, {
        query: `{
          erc1155Purchases (first: ${FETCH_PAGE_SIZE}, orderBy: id, where: { id_gt: "${lastId}" }) {
            id
            listingID
            category
            erc1155TokenAddress
            erc1155TypeId
            seller
            buyer
            priceInWei
            quantity
            timeLastPurchased
            rarityLevel
          }
        }`
      }).then(async response => {
        if (response.data.data?.erc1155Purchases) {
          sales = sales.concat(response.data.data.erc1155Purchases)
          if (response.data.data.erc1155Purchases.length < FETCH_PAGE_SIZE) {
            // finished fetching all pages
            await writeJsonFile(ERC1155_SALES_FILENAME, sales)
            console.log(`Fetched all ERC1155 sales and written ${ERC1155_SALES_FILENAME}`)
            resolve()
            return
          }
          // fetch the next page of results
          lastId = sales[sales.length - 1].id
          fetchFromSubgraph()
        } else {
          console.error('Unexpected response', response.data?.errors)
          reject()
        }
      }).catch(error => {
        console.error(error)
        reject()
      })
    }

    fetchFromSubgraph()
  })
}


const annotateErc721Sales = async function () {
  console.log('Annotating ERC721 sales')
  const sales = await readJsonFile(ERC721_SALES_FILENAME)

  const salesAnnotated = sales.map(sale => ({
    ...sale,
    datePurchased: (new Date(1000 * (sale.timePurchased - 0))).toISOString()
  }))
  salesAnnotated.sort((a, b) => {
    if (a.datePurchased === b.datePurchased) { return 0 }
    return a.datePurchased < b.datePurchased ? -1 : 1
  })

  await writeJsonFile(ERC721_ANNOTATED_FILENAME, salesAnnotated)
  console.log(`Written ${ERC721_ANNOTATED_FILENAME}`)
}

const annotateErc1155Sales = async function () {
  console.log('Annotating ERC1155 sales')
  const sales = await readJsonFile(ERC1155_SALES_FILENAME)

  const salesAnnotated = sales.map(sale => ({
    ...sale,
    dateLastPurchased: (new Date(1000 * (sale.timeLastPurchased - 0))).toISOString()
  }))
  salesAnnotated.sort((a, b) => {
    if (a.dateLastPurchased === b.dateLastPurchased) { return 0 }
    return a.dateLastPurchased < b.dateLastPurchased ? -1 : 1
  })

  await writeJsonFile(ERC1155_ANNOTATED_FILENAME, salesAnnotated)
  console.log(`Written ${ERC1155_ANNOTATED_FILENAME}`)
}

const calculateErc1155Prices = async function () {
  console.log('Calculating ERC1155 prices')
  const sales = await readJsonFile(ERC1155_ANNOTATED_FILENAME)

  if (!sales.length) {
    console.error('No sales found!')
    return
  }

  // sales are sorted by date
  const START_DATE = DateTime.fromISO(sales[0].dateLastPurchased).toUTC().startOf('day')
  const END_DATE = DateTime.now().toUTC().startOf('day')
  const PRICE_RANGE_DAYS = 7
  const PROVISIONAL_DATE = END_DATE.minus({ days: PRICE_RANGE_DAYS })
  const dates = []
  let targetDate = START_DATE
  while (targetDate <= END_DATE) {
    dates.push(targetDate);
    targetDate = targetDate.plus({ days: 1 })
  }

  // Store prices:
  //   tokenAddress {}
  //     tokenId {}
  //       sales []
  //       prices {}
  //         date :
  //           average price over +/- 7 days

  // Group the sales by ERC1155 token
  const prices = {}
  for (const sale of sales) {
    if (!prices[sale.erc1155TokenAddress]) {
      prices[sale.erc1155TokenAddress] = {}
    }
    if (!prices[sale.erc1155TokenAddress][sale.erc1155TypeId]) {
      prices[sale.erc1155TokenAddress][sale.erc1155TypeId] = { sales: [], prices: {} }
    }
    prices[sale.erc1155TokenAddress][sale.erc1155TypeId].sales.push({
      ...sale,
      dateLastPurchased: DateTime.fromISO(sale.dateLastPurchased)
    })
  }

  // Calculate daily prices by averaging sales over the last 7 and next 7 days
  for (const tokenAddress in prices) {
    for (const tokenId in prices[tokenAddress]) {
      const tokenSales = prices[tokenAddress][tokenId].sales
      const pricesByDate = prices[tokenAddress][tokenId].prices
      let firstPrice = null
      let previousPrice = null
      for (const date of dates) {
        const dateRangeStart = date.minus({ days: PRICE_RANGE_DAYS })
        const dateRangeEnd = date.plus({ days: PRICE_RANGE_DAYS })
        // console.log(`Calculate price for ${tokenAddress}:${tokenId} on ${date.toISODate()} (${tokenSales.length} total sales)`)
        const salesInRange = tokenSales.filter(({ dateLastPurchased }) => dateLastPurchased >= dateRangeStart && dateLastPurchased <= dateRangeEnd)
        let total = new BigNumber(0)
        for (const sale of salesInRange) {
          total = total.plus((new BigNumber(sale.priceInWei)).div(10e17))
        }
        const hasSales = salesInRange.length > 0
        const averagePrice = hasSales ? total.div(salesInRange.length) : null
        const dateInProvisionalRange = date >= PROVISIONAL_DATE
        // console.log(` - found average price ${averagePrice} GHST, from ${salesInRange.length} sales in range ${dateRangeStart.toISODate()} - ${dateRangeEnd.toISODate()}`)
        pricesByDate[date.toISODate()] = hasSales ?
          {
            price: averagePrice,
            numSales: salesInRange.length,
            type: dateInProvisionalRange ? 'provisional_mean' : 'mean'
          } :
          {
            price: previousPrice,
            numSales: 0,
            type: dateInProvisionalRange ? 'provisional_previous' : 'previous'
          }
        if (hasSales) {
          if (firstPrice === null) {
            firstPrice = averagePrice
          }
          previousPrice = averagePrice
        }
      }
      // if the first few dates were missing prices, use the next (first) available price, or mark as unavailable if there is no price
      const type = firstPrice === null ? 'unavailable' : 'next'
      for (const date of dates) {
        if (pricesByDate[date.toISODate()].price === null) {
          pricesByDate[date.toISODate()].price = firstPrice
          pricesByDate[date.toISODate()].type = type
        } else {
          break
        }
      }
    }
  }

  // remove sales from the object before writing file
  for (const tokenAddress in prices) {
    for (const tokenId in prices[tokenAddress]) {
      prices[tokenAddress][tokenId] = prices[tokenAddress][tokenId].prices
    }
  }
  await writeJsonFile(ERC1155_PRICES_FILENAME, prices)
  console.log(`Calculated prices between ${START_DATE.toISODate()} - ${END_DATE.toISODate()}`)
  console.log(`Written ${ERC1155_PRICES_FILENAME}`)
  console.log(`WARNING: average prices calculated for the last ${PRICE_RANGE_DAYS} days (${PROVISIONAL_DATE.toISODate()} onwards, assuming the sales data was fetched today) are subject to change! These have been marked as 'provisional'.`)
}

const fetchAll = function () {
  const fetching721 = fetchErc721Sales().then(annotateErc721Sales)
  const fetching1155 = fetchErc1155Sales().then(annotateErc1155Sales)
  Promise.all([fetching721, fetching1155]).then(calculateErc1155Prices)
}

//----------------------------------------------
// Uncomment the function to call

fetchAll()
// fetchErc721Sales()
// fetchErc1155Sales()
// annotateErc721Sales()
// annotateErc1155Sales()
// calculateErc1155Prices()