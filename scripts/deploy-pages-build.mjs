import { copyFileSync, cpSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const sourceIndex = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>交付提效助手</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

writeFileSync('index.html', sourceIndex)
execFileSync('npm', ['run', 'build'], { stdio: 'inherit' })

copyFileSync('dist/index.html', 'index.html')
for (const path of ['assets', 'aui-native', 'embedded']) {
  rmSync(path, { recursive: true, force: true })
  cpSync(`dist/${path}`, path, { recursive: true })
}
for (const file of [
  'avatar-ai-1.png',
  'avatar-ai-2.png',
  'avatar-ai-3.png',
  'avatar-ai-4.png',
  'avatar-contract-advisor.svg',
  'erp-li-si-permission-summary.html',
  'erp-user-permission-overview.html',
  'gpt-entry.png',
  'home-bg.png',
]) {
  copyFileSync(`dist/${file}`, file)
}
