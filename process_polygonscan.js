const BigNumber = require('bignumber.js')
const { readJsonFile, readCsvFile, writeJsonFile } = require('./fileUtils.js')
const fetchTransaction = require('./fetchTransaction.js')
const fetchTransactionEthers = require('./fetchTransactionEthers.js')
const fetchTransactionReceiptEthers = require('./fetchTransactionReceiptEthers.js')
const ethers = require('ethers')
// Don't use exponential notation
BigNumber.config({ EXPONENTIAL_AT: [-100, 100] })

const ERC1155_PRICES_FILENAME = './prices/erc1155Prices.json'

const SCAM_DUST_FROM_ADDRESSES = [
  '0xd24d554728385fc84fcf19d53cfea5f89a6d339b',
  '0x17b2a831d132e01cc93b12a379ef74402728f49a'
]

const ADDRESS_TO_TOKEN = {
  '0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7': 'GHST',
  '0x403e967b044d4be25170310157cb1a4bf10bdd0f': 'FUD',
  '0x44a6e0be76e1d9620a7f76588e4509fe4fa8e8c8': 'FOMO',
  '0x6a3e7c3c6ef65ee26975b12293ca1aad7e1daed2': 'ALPHA',
  '0x42e5e06ef5b90fe15f853f59299fc96259209c5c': 'KEK',
  '0x3801c3b3b5c98f88a9c9005966aa96aa440b9afc': 'GLTR',
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'USDT',
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 'USDC', // original version, polygonscan now says USDC.e PoS
  '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 'USDC', // newer version (official Circle)
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': 'DAI',
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': 'WMATIC',
  '0x1a13f4ca1d028320a707d99520abfefca3998b7f': 'amUSDC',
  '0x1d2a0e5ec8e5bbdca5cb219e649b565d8e5c3360': 'amAAVE',
  '0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4': 'amWMATIC',
  '0x28424507fefb6f7f8e9d3860f56504e4e5f5f390': 'amWETH',
  '0x27f8d03b3a2196956ed754badc28d73be8830a6e': 'amDAI',
  '0x8c8bdbe9cee455732525086264a4bf9cf821c498': 'maUNI',
  '0x73958d46b7aa2bc94926d8a215fa560a5cdca3ea': 'wapGHST',
  '0x6e14790535c04b1a58592fbee6109d9bc57a51ad': 'VLT',
  '0xce899f26928a2b21c6a2fddd393ef37c61dba918': 'MOCA',
  '0x162539172b53e9a93b7d98fb6c41682de558a320': 'GONE',
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
  '0x14f2c84a58e065c846c5fdddade0d3548f97a517': 'Scam_Token_MATICSWAP',
  '0xf31cdb090d1d4b86a7af42b62dc5144be8e42906': 'Scam_Token_0Bets',
  '0x92face859e48c5d70510bf9bbc60a4b4c4fc8b98': 'Scam_Token_ERC20',
  '0xf11191cc9567656586924795965cc371f2206f8a': 'Scam_Token_ERC202',
  '0x2aad6b23c189b82e50d8c24c8c1c6058a3ef9960': 'Scam_Token_ERC203',
  '0x24cb8f3a022fbd40aee3a9dc035889b309fa6177': 'Scam_Token_ERC204',
  '0x2f11137deec67b5adaf24b49381709b312a6dcf2': 'Scam_Token_$Aavegotchi_GHST',
  '0x650a15efcef2c0420d1242dec0c4e5975ccf842b': 'Scam_Token_goodgames',
  '0x5229cadb824fd5117f00e3614c138b62f2bd3156': 'Scam_Token_0x5229c',
  '0x913d3da68394eeafc22f5bd43407f2d1d7cfa172': 'Scam_Token_BirdCoin',
  '0x10657d9bb24b4cd808e42ef4ad4c0fd3b07ddb21': 'Scam_Token_2XBNB',
  '0x7f4c2f7671e6817bb01195d24e4eafc94435f5d0': 'Scam_Token_0x7f4c',
  '0x7a52be6bfe2ee945ab347b56670829b763d73861': 'Scam_Token_Owlswap',
  '0x0f1f17e4260515d9bfe805cff323374eb771eae6': 'Scam_Token_Rickogon',
  '0x8a6b62f5501410d179641e731a8f1cecef1c28ec': 'Scam_Token_PolygonClassics',
  '0xaf6b1a3067bb5245114225556e5b7a52cf002752': 'Scam_Token_0xaf6b1a',
  '0xcf68f02d7dd6a4642ae6a77f6a3676d0cbc834c9': 'Scam_Token_GGBoxs',
  '0x2e618eabe66818f4c6718c24f59c5694f0b2735a': 'Scam_Token_SIMP',
  '0xe93ef372237c3184af3db173ef1881eec94b1021': 'Scam_Token_HEXPool',
  '0x25c3f5ef0328eb71388b77da1c3ee458ec5c1ffb': 'Scam_Token_HEXPool2',
  '0x49b6b6b01937828ccab01d0ef4abea0237d94b8a': 'Scam_Token_PNSTAKE',
  '0x56a3edba6e17a22bd08f80ad426268bba6e4751e': 'Scam_Token_USDC_FAKE',
  '0x34f18b7ad0b2d8850b13c716d20272af141e087b': 'Scam_Token_USD_FAKE',
  '0xf96ccc3d690007abd3ce07349068cefbc210f1d5': 'Scam_Token_LRETH',
  '0xdd5cd04c7edd7a12fa6d62f088d9b9df9678530d': 'Scam_Token_vanity-address',
  '0x0000065a20d6689430601581a21f28014594f74e': 'Scam_Token_PUNKWL',
  '0x17868e575a7c6a65460272c8ec74ac4ac89e385e': 'Scam_Token_LINKBonus',
  '0x2efebacc71f0e281989acbb497b92d55c828777a': 'Scam_Token_LINKBonus2',
  '0x0d0c2dd3b1b67f6052eab607e082517932334048': 'Scam_Token_SNXPool',
  '0x8a73cf4a610f45144566e9c739b32e9a17ea75bb': 'Scam_Token_RareTrx',
  '0x9b8cc6320f22325759b7d2ca5cd27347bb4ecd86': 'Scam_Token_pointless',
  '0x46f29ee74ab63704cbf941530849e3c35ac7879f': 'Scam_Token_BTBSaga',
  '0x114d232f8befea9fa2fb0a06dee069c856d61bfc': 'Scam_Token_SEXY',
  '0xb27cea9e38eeb387d3b0672287ca304fbff00b7c': 'Scam_Token_LensRewards',
  '0x68c929e7b8fb06c58494a369f6f088fff28f7c77': 'Scam_Token_0Betsio',
  '0x68bd1a34f89ba7bb43b6b76355c0f27ed6311f38': 'Scam_Token_0Betsio2',
  '0x523e309bcd48a58a7ffdb16edf357c1b08e5b847': 'Scam_Token_JTO',
  '0xac8a3329fae15f0a39e33ecbd5f6f64d29d70121': 'Scam_Token_USDC_FAKE2',
  '0x247833686b12791f258128788ce6d632796b342e': 'Scam_Token_mog',
  '0x9355e47e971cbc462e297a81175d2e7dbbd5c1a3': 'Scam_Token_UNI',
  '0x382586651f043cbdec7bb586e367d77b26d7d149': 'Scam_Token_WGC',
  '0x9e99acced32e848388c52c8d771af32c42501a12': 'Scam_Token_zksync',
  '0x1ef250b4a02505cfb4fba4d1ce1bb7e411851739': 'Scam_Token_kuroro',
  '0xfddba7ca7af59ac1b3cc144c08db9bdde7378dd5': 'Scam_Token_RubberDucky_0xfddba7ca7af59ac1b3cc144c08db9bdde7378dd5',
  '0x655304e9cc103b47f0afa0825767d6cce426717c': 'Scam_Token_OSSChain_0x655304e9cc103b47f0afa0825767d6cce426717c',
  '0x886f107df86a9c1b04340fbf7da610f55156802c': 'Scam_Token_ERC20TOKEN_0x886f107df86a9c1b04340fbf7da610f55156802c',
  '0x7b0d195f3e798e42da49cf91df147a3f4bdda75c': 'Scam_Token_BLASTCcom_0x7b0d195f3e798e42da49cf91df147a3f4bdda75c',
  '0x57912d26a5285bc5d614bbf4e9be0e42406ede54': 'Scam_Token_ERC20TOKEN_0x57912d26a5285bc5d614bbf4e9be0e42406ede54',
  '0x810dd3451bb39639db6714b5f9bdc7e8045780fa': 'Scam_Token_ERC20TOKEN_0x810dd3451bb39639db6714b5f9bdc7e8045780fa',
  '0xdd88d5be184cec706e9dd04d10ca702b6dadc09c': 'Scam_Token_ACX_0xdd88d5be184cec706e9dd04d10ca702b6dadc09c',
  '0x1cba5519248ab505c7ce936159135c062514c359': 'Scam_Token_ERC20TOKEN_0x1cba5519248ab505c7ce936159135c062514c359',
  '0x2d43072b53c1f83d2897b410b9d87647db17f04f': 'Scam_Token_ERC20TOKEN_0x2d43072b53c1f83d2897b410b9d87647db17f04f',
  '0x192fa6bb92bcd8a3b152b9023a4015bf28d41e40': 'Scam_Token_ERC20TOKEN_0x192fa6bb92bcd8a3b152b9023a4015bf28d41e40',
  '0x2013ffd957ce67fdd5b9792089d9e10d08c31e9a': 'Scam_Token_ERC20TOKEN_0x2013ffd957ce67fdd5b9792089d9e10d08c31e9a',
  '0x7f3dc24cfc1c5ba05d00e39fa922754330c5e429': 'Scam_Token_ERC20TOKEN_0x7f3dc24cfc1c5ba05d00e39fa922754330c5e429',
  '0x371fef25323ce3160b743a2d73f444110fc80f16': 'Scam_Token_ERC20TOKEN_0x371fef25323ce3160b743a2d73f444110fc80f16',
  '0xc169bf0ddb3259acc44ca94dbcc471083975c64c': 'Scam_Token_ERC20_0xc169bf0ddb3259acc44ca94dbcc471083975c64c',
  '0xe1349dd3d7ef711ae7e259d12ecfa1f742643a31': 'Scam_Token_ERC20TOKEN_0xe1349dd3d7ef711ae7e259d12ecfa1f742643a31',
  '0x5f4653440420456f26e8276e25136cd5d98f9120': 'Scam_Token_ERC20TOKEN_0x5f4653440420456f26e8276e25136cd5d98f9120',
  '0xc31e6595ccc1cd2497f8ad38f1acf80c6a1a8e1d': 'Scam_Token_ERC20TOKEN_0xc31e6595ccc1cd2497f8ad38f1acf80c6a1a8e1d',
  '0x4925dd79b5819773bda219d23a25bd404d7b3df7': 'Scam_Token_ERC20TOKEN_0x4925dd79b5819773bda219d23a25bd404d7b3df7',
  '0x9b9aa45f27b8bdda1d61c18a7ba899c949460492': 'Scam_Token_ERC20MATIC_0x9b9aa45f27b8bdda1d61c18a7ba899c949460492',
  '0xef478d61a2cbf1c21fdb1acd0b3514544c43892e': 'Scam_Token_ERC20_0xef478d61a2cbf1c21fdb1acd0b3514544c43892e',
  '0xd32a9bfb8eeb697dec347c6b87cd551f3314c275': 'Scam_Token_ERC20USDinPS_0xd32a9bfb8eeb697dec347c6b87cd551f3314c275',
  '0x822ae76b3763b4e5efa1816b3898568cc6c008af': 'Scam_Token_ERC20polygonrewardsDOTcom_0x822ae76b3763b4e5efa1816b3898568cc6c008af',
  '0x8bca1adaac26b4640d52945372fdad5fccfecf37': 'Scam_Token_ERC2050ETH_0x8bca1adaac26b4640d52945372fdad5fccfecf37',
  '0x09b79fd57bd42f747eceb76beb723c827815f389': 'Scam_Token_ERC20_0x09b79fd57bd42f747eceb76beb723c827815f389',
  '0x04565fe9aa3ae571ada8e1bebf8282c4e5247b2a': 'Scam_Token_WildGoatCoin_0x04565fe9aa3ae571ada8e1bebf8282c4e5247b2a'
}
const TOKEN_TO_ADDRESS = Object.fromEntries(Object.entries(ADDRESS_TO_TOKEN).map(([id, value]) => [value, id]))

