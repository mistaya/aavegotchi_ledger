# aavegotchi_ledger

Scripts to help extract Aavegotchi-related activity from polygonscan CSV exports, and to fetch and calculate historical prices of NFT sales.

Generates result files in JSON format. You can then read them yourself, or write further scripts to do your own custom processing.

WARNING: these scripts are incomplete, probably have bugs, and are subject to change in future. I built them to help with my own accounts, but they may not completely work for your case.

USE AT YOUR OWN RISK: you should verify the output makes sense, and compare it against your own records.

I am not an accountant and nothing here is financial advice. I'm making it available in case it saves someone else some time, as it took up enough of mine!

(The code is a very rough, messy monolith right now - I might organise it into modules in future.)

Usage:
1. `npm install` to get the 3rd-party libraries needed. Then either/both:

Price fetcher:

You'll need to refetch prices if you need ERC1155 wearable/ticket prices that are later than what's been cached here.
(I haven't done ERC721 price calcs yet, but there is a fetcher for the sales data in case you want to work with that yourself.)

1. Go to the 'prices' folder and open up `fetchBaazaarSales.js`. This contains a number of utility functions, and at the bottom of this file you should uncomment the function you want to run. `fetchAll` will run everything. The other functions represent different stages and they're separated so that you don't need to start from the beginning every time if you want to tweak a later stage, e.g. to change the price averaging method.
2. Run `fetch.sh` (no params in here, it just runs the above script)

Polygonscan parser:

1. Export CSVs from each polygonscan tab for your own address: main, internal, ERC20, ERC721 and ERC1155.
2. Copy or edit `process_polygonscan.sh` and modify it with the filenames of your CSVs, in the above order. The last param is the name of the output file to write.
3. Run `process_polygonscan.sh` and review the console output to see what it's doing and if there are errors. (Or `process_polygonscan.sh > log.txt` to store this output as a file: this way you'll see errors in the console more clearly)
4. The generated result.json contains a top-level `data` object with processed transactions/events, and `allTransactions` which contains the original "raw data" from the CSVs.
