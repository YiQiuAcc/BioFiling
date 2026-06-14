import fs from 'fs'
import path from 'path'

function cleanEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return
  const stat = fs.statSync(dir)
  if (!stat.isDirectory()) return

  let files = fs.readdirSync(dir)
  if (files.length > 0) {
    files.forEach((file) => {
      cleanEmptyDirs(path.join(dir, file))
    })
    files = fs.readdirSync(dir)
  }

  if (files.length === 0) {
    fs.rmdirSync(dir)
  }
}

cleanEmptyDirs('./dist-server/server')
cleanEmptyDirs('./dist-server/shared')
console.log('Cleaned up empty directories in dist-server.')