const ADDRESS_TO_CONTRACT = {
  '0x86935f11c86623dec8a25696e1c19a8659cbf95d': 'Aavegotchi', // Portals, Gotchi, Wearables
  '0x58de9aabcaeec0f69883c94318810ad79cc6a44f': 'AavegotchiWearables', // Wearables Diamond (since ~Dec 2022?)
  '0xa02d547512bb90002807499f05495fe9c4c3943f': 'GotchiStaking', // Staking, Raffle tickets
  '0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11': 'GotchiRealm', // Parcels
  '0x19f870bd94a34b3adaa9caa439d333da18d6812a': 'GotchiInstallations',
  '0x9216c31d8146bcb3ea5a9162dc1702e8aedca355': 'GotchiTiles',
  '0x75c8866f47293636f1c32ecbcd9168857dbefc56': 'GotchiAirdrops', // Claimable airdrops: H1 bg, Drop tickets
  '0x6c723cac1e35fe29a175b287ae242d424c52c1ce': 'GotchiRaffles', // Raffle submission/claiming
  '0x4fdfc1b53fd1d80d969c984ba7a8ce4c7baad442': 'GotchiForge',
  '0xa44c8e0ecaefe668947154ee2b803bd4e6310efe': 'GotchiGBM_Land', // Land Auction 1 (2021-10) and 2 (2021-12)
  '0x1d86852b823775267ee60d98cbcda9e8d5c2faa7': 'GotchiGBM_2021-07', // Wearables GBM 1
  '0xd5543237c656f25eea69f1e247b8fa59ba353306': 'GotchiGBM_2023-02', // Forge GBM 1 and ongoing open Auctions
  '0xa4e3513c98b30d4d7cc578d2c328bd550725d1d0': 'FAKEGotchis',
  '0x2c1a288353e136b9e4b467aadb307133fffeab25': 'VersePayout', // Alchemica payouts from Gotchiverse Apr 2022
  '0xa0f32863ac0e82d36df959a95fedb661c1d32a6f': 'VersePayout2', // Alchemica payouts from Gotchiverse Apr 2022
  '0xc57feb6d8d5edfcce4027c243dceb2b51b0e318b': 'VersePayout3', // Alchemica payouts from Gotchiverse Apr 2022
  '0x2e31367f1d773cc1cc071a16ccb70ef4ae1ccdba': 'GotchiBattlerPayout',
  '0xdd564df884fd4e217c9ee6f65b4ba6e5641eac63': 'GotchiVault',
  '0x11111112542d85b3ef69ae05771c2dccff4faa26': '1inch',
  '0x1111111254fb6c44bac0bed2854e76f90643097d': '1inch2',
  '0x1111111254eeb25477b68fb85ed929f73a960582': '1inch3',
  '0x111111125421ca6dc452d289314280a0f8842a65': '1inch4',
  '0x8dfdea6a4818d2aa7463edb9a8841cb0c04255af': 'Zapper',
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': 'QuickSwap',
  '0x2953399124f0cbb46d2cbacd8a89cf0599974963': 'OpenSeaCollections',
  '0xdb46d1dc155634fbc732f92e853b10b288ad5a1d': 'LensProtocolProfiles',
  '0xe7e7ead361f3aacd73a61a9bd6c10ca17f38e945': 'LensHandles',
  '0x3ed229639287098fc739d2d35bd34b12fb938b3e': 'Scam_Token_LensAirdrop',
  '0x1bfa729883fd32f13873f6933bc68958251f611a': 'Scam_Token_LABUBL',
  '0x2953399124f0cbb46d2cbacd8a89cf0599974963': 'Scam_Token_OPENSTORE',
  '0xfd1dbd4114550a867ca46049c346b6cd452ec919': 'Scam_Token_Filomagia',
  '0x50a289670273ffbd841bebc3a515dd968d65971a': 'Scam_Token_WETH_blockwin',
  '0xb947f81db6b8512b09d9671d030a8aab2f77ed1c': 'Scam_Token_OWN',
  '0xeb3035bcdb1d1703f926e8dca30f4a7c0e469256': 'Scam_Token_Waifumon',
  '0xa554f5abe8a530b7ff6c61e4d70459d9ffae6652': 'Scam_Token_MATICART',
  '0x6609ab0e9feed35988a4c5aaaae11203f9de1be2': 'Scam_Token_MATICART2',
  '0xfc5b66fd000eaf6ae6b0bb938457220dd51d47f3': 'Scam_Token_MATICART3',
  '0x60c6ee7ff8d89f57dc0691ad50040c3d7c089b85': 'Scam_Token_MATICART4',
  '0x9aeb92ef2579822e53c82d601c812eec6cd6d988': 'Scam_Token_MATICART5',
  '0x875e8bbb88ff6361cd20032ee0b1f5136f928cc2': 'Scam_Token_MATICART6',
  '0x2ac2eb99a696cee368699eb4ad7217f8a706b905': 'Scam_Token_MATICART7',
  '0x612ee4bfd2ee2eaa7ef44120543c78ab4bd16635': 'Scam_Token_MATICART8',
  '0x947b5a3f7b8f288498347dc1cdfe35fd13b3afe8': 'Scam_Token_GOTCHI',
  '0xb8cb14dc0dda33c28e2f77802452bf274da255ae': 'Scam_Token_Lidonft',
  '0x745f3e1bedd8d9a167057a5e76543fbd32bd5e4b': 'Scam_Token_APETicket',
  '0x1678199f515cf2df55e06e476671a04de2f3e76a': 'Scam_Token_APETicket2',
  '0x4ef5d7352844e3dfc15393cabc02f79b646bc79c': 'Scam_Token_APETicket3',
  '0x5c86ca98595ccac89d116ba4e7f4cee4eed9c01b': 'Scam_Token_APETicket4',
  '0x9594d1065172f530d387c2017ab80a279512dbaf': 'Scam_Token_APETicket5',
  '0xbf271df0ef916d1af7f52fc254fb34070dd02ef8': 'Scam_Token_Aaveairdrop',
  '0xcca10993b72fc73a2f16911711e737000b4f08a7': 'Scam_Token_Aaveevent',
  '0xbd8326b2f91cb8518b12e9c4852e12f27e98af01': 'Scam_Token_Ghostevent',
  '0x09d4d65ee6c2ff347e6bfaf9e202fe66b7694dd1': 'Scam_Token_Dydxevent',
  '0xa2926fe9d94a55defb6bec0921251e9a6d21684f': 'Scam_Token_Unievent',
  '0x4d9f9224c6d7497541d8c7da9945a85f387be279': 'Scam_Token_Polyevent',
  '0xede4fe9515b38ea23b8ef661a847271bae627429': 'Scam_Token_BitCase',
  '0xeeffb0cd240da36f4af52d98b876ea8b20a6e73b': 'Scam_Token_BitCasefreespin',
  '0x2ec8b98475b80d6b28d393876ac34ab58c5ca153': 'Scam_Token_Unievent',
  '0x33d3a5c1e523b0aee0b6d9ec22f520f9f99a1738': 'Scam_Token_999USDT_wincoin',
  '0xbde5cb50dcc58e169f918fce1886fb971949db3b': 'Scam_Token_999GHST',
  '0x9e761402c82710d7288fb398f63bbce0d9591ba3': 'Scam_Token_AVALANCENFTTICKETS_0x9e761402c82710d7288fb398f63bbce0d9591ba3',
  '0xdfeec8048ab80220a3f6ec1370d589108d059cb1': 'Scam_Token_LedgerStaxGiveaway_0xdfeec8048ab80220a3f6ec1370d589108d059cb1',
  '0x753216c373de224d74d30db1dc6bc2cd1d8b21db': 'Scam_Token_LedgerStaxGiveaway_0x753216c373de224d74d30db1dc6bc2cd1d8b21db',
  '0x42ab609cb406453c6a942049dd7cbaf173036dc1': 'Scam_Token_dYdXExchangeEvent_0x42ab609cb406453c6a942049dd7cbaf173036dc1',
  '0x0e1c2df28d2cfe303f45bb832c05de2924b732ad': 'Scam_Token_ERC1155TOKEN_0x0e1c2df28d2cfe303f45bb832c05de2924b732ad',
  '0x7a388985c50708d9cc531e19bc53c641fc368c0c': 'Scam_Token_ARBITDROPINFOCOUPON_0x7a388985c50708d9cc531e19bc53c641fc368c0c',
  '0x24aa8abd6d7df783d1e3efde9f24a1aa231485e6': 'Scam_Token_ERC1155TOKEN_0x24aa8abd6d7df783d1e3efde9f24a1aa231485e6',
  '0xa16e90bc74752c836e1f45c7637dcc82f7ba6bd8': 'Scam_Token_LedgerStaxGiveaway_0xa16e90bc74752c836e1f45c7637dcc82f7ba6bd8',
  '0x1f156a90622b50afad2808f1de753f7533114b57': 'Scam_Token_ERC1155TOKEN_0x1f156a90622b50afad2808f1de753f7533114b57',
  '0x9fb53ad253824cc721ce8372881c7104588a25cc': 'Scam_Token_ARBITDROPINFOCOUPON_0x9fb53ad253824cc721ce8372881c7104588a25cc',
  '0x3bf8fe0666f6041b038b3400e73b87748e3153e1': 'Scam_Token_5000USDC_0x3bf8fe0666f6041b038b3400e73b87748e3153e1',
  '0x5cef6ae390ec62a303346d19fdc8150737821a3c': 'Scam_Token_ERC1155TOKEN_0x5cef6ae390ec62a303346d19fdc8150737821a3c',
  '0xd1315bc9ee68eb16dc2974061507c3ee3dadf74c': 'Scam_Token_5000USDCVoucher_0xd1315bc9ee68eb16dc2974061507c3ee3dadf74c',
  '0x4c7281f0a8a143a34ffa5844e584fe873474ac3c': 'Scam_Token_500ETHbyBase_0x4c7281f0a8a143a34ffa5844e584fe873474ac3c',
  '0xd55a216eee3ad439544fbd541d86c9ac1a798cd4': 'Scam_Token_1300GHST_0xd55a216eee3ad439544fbd541d86c9ac1a798cd4',
  '0x98b1f8a4f47038fdae7e38839463d58fd8a75757': 'Scam_Token_LENSAirdrop_0x98b1f8a4f47038fdae7e38839463d58fd8a75757',
  '0x98b1f8a4f47038fdae7e38839463d58fd8a75757': 'Scam_Token_LENSAirdrop_0x98b1f8a4f47038fdae7e38839463d58fd8a75757',
  '0xc46e36339ebd8bed48b1bdb6bd815e4b72103949': 'Scam_Token_ERC1155TOKEN_0xc46e36339ebd8bed48b1bdb6bd815e4b72103949',
  '0xcf9aff2e6acee588befca3613054c0f41fa9a754': 'Scam_Token_LedgerStaxGiveaway_0xcf9aff2e6acee588befca3613054c0f41fa9a754',
  '0x98b1f8a4f47038fdae7e38839463d58fd8a75757': 'Scam_Token_LENSAirdrop_0x98b1f8a4f47038fdae7e38839463d58fd8a75757',
  '0x9bb426818b7a3aad46871015c0432a0173715491': 'Scam_Token_ERC1155TOKEN_0x9bb426818b7a3aad46871015c0432a0173715491',
  '0x1738832e9cec165805c25912db97202767b4b379': 'Scam_Token_2500USDTbyETHERSCANxMETAWIN_0x1738832e9cec165805c25912db97202767b4b379',
  '0x5b732552f048ff8fae3f5a1a1395e0a87c866d8f': 'Scam_Token_5000USDC_0x5b732552f048ff8fae3f5a1a1395e0a87c866d8f',
  '0x5cf838ce9e15553ea5227a0e4418a30c0a7b78c9': 'Scam_Token_200MSHIB_0x5cf838ce9e15553ea5227a0e4418a30c0a7b78c9',
  '0x236ae72401d43b426e271889a26fdf42ad1b82e5': 'Scam_Token_LENSAIRDROP_0x236ae72401d43b426e271889a26fdf42ad1b82e5',
  '0x7eb18053877ad69711eda7d1fd9132b1f86d4ff2': 'Scam_Token_5000BUSD_0x7eb18053877ad69711eda7d1fd9132b1f86d4ff2',
  '0x73daa08b84f47fc8f4b7532ab691554a1bcf10d8': 'Scam_Token_5000USDT_0x73daa08b84f47fc8f4b7532ab691554a1bcf10d8',
  '0x84ae16bbccc752dcbc8f45bbef9ea7d932be09f3': 'Scam_Token_250COMP_0x84ae16bbccc752dcbc8f45bbef9ea7d932be09f3',
  '0x6e6e0a5045ddec95fd53757dc96336881e3e4385': 'Scam_Token_100000BONE_0x6e6e0a5045ddec95fd53757dc96336881e3e4385',
  '0xf7b9fa22ead801a096fb3fa0d303f688ec3bcafb': 'Scam_Token_ERC1155TOKEN_0xf7b9fa22ead801a096fb3fa0d303f688ec3bcafb',
  '0xc8030e7a7884a232fe4c867429a6f0bdf23de57c': 'Scam_Token_2000USDC_0xc8030e7a7884a232fe4c867429a6f0bdf23de57c',
  '0x616e23f4f816208e2b7bfbcf954f81660799e806': 'Scam_Token_700MSHIB_0x616e23f4f816208e2b7bfbcf954f81660799e806',
  '0x0cbaeee7173b1d121a74f7da3d69467426bcafad': 'Scam_Token_5ETHbyBase_0x0cbaeee7173b1d121a74f7da3d69467426bcafad',
  '0x8ce685c826b42ba00acc3aea5dc06d6cd0538487': 'Scam_Token_1000UNI_0x8ce685c826b42ba00acc3aea5dc06d6cd0538487',
  '0xf56814c4c86c9030f75556448eda5d8d39a52e7e': 'Scam_Token_ERC1155TOKEN_0xf56814c4c86c9030f75556448eda5d8d39a52e7e',
  '0x56b92dc3dd0522deb6d1025b6c884e80ad1339c0': 'Scam_Token_ERC1155TOKEN_0x56b92dc3dd0522deb6d1025b6c884e80ad1339c0',
  '0xf66eba27a36631d14fde611e52bff661846507fc': 'Scam_Token_ERC1155TOKEN_0xf66eba27a36631d14fde611e52bff661846507fc',
  '0xd0d33895db6e382971c680ff3357bfc2ab235f12': 'Scam_Token__0xd0d33895db6e382971c680ff3357bfc2ab235f12',
  '0xff3cf709c1e602b4abd8f3eec73f87a85ae0f8e7': 'Scam_Token_ERC1155TOKEN_0xff3cf709c1e602b4abd8f3eec73f87a85ae0f8e7',
  '0x21990b8d596d4c3fb2c10309258ef63cce75e576': 'Scam_Token__0x21990b8d596d4c3fb2c10309258ef63cce75e576',
  '0x60175a9a7d72fcb1e0b5ada305262519d1de2ea2': 'Scam_Token_1000USDTAirdrop_0x60175a9a7d72fcb1e0b5ada305262519d1de2ea2',
  '0xf9e5501f1c0404565d160234b833a6a494286a03': 'Scam_Token_eigenlayer_0xf9e5501f1c0404565d160234b833a6a494286a03',
  '0xf1515d090de782c4ae0fbc59930a7511edb20efb': 'Scam_Token__0xf1515d090de782c4ae0fbc59930a7511edb20efb',
  '0xe7d14d68ca89a78ab7e7cac741a496059914d7d5': 'Scam_Token_1000USDCAirdrop_0xe7d14d68ca89a78ab7e7cac741a496059914d7d5',
  '0x8cddead7a8ae51e93510d49785bed3284f37bc55': 'Scam_Token_2000USDTVoucher_0x8cddead7a8ae51e93510d49785bed3284f37bc55',
  '0x70e6e7bd23b58ae47df51f67ba2b3e7b5f2c04c6': 'Scam_Token__0x70e6e7bd23b58ae47df51f67ba2b3e7b5f2c04c6',
  '0x316d73824bc9c60f239d4c57082bcde4bfdf4f7a': 'Scam_Token_PositiveVibes_0x316d73824bc9c60f239d4c57082bcde4bfdf4f7a',
  '0x1fa335eb9162cb0a41a6c2cb8a9c050adf1f257d': 'Scam_Token_3000USDTAirdrop_0x1fa335eb9162cb0a41a6c2cb8a9c050adf1f257d',
  '0x1f0d0b8b300ca644377b3e6aeaff445cdd1bd8e1': 'Scam_Token_2000USDCVoucher_0x1f0d0b8b300ca644377b3e6aeaff445cdd1bd8e1',
  '0x1348debd5f3004585594554c89f843ab27938484': 'Scam_Token__0x1348debd5f3004585594554c89f843ab27938484',
  '0xe9d7a7650a3611aa356f7cd80c262ef8626ee964': 'Scam_Token_5000USDC_0xe9d7a7650a3611aa356f7cd80c262ef8626ee964',
  '0x6265b04a3e1f3a5a66850668460dd86aaa22420a': 'Scam_Token__0x6265b04a3e1f3a5a66850668460dd86aaa22420a',
  '0xc9d055fa935c2790d05e6f349d50cc09bf161faf': 'Scam_Token_getUSDcoinorg_0xc9d055fa935c2790d05e6f349d50cc09bf161faf',
  '0xb97f09d9e90a682153e5b37f8e3529a604dc586d': 'Scam_Token_5ETHatgetethus_0xb97f09d9e90a682153e5b37f8e3529a604dc586d',
  '0x7875bb6928a8538d79beb7478ac2b832fe7937d9': 'Scam_Token_5ETHatgetethus_0x7875bb6928a8538d79beb7478ac2b832fe7937d9',
  '0xbd3689dacd67517646e3c4ed85e8cab0df253c83': 'Scam_Token_5000atweb3shibaus_0xbd3689dacd67517646e3c4ed85e8cab0df253c83',
  '0xfd34d8cc6838d1ab1ddd06b12e3f5f55a206f85b': 'Scam_Token_Bonusat3ethus_0xfd34d8cc6838d1ab1ddd06b12e3f5f55a206f85b',
  '0xf9e26b8f0e98f946a159d5f29467221708a6f640': 'Scam_Token_Bonusat5ethus_0xf9e26b8f0e98f946a159d5f29467221708a6f640',
  '0x732b2363450f229b35fe12ee4384d1e3223d6eca': 'Scam_Token_ETHGasFeeRefundgasrefundscom_0x732b2363450f229b35fe12ee4384d1e3223d6eca',
  '0xd8c26c30cdeaa1e3d2ba7cd666c0af5b2e95bd56': 'Scam_Token_ETHGasFeeRefundgasrefundscom_0xd8c26c30cdeaa1e3d2ba7cd666c0af5b2e95bd56',
  '0x6fed37166e9e1e91b066c33cddd8bd607664990f': 'Scam_Token_Bonusat5ethus_0x6fed37166e9e1e91b066c33cddd8bd607664990f',
  '0xf9353630190ec929363c0fad06619169cc76ba35': 'Scam_Token_ERC1155TOKEN_0xf9353630190ec929363c0fad06619169cc76ba35',
  '0x219e3754d889479d929e188e8a6364af05799daa': 'Scam_Token__0x219e3754d889479d929e188e8a6364af05799daa',
  '0xa4a491521545ed97763fc31e45b73d2e4417daa8': 'Scam_Token_10Kgiftatbitlytpepe_0xa4a491521545ed97763fc31e45b73d2e4417daa8',
  '0x5baf493ada72abece0c2208aa5a1d5a9611b0bde': 'Scam_Token_10BNBat10bnbus_0x5baf493ada72abece0c2208aa5a1d5a9611b0bde',
  '0xd04dfa60a42ccb251c39c8f03ff43acae4aed4d2': 'Scam_Token_1ETHatwebethlol_0xd04dfa60a42ccb251c39c8f03ff43acae4aed4d2',
  '0xd3544e3e666dbe763a7d1f57c05c9a5cff6c59d9': 'Scam_Token_5000atadrpgbtpro_0xd3544e3e666dbe763a7d1f57c05c9a5cff6c59d9',
  '0x770b8eb8d27c2702225bd460539edd2597aa33ca': 'Scam_Token_Rewardat10bnborg_0x770b8eb8d27c2702225bd460539edd2597aa33ca',
  '0xde726708e7aa3732adbab9502b960dd5bb31e62d': 'Scam_Token_ERC1155TOKEN_0xde726708e7aa3732adbab9502b960dd5bb31e62d',
  '0xebb8b099948f8c84ad2f9d1e48f0bba4ce67e9f6': 'Scam_Token_ERC1155TOKEN_0xebb8b099948f8c84ad2f9d1e48f0bba4ce67e9f6',
  '0x5ecade90ed2154aa6ce5ec6fd3b9bbd4e8f3cf97': 'Scam_Token_mysterynft_0x5ecade90ed2154aa6ce5ec6fd3b9bbd4e8f3cf97',
  '0x4ee7001628bdb6fe2236d5bf9331cbb18d41491e': 'Scam_Token_ERC1155TOKEN_0x4ee7001628bdb6fe2236d5bf9331cbb18d41491e',
  '0x736054f25e2ac8cfb08775c56b93f901054d6ee3': 'Scam_Token_10BNBRewardatairdropbnbcfd_0x736054f25e2ac8cfb08775c56b93f901054d6ee3',
  '0xca1ca230692daa0873ffeec8784a77870de81319': 'Scam_Token_LayerZeroTokenatlayerzeropl_0xca1ca230692daa0873ffeec8784a77870de81319',
  '0x53596faddafde897f1e15d8bb07a3bc111b01a1d': 'Scam_Token_ERC1155TOKEN_0x53596faddafde897f1e15d8bb07a3bc111b01a1d',
  '0x657b3496aac81d3f3bc683d99905a55250aca5b9': 'Scam_Token_ERC1155TOKEN_0x657b3496aac81d3f3bc683d99905a55250aca5b9',
  '0xfa05edd0a4fbd7627a8900f9e6bb9fad0ed8d5dd': 'Scam_Token_50000FREEmebountyio_0xfa05edd0a4fbd7627a8900f9e6bb9fad0ed8d5dd',
  '0x27a3292eb66707e18e08efa4f1520593d9808c7e': 'Scam_Token_50000FREEmebountyio_0x27a3292eb66707e18e08efa4f1520593d9808c7e',
  '0x3f48cda3a919b61ec902e1edfae7ee78cf6bb52d': 'Scam_Token_0x3f48cda3a919b61ec902e1edfae7ee78cf6bb52d',
  '0x0e85a1ed7006c4e09c957011197ec664c5c4ce0c': 'Scam_Token_0x0e85a1ed7006c4e09c957011197ec664c5c4ce0c',
  '0xec59b4dfcb9af83f28d045bd214cb3e5345b2bf6': 'Scam_Token_0xec59b4dfcb9af83f28d045bd214cb3e5345b2bf6'
}

