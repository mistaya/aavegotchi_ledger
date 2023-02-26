const { promisify } = require('util')
const fs = require('fs')
const fsReadFile = promisify(fs.readFile)
const fsWriteFile = promisify(fs.writeFile)
const { parse } = require('csv-parse/sync')

async function readJsonFile (filename) {
  const content = await fsReadFile(filename, 'utf8')
  return JSON.parse(content)
}

async function readCsvFile (filename, columns) {
  const content = await fsReadFile(filename, 'utf8')
  columns = columns instanceof Function ? columns(content) : columns;
  return parse(content, {
    from_line: 2,
    columns,
    relax_column_count_more: true // exports have an extra empty string at the end of each row
  })
}

async function writeJsonFile (filename, data) {
  await fsWriteFile(filename, JSON.stringify(data, null, 4))
}

module.exports.readJsonFile = readJsonFile
module.exports.readCsvFile = readCsvFile
module.exports.writeJsonFile = writeJsonFile
