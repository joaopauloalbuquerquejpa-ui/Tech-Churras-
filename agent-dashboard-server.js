#!/usr/bin/env node
// Tech Churras — Agent Activity Dashboard Server
// Run: node agent-dashboard-server.js
// Open: http://localhost:9999

const http = require('http')
const fs = require('fs')
const path = require('path')
const os = require('os')

const PORT = 9999
const CLAUDE_DIR = path.join(os.homedir(), '.claude', 'projects')
const AGENTS_PROJECT_DIR = path.join('C:\\projetos\\tech-churras', '.claude', 'agents')
const AGENTS_GLOBAL_DIR = path.join(os.homedir(), '.claude', 'agents')

const TOOL_META = {
  Bash: { icon: '⚡', label: 'Terminal', color: '#22c55e' },
  Read: { icon: '👁', label: 'Ler arquivo', color: '#60a5fa' },
  Edit: { icon: '✏️', label: 'Editar arquivo', color: '#f59e0b' },
  Write: { icon: '💾', label: 'Escrever arquivo', color: '#f59e0b' },
  Grep: { icon: '🔍', label: 'Busca', color: '#a78bfa' },
  Glob: { icon: '📂', label: 'Listar arquivos', color: '#a78bfa' },
  Agent: { icon: '🤖', label: 'Sub-agente', color: '#ec4899' },
  WebFetch: { icon: '🌐', label: 'Web Fetch', color: '#06b6d4' },
  WebSearch: { icon: '🔎', label: 'Web Search', color: '#06b6d4' },
  TaskCreate: { icon: '📋', label: 'Criar tarefa', color: '#84cc16' },
  TaskUpdate: { icon: '✅', label: 'Atualizar tarefa', color: '#84cc16' },
  AskUserQuestion: { icon: '❓', label: 'Pergunta ao usuário', color: '#fbbf24' },
}

function walkDir(dir, ext) {
  const results = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...walkDir(full, ext))
    else if (entry.isFile() && entry.name.endsWith(ext)) results.push(full)
  }
  return results
}

function parseSession(filePath) {
  const events = []
  const sessionId = path.basename(filePath, '.jsonl')
  const projectSlug = path.basename(path.dirname(filePath))

  let raw
  try { raw = fs.readFileSync(filePath, 'utf8') } catch { return events }

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    let obj
    try { obj = JSON.parse(line) } catch { continue }

    const ts = obj.timestamp ? new Date(obj.timestamp).toISOString() : null
    if (!ts) continue

    // User message
    if (obj.type === 'user' && obj.message?.role === 'user') {
      const content = typeof obj.message.content === 'string'
        ? obj.message.content
        : obj.message.content?.map(c => c.text || '').join(' ') || ''
      if (content && content.length > 2) {
        events.push({
          id: obj.uuid,
          type: 'user',
          ts,
          sessionId,
          project: projectSlug,
          text: content.slice(0, 200),
        })
      }
    }

    // Assistant message with tool calls
    if (obj.type === 'assistant' && Array.isArray(obj.message?.content)) {
      for (const block of obj.message.content) {
        if (block.type === 'tool_use') {
          const meta = TOOL_META[block.name] || { icon: '🔧', label: block.name, color: '#6b7280' }
          let detail = ''
          if (block.name === 'Bash') detail = block.input?.command?.slice(0, 120) || ''
          else if (block.name === 'Read') detail = block.input?.file_path?.split(/[\\/]/).slice(-2).join('/') || ''
          else if (block.name === 'Edit' || block.name === 'Write') detail = block.input?.file_path?.split(/[\\/]/).slice(-2).join('/') || ''
          else if (block.name === 'Grep') detail = `"${block.input?.pattern || ''}" in ${block.input?.path || '.'}`
          else if (block.name === 'Glob') detail = block.input?.pattern || ''
          else if (block.name === 'Agent') detail = block.input?.description || block.input?.prompt?.slice(0, 80) || ''
          else if (block.name === 'WebFetch' || block.name === 'WebSearch') detail = block.input?.url || block.input?.query || ''
          else detail = JSON.stringify(block.input || {}).slice(0, 100)

          events.push({
            id: block.id,
            type: 'tool',
            toolName: block.name,
            icon: meta.icon,
            label: meta.label,
            color: meta.color,
            detail,
            ts,
            sessionId,
            project: projectSlug,
          })
        }

        // Text response from assistant
        if (block.type === 'text' && block.text?.length > 10) {
          events.push({
            id: obj.uuid + '_text',
            type: 'assistant',
            ts,
            sessionId,
            project: projectSlug,
            text: block.text.slice(0, 200),
          })
        }
      }
    }
  }

  return events
}

