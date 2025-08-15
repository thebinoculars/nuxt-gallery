// scripts/convert-redirects.js
import fs from 'fs'
import path from 'path'
import toml from 'toml'

const netlifyTomlPath = path.resolve('netlify.toml')
const redirectsPath = path.resolve('dist/_redirects')
const backupPath = path.resolve('dist/_redirects.bak')

function convertTomlToRedirects(tomlContent) {
  const parsed = toml.parse(tomlContent)

  if (!parsed.redirects || !Array.isArray(parsed.redirects)) {
    process.exit(1)
  }

  return parsed.redirects
    .map((r) => {
      const from = r.from || r.source || ''
      const to = r.to || r.destination || ''
      const status = r.status || 301
      const force = r.force ? '!' : ''
      return `${from} ${to} ${status}${force}`
    })
    .join('\n')
}

function main() {
  if (!fs.existsSync(netlifyTomlPath)) {
    process.exit(1)
  }

  const tomlContent = fs.readFileSync(netlifyTomlPath, 'utf8')
  const redirectsContent = convertTomlToRedirects(tomlContent)

  let existingContent = ''
  if (fs.existsSync(redirectsPath)) {
    fs.copyFileSync(redirectsPath, backupPath)
    existingContent = fs.readFileSync(redirectsPath, 'utf8')
  }

  const newContent = redirectsContent + '\n' + existingContent
  fs.writeFileSync(redirectsPath, newContent)
}

main()
