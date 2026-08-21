'use client'

import { Sandpack } from '@codesandbox/sandpack-react'
import { nightOwl, githubLight } from '@codesandbox/sandpack-themes'
import type { BuildingState } from '@/app/lib/swarm/types'

function previewApp(building: BuildingState) {
  const title = JSON.stringify(building.name.replace(/\.(tsx|ts|jsx|js)$/, ''))
  const folder = JSON.stringify(building.folder)
  const kind = JSON.stringify(building.kind)
  const uses = JSON.stringify((building.uses ?? []).slice(0, 6).join(' · ') || 'standalone module')
  const path = JSON.stringify(`${building.folder}${building.name}`)
  return `export default function App() {
  return (
    <div className="shell">
      <header className="bar">
        <span className="dots"><i /><i /><i /></span>
        <span className="path">{${path}}</span>
      </header>
      <main>
        <p className="kicker">{${kind}}</p>
        <h1>{${title}}</h1>
        <p className="lede">Live CodeSandbox preview of this module. UI in front, logic grouped behind the card.</p>
        <div className="grid">
          <article><small>folder</small><strong>{${folder}}</strong></article>
          <article><small>uses</small><strong>{${uses}}</strong></article>
        </div>
        <button type="button">Run module</button>
      </main>
    </div>
  )
}
`
}

const PREVIEW_CSS = `html, body, #root { height: 100%; margin: 0; }
body {
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
  background: #0b0f14;
  color: #e8eef7;
}
.shell { min-height: 100%; display: flex; flex-direction: column; }
.bar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; background: #121821; border-bottom: 1px solid #243044;
  font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; color: #93a4bb;
}
.dots { display: flex; gap: 5px; }
.dots i { width: 8px; height: 8px; border-radius: 99px; display: block; background: #334155; }
.dots i:nth-child(1) { background: #f87171; }
.dots i:nth-child(2) { background: #fbbf24; }
.dots i:nth-child(3) { background: #34d399; }
main { padding: 22px 20px 28px; }
.kicker { text-transform: uppercase; letter-spacing: .16em; font-size: 10px; color: #67e8f9; margin: 0 0 8px; }
h1 { font-size: 26px; letter-spacing: -0.04em; margin: 0 0 10px; }
.lede { color: #93a4bb; line-height: 1.5; margin: 0 0 18px; font-size: 13px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
article {
  background: #121821; border: 1px solid #243044; border-radius: 12px; padding: 12px;
}
article small { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .12em; }
article strong { font-size: 12px; }
button {
  border: 0; border-radius: 10px; padding: 10px 14px; color: #041018;
  background: linear-gradient(180deg, #67e8f9, #22d3ee); font-weight: 650; cursor: pointer;
}`

export default function SwarmSandpackCard({
  building,
  dark = true,
}: {
  building: BuildingState
  dark?: boolean
}) {
  const fileName = `/${building.name || 'module.tsx'}`
  return (
    <div
      className="h-full w-full overflow-hidden rounded-[10px]"
      style={{
        background: dark ? '#0b0f14' : '#f8fafc',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
        pointerEvents: 'auto',
      }}
    >
      <Sandpack
        template="react"
        theme={dark ? nightOwl : githubLight}
        files={{
          '/App.js': previewApp(building),
          '/styles.css': PREVIEW_CSS,
          [fileName]: building.code || `export default function ${building.id}() {\n  return null\n}\n`,
        }}
        options={{
          showNavigator: false,
          showTabs: true,
          showLineNumbers: true,
          showInlineErrors: false,
          wrapContent: true,
          editorHeight: 280,
          activeFile: fileName,
        }}
        customSetup={{
          dependencies: {
            react: '^18.0.0',
            'react-dom': '^18.0.0',
          },
        }}
      />
    </div>
  )
}