function getInstalledAgents() {
  const project = fs.existsSync(AGENTS_PROJECT_DIR)
    ? fs.readdirSync(AGENTS_PROJECT_DIR).filter(f => f.endsWith('.md')).length : 0
  const global = fs.existsSync(AGENTS_GLOBAL_DIR)
    ? fs.readdirSync(AGENTS_GLOBAL_DIR).filter(f => f.endsWith('.md')).length : 0
  return { project, global, total: project + global }
}

function getActivityData(limitHours = 24) {
  const sessionFiles = walkDir(CLAUDE_DIR, '.jsonl')
  const cutoff = new Date(Date.now() - limitHours * 3600 * 1000)
  const allEvents = []

  for (const file of sessionFiles) {
    const stat = fs.statSync(file)
    if (stat.mtime < cutoff) continue
    allEvents.push(...parseSession(file))
  }

  allEvents.sort((a, b) => b.ts.localeCompare(a.ts))

  const toolCounts = {}
  for (const ev of allEvents) {
    if (ev.type === 'tool') toolCounts[ev.toolName] = (toolCounts[ev.toolName] || 0) + 1
  }

  const agents = getInstalledAgents()

  return {
    updatedAt: new Date().toISOString(),
    agents,
    sessions: [...new Set(allEvents.map(e => e.sessionId))].length,
    totalEvents: allEvents.length,
    toolCounts,
    events: allEvents.slice(0, 200),
  }
}

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tech Churras — Agent Dashboard</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; color: #e2e8f0; font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; }
  .header { background: #12121a; border-bottom: 1px solid #1e1e2e; padding: 16px 24px; display: flex; align-items: center; gap: 16px; position: sticky; top: 0; z-index: 10; }
  .logo { font-size: 18px; font-weight: 700; color: #f97316; letter-spacing: -0.5px; }
  .logo span { color: #6366f1; }
  .badge { background: #1e1e2e; border: 1px solid #2e2e4e; border-radius: 99px; padding: 3px 10px; font-size: 11px; color: #a5b4fc; }
  .pulse { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px 24px; }
  .stat { background: #12121a; border: 1px solid #1e1e2e; border-radius: 10px; padding: 14px 16px; }
  .stat-n { font-size: 28px; font-weight: 700; color: #f97316; line-height: 1; }
  .stat-l { color: #6b7280; font-size: 11px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
  .main { display: grid; grid-template-columns: 1fr 280px; gap: 12px; padding: 0 24px 24px; }
  .panel { background: #12121a; border: 1px solid #1e1e2e; border-radius: 10px; overflow: hidden; }
  .panel-header { padding: 12px 16px; border-bottom: 1px solid #1e1e2e; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; justify-content: space-between; }
  .timeline { max-height: 70vh; overflow-y: auto; }
  .event { padding: 10px 16px; border-bottom: 1px solid #0f0f1a; display: flex; gap: 12px; align-items: flex-start; transition: background 0.1s; }
  .event:hover { background: #1a1a2e; }
  .event-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .event-body { flex: 1; min-width: 0; }
  .event-label { font-size: 11px; font-weight: 600; margin-bottom: 2px; }
  .event-detail { color: #6b7280; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'JetBrains Mono', monospace; }
  .event-ts { color: #374151; font-size: 10px; flex-shrink: 0; margin-top: 2px; }
  .event-user .event-label { color: #60a5fa; }
  .event-assistant .event-label { color: #a78bfa; }
  .tool-pill { display: inline-flex; align-items: center; gap: 4px; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 600; }
  .tool-counts { padding: 8px 0; }
  .tc-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 16px; border-bottom: 1px solid #0f0f1a; }
  .tc-name { display: flex; align-items: center; gap: 8px; color: #cbd5e1; }
  .tc-count { color: #f97316; font-weight: 700; font-size: 12px; }
  .tc-bar { height: 3px; background: #1e1e2e; border-radius: 2px; margin: 0 16px 8px; overflow: hidden; }
  .tc-fill { height: 100%; border-radius: 2px; background: #f97316; }
  .refresh-info { font-size: 10px; color: #374151; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 2px; }
</style>
</head>
<body>
<div class="header">
  <span class="logo">Tech<span>Churras</span></span>
  <span class="badge">Agent Dashboard</span>
  <span class="pulse"></span>
  <span id="updated" class="refresh-info">carregando...</span>
  <span style="margin-left:auto; color:#6b7280; font-size:11px;">atualiza a cada 3s</span>
</div>

<div class="stats">
  <div class="stat"><div class="stat-n" id="s-agents">—</div><div class="stat-l">Agentes instalados</div></div>
  <div class="stat"><div class="stat-n" id="s-global">—</div><div class="stat-l">Agentes globais</div></div>
  <div class="stat"><div class="stat-n" id="s-sessions">—</div><div class="stat-l">Sessões hoje</div></div>
  <div class="stat"><div class="stat-n" id="s-tools">—</div><div class="stat-l">Ações executadas</div></div>
</div>

<div class="main">
  <div class="panel">
    <div class="panel-header"><span>Atividade em tempo real</span><span id="event-count" style="color:#f97316"></span></div>
    <div class="timeline" id="timeline"></div>
  </div>
  <div class="panel">
    <div class="panel-header">Ferramentas mais usadas</div>
    <div class="tool-counts" id="tool-counts"></div>
  </div>
</div>

<script>
const TOOL_META = ${JSON.stringify(TOOL_META)}

function fmtTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function renderTimeline(events) {
  const el = document.getElementById('timeline')
  const scrolledToTop = el.scrollTop < 40
  const html = events.map(ev => {
    if (ev.type === 'user') {
      return \`<div class="event event-user">
        <span class="event-icon">👤</span>
        <div class="event-body">
          <div class="event-label">Você</div>
          <div class="event-detail" title="\${ev.text}">\${ev.text}</div>
        </div>
        <div class="event-ts">\${fmtTime(ev.ts)}</div>
      </div>\`
    }
    if (ev.type === 'assistant') {
      return \`<div class="event event-assistant">
        <span class="event-icon">🧠</span>
        <div class="event-body">
          <div class="event-label">Claude</div>
          <div class="event-detail" title="\${ev.text}">\${ev.text}</div>
        </div>
        <div class="event-ts">\${fmtTime(ev.ts)}</div>
      </div>\`
    }
    if (ev.type === 'tool') {
      const meta = TOOL_META[ev.toolName] || { icon: '🔧', label: ev.toolName, color: '#6b7280' }
      return \`<div class="event">
        <span class="event-icon">\${meta.icon}</span>
        <div class="event-body">
          <div class="event-label"><span class="tool-pill" style="background:\${meta.color}22; color:\${meta.color}">\${meta.label}</span></div>
          <div class="event-detail" title="\${ev.detail}">\${ev.detail || '—'}</div>
        </div>
        <div class="event-ts">\${fmtTime(ev.ts)}</div>
      </div>\`
    }
    return ''
  }).join('')
  el.innerHTML = html || '<div style="padding:32px;color:#374151;text-align:center">Nenhuma atividade recente</div>'
  if (scrolledToTop) el.scrollTop = 0
}

function renderToolCounts(counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const max = entries[0]?.[1] || 1
  const el = document.getElementById('tool-counts')
  el.innerHTML = entries.map(([name, count]) => {
    const meta = TOOL_META[name] || { icon: '🔧', color: '#6b7280' }
    const pct = Math.round((count / max) * 100)
    return \`<div class="tc-row">
      <span class="tc-name"><span>\${meta.icon}</span><span>\${name}</span></span>
      <span class="tc-count">\${count}</span>
    </div>
    <div class="tc-bar"><div class="tc-fill" style="width:\${pct}%; background:\${meta.color}"></div></div>\`
  }).join('')
}

async function refresh() {
  try {
    const res = await fetch('/api/activity')
    const data = await res.json()
    document.getElementById('s-agents').textContent = data.agents.project
    document.getElementById('s-global').textContent = data.agents.global
    document.getElementById('s-sessions').textContent = data.sessions
    document.getElementById('s-tools').textContent = data.totalEvents
    document.getElementById('event-count').textContent = data.events.length + ' eventos'
    document.getElementById('updated').textContent = 'atualizado ' + new Date(data.updatedAt).toLocaleTimeString('pt-BR')
    renderTimeline(data.events)
    renderToolCounts(data.toolCounts)
  } catch (e) {
    document.getElementById('updated').textContent = 'erro ao carregar'
  }
}

refresh()
setInterval(refresh, 3000)
</script>
</body>
</html>`

const server = http.createServer((req, res) => {
  const url = req.url?.split('?')[0]

  if (url === '/api/activity') {
    try {
      const data = getActivityData(24)
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      })
      res.end(JSON.stringify(data))
    } catch (e) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(DASHBOARD_HTML)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🔥 Tech Churras Agent Dashboard`)
  console.log(`   Abra no browser: http://localhost:${PORT}\n`)
})