const CONTRACT_TO_ADDRESS = Object.fromEntries(Object.entries(ADDRESS_TO_CONTRACT).map(([id, value]) => [value, id]))

const GBM_CONTRACT_ADDRESSES = [
  CONTRACT_TO_ADDRESS['GotchiGBM_Land'],
  CONTRACT_TO_ADDRESS['GotchiGBM_2021-07'],
  CONTRACT_TO_ADDRESS['GotchiGBM_2023-02']
]

const CONTRACT_ERC721 = {
  '0x86935f11c86623dec8a25696e1c19a8659cbf95d': 'AG-GOTCHI',
  '0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11': 'AG-REALM'
}

const CONTRACT_ERC1155 = {
  '0x86935f11c86623dec8a25696e1c19a8659cbf95d': {
    // wearables will be populated later
  },
  '0x58de9aabcaeec0f69883c94318810ad79cc6a44f': {
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
  '0x19f870bd94a34b3adaa9caa439d333da18d6812a': {
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
  '0x9216c31d8146bcb3ea5a9162dc1702e8aedca355': {
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
  '0x4fdfc1b53fd1d80d969c984ba7a8ce4c7baad442': {
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
    CONTRACT_ERC1155['0x86935f11c86623dec8a25696e1c19a8659cbf95d'][`${wearable.id}`] = {
      asset: `AG-WEAR-${wearable.id}`,
      label: wearable.name
    }
    CONTRACT_ERC1155['0x58de9aabcaeec0f69883c94318810ad79cc6a44f'][`${wearable.id}`] = {
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

  // "Txhash","Blockno","UnixTimestamp","DateTime","ParentTxFrom","ParentTxTo","ParentTxMATIC_Value","From","TxTo",
  // "ContractAddress","Value_IN(MATIC)","Value_OUT(MATIC)","CurrentValue @ $1.271/MATIC","Historical $Price/MATIC","Status","ErrCode","Type"
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

  // "Txhash","Blockno","UnixTimestamp","DateTime","From","To","TokenValue","USDValueDayOfTx","ContractAddress","TokenName","TokenSymbol"
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

  // "Txhash","Blockno","UnixTimestamp","DateTime (UTC)","From","To","ContractAddress","TokenName","TokenSymbol","Token ID","Type","Quantity"
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
      } else if (isCallingGotchiRealm && tx.method === 'Set Approval For All') {
        data.approvals.push({
          txId: tx.txId,
          date: tx.date,
          fromAddress: tx.fromAddress,
          tokenAddress: tx.toAddress,
          token: 'AG-REALM',
          maticValueFee: tx.maticValueFee,
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
          maticValueFee: tx.maticValueFee,
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
            maticValueFee: tx.maticValueFee,
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
            maticValueFee: tx.maticValueFee,
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
              maticValueFee: tx.maticValueFee,
              label
            }
            data.gotchiLendingBorrowingFees.push(event)
          } else {
            // No fee: record game action for the transaction fee
            const action = {
              txId: tx.txId,
              date: tx.date,
              maticValueFee: tx.maticValueFee,
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
            maticValueFee: tx.maticValueFee,
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
            'Finalize Upgrades' // This actually mints the upgraded installations, but we will handle them in the earlier upgrade tx; just record matic fee
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
            maticValueFee: tx.maticValueFee,
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
              maticValueFee: !handledFee ? tx.maticValueFee : '0',
              type: 'Transfer Escrow',
              label
            }
            handledFee = true
            data.pocketTransfers.push(transfer)
            console.log(label)
          }
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
            asset: 'MATIC',
            amount: tx.maticValueFee
          }]
        })
        console.log(label)
      } else if (
          tx.fromAddress === address &&
          [CONTRACT_TO_ADDRESS['1inch'], CONTRACT_TO_ADDRESS['1inch2'], CONTRACT_TO_ADDRESS['1inch3'], CONTRACT_TO_ADDRESS['1inch4'], CONTRACT_TO_ADDRESS['Zapper'], CONTRACT_TO_ADDRESS['QuickSwap']].includes(tx.toAddress) &&
          ['0x7c025200', 'Zap Out', '0x415565b0', 'Swap'].includes(tx.method)
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
            disposedLabels.push(`${tx.maticValueOut} MATIC`)
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
        [CONTRACT_TO_ADDRESS['Aavegotchi'], CONTRACT_TO_ADDRESS['AavegotchiWearables'], CONTRACT_TO_ADDRESS['GotchiStaking'], CONTRACT_TO_ADDRESS['GotchiForge']].includes(txGroup.erc1155[0].tokenContractAddress) &&
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
            maticValueFee: '0',
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
            maticValueFee: '0',
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

  // https://louper.dev/diamond/0x19f870bd94a34b3adaa9caa439d333da18d6812a?network=polygon
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
  // let provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com/')
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/polygon')

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

  // Process gotchiverseIncome events to standard format, with maticValueFee (if has 'main' tx) and ERC20 tokens.
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
      // If this was self-submitted, log it as a game event for the MATIC fee
      if (txGroup.main.length) {
        data.gameActions.push({
            txId: txGroup.txId,
            date,
            maticValueFee: txGroup.main[0].maticValueFee,
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
          asset: 'MATIC',
          amount: txGroup.main[0].maticValueFee
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
        console.error(`Couldn't find auction claim's corresponding bid price - please ensure all GBM transactions are provided in the polygonscan export`, auction.claim)
      }
    }
  }

  // Look for 1inch trades that were executed by the aggregation router,
  // which are ERC20 transfers with one token in and a different token out (or one MATIC internal transfer)
  const nowProcessed = []
  const is1inchOrderFilledLog = function (log) {
    return log && [CONTRACT_TO_ADDRESS['1inch3'], CONTRACT_TO_ADDRESS['1inch4']].includes(log.address.toLowerCase())
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
        // 1 matic transfer, 1 erc20 transfer
        if (
          txGroup.internal[0].toAddress === address &&
          txGroup.erc20[0].fromAddress === address
        ) {
          // received MATIC, disposed ERC20
          acquiredAsset = {
            asset: 'MATIC',
            amount: txGroup.internal[0].maticValueIn
          }
          disposedAsset = {
            asset: txGroup.erc20[0].token,
            assetContractAddress: txGroup.erc20[0].tokenContractAddress,
            amount: txGroup.erc20[0].tokenValue
          }
        } else {
          // TODO could add support for selling MATIC for ERC20, but don't have an example transaction for it yet
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