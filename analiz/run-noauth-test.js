'use strict'
const API = 'https://savdo-api-production.up.railway.app'
const c = {
  reset:'\x1b[0m', bold:'\x1b[1m',
  green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m',
  cyan:'\x1b[36m', gray:'\x1b[90m', magenta:'\x1b[35m'
}
const stats = { pass: 0, fail: 0, warn: 0 }

async function req(method, path, body, token, ms = 8000) {
  const headers = { 'Content-Type': 'application/json' }
  if (token !== null && token !== '') headers['Authorization'] = 'Bearer ' + token
  const t0 = Date.now()
  try {
    const res = await fetch(API + path, {
      method, headers,
      body: body !== null ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(ms),
    })
    const elapsed = Date.now() - t0
    let json = null; try { json = await res.json() } catch {}
    return { status: res.status, json, ms: elapsed }
  } catch(e) { return { status: 0, ms: Date.now() - t0, err: e.message } }
}

async function rawReq(method, path, rawBody) {
  const headers = { 'Content-Type': 'application/json' }
  try {
    const res = await fetch(API + path, { method, headers, body: rawBody, signal: AbortSignal.timeout(8000) })
    return { status: res.status }
  } catch { return { status: 0 } }
}

const pass = (id, msg) => { console.log(c.green+'  PASS'+c.reset+' '+c.bold+id+c.reset+' — '+msg); stats.pass++ }
const fail = (id, msg) => { console.log(c.red+'  FAIL'+c.reset+' '+c.bold+id+c.reset+' — '+msg); stats.fail++ }
const warn_ = (id, msg) => { console.log(c.yellow+'  WARN'+c.reset+' '+c.bold+id+c.reset+' — '+msg); stats.warn++ }
const info = (msg) => console.log(c.cyan+'  INFO'+c.reset+' '+msg)
const section = (n) => console.log('\n'+c.bold+c.magenta+'━━━ '+n+' ━━━'+c.reset)
const concurrent = (n, fn) => Promise.all(Array.from({length:n},(_,i)=>fn(i)))

async function main() {
  console.log(c.bold+c.cyan+'\n  Admin Stress Test LIVE (без токена — auth + injection + rate)\n  API: '+API+c.reset)

  // ── AUTH ──────────────────────────────────────────────────────────────────
  section('AUTH — невалидные / отсутствующие токены')

  const a1 = await req('GET', '/api/v1/admin/products?limit=5', null, '')
  a1.status===401 ? pass('AUTH-01','пустой token → 401 ('+a1.ms+'ms)') : fail('AUTH-01','ожидали 401, получили '+a1.status)

  const a2 = await req('GET', '/api/v1/admin/products?limit=5', null, 'not.a.valid.jwt')
  a2.status===401 ? pass('AUTH-02','сломанный JWT → 401 ('+a2.ms+'ms)') : fail('AUTH-02','ожидали 401, получили '+a2.status)

  const expPayload = Buffer.from(JSON.stringify({sub:'test',exp:1000000000,role:'ADMIN'})).toString('base64url')
  const fakeJwt = 'eyJhbGciOiJIUzI1NiJ9.'+expPayload+'.invalidsig'
  const a3 = await req('GET', '/api/v1/admin/products?limit=5', null, fakeJwt)
  a3.status===401 ? pass('AUTH-03','expired/fake JWT → 401 ('+a3.ms+'ms)') : fail('AUTH-03','получили '+a3.status)

  const a4 = await req('GET', '/api/v1/admin/products?limit=5', null, "'; DROP TABLE users; --")
  ;[400,401].includes(a4.status) ? pass('AUTH-05',"SQL inject в Bearer → "+a4.status+" ("+a4.ms+"ms)") : fail('AUTH-05','получили '+a4.status+(a4.status===500?' — КРИТИЧНО!':''))

  const a5 = await req('GET', '/api/v1/admin/products?limit=5', null, '<img src=x onerror=alert(1)>')
  ;[400,401].includes(a5.status) ? pass('AUTH-06','XSS в Bearer → '+a5.status+' ('+a5.ms+'ms)') : fail('AUTH-06','получили '+a5.status)

  const a6 = await req('GET', '/api/v1/admin/products?limit=5', null, 'a'.repeat(100000))
  ;[400,401,413,431].includes(a6.status) ? pass('AUTH-07','100k char token → '+a6.status+' (431=Header Too Large — OK, '+a6.ms+'ms)') : fail('AUTH-07','получили '+a6.status)

  info('Тело ответа при пустом токене: '+JSON.stringify(a1.json))

  // ── SEARCH INJECTIONS ─────────────────────────────────────────────────────
  section('SEARCH — injection / fuzzing (ожидаем 200/400/401, не 500)')

  const searches = [
    ['SRCH-01','SQL classic'         ,"'; DROP TABLE users; --"],
    ['SRCH-02','SQL UNION'           ,"' UNION SELECT 1,2,3--"],
    ['SRCH-03','SQL LIKE flood'      ,'%'.repeat(1000)],
    ['SRCH-04','XSS script'          ,'<script>alert(1)</script>'],
    ['SRCH-05','XSS onerror'         ,'<img src=x onerror=alert(1)>'],
    ['SRCH-06','Path traversal'      ,'../../etc/passwd'],
    ['SRCH-07','Template inject'     ,'${7*7}{{7*7}}'],
    ['SRCH-08','Null byte'           ,'pro\x00duct'],
    ['SRCH-09','RTL text'            ,'‮test'],
    ['SRCH-10','Emoji flood'         ,'🛍️'.repeat(200)],
    ['SRCH-11','10k chars'           ,'a'.repeat(10000)],
    ['SRCH-12','NoSQL inject'        ,'{"$gt":""}'],
    ['SRCH-13','CRLF inject'         ,'foo\r\nX-Injected: yes'],
    ['SRCH-14','Underscore flood'    ,'_'.repeat(500)],
  ]
  for (const [id, label, q] of searches) {
    const res = await req('GET', '/api/v1/admin/products?search='+encodeURIComponent(q), null, '')
    if (res.status===500) fail(id, label+' → 500! КРИТИЧНО')
    else if ([200,400,401].includes(res.status)) pass(id, label+' → '+res.status+' ('+res.ms+'ms)')
    else warn_(id, label+' → '+res.status)
  }

  // ── PAYLOAD EDGE CASES ────────────────────────────────────────────────────
  section('EDGE — payload атаки (без токена → 401/400, не 500)')

  const e1 = await rawReq('PATCH','/api/v1/admin/products/00000000-0000-0000-0000-000000000000/hide','{ BAD JSON !!!')
  ;[400,401].includes(e1.status) ? pass('EDGE-21','невалидный JSON body → '+e1.status) : fail('EDGE-21','получили '+e1.status)

  const e2 = await req('PATCH','/api/v1/admin/db/tables/products/00000000-0000-0000-0000-000000000000',{title:'x'.repeat(500000)},null)
  ;[400,401,413].includes(e2.status)
    ? pass('EDGE-22','500k payload → '+e2.status+' ('+e2.ms+'ms)')
    : e2.status===500
      ? (()=>{ fail('EDGE-22','500k payload → 500! Body-парсер крашится ДО auth guard — DoS вектор'); })()
      : fail('EDGE-22','получили '+e2.status)

  const e3 = await req('PATCH','/api/v1/admin/db/tables/products/00000000-0000-0000-0000-000000000000',{'__proto__':{admin:true}},null)
  ;[400,401].includes(e3.status) ? pass('EDGE-23','prototype pollution → '+e3.status) : fail('EDGE-23','получили '+e3.status)

  const e4 = await req('DELETE','/api/v1/admin/db/tables/products/not-a-uuid',null,null)
  ;[400,401,404].includes(e4.status) ? pass('EDGE-24','DELETE невалидный UUID → '+e4.status) : fail('EDGE-24','получили '+e4.status)

  const e5 = await req('GET','/api/v1/admin/db/tables/; DROP TABLE products;--',null,null)
  ;[400,401,404].includes(e5.status) ? pass('EDGE-25','SQL inject в table name → '+e5.status) : fail('EDGE-25','получили '+e5.status)

  // ── PAGINATION ────────────────────────────────────────────────────────────
  section('PAGINATION — граничные значения (без токена)')

  const pags = [
    ['PAG-01','/api/v1/admin/db/tables/products?page=9999&limit=25','page=9999'],
    ['PAG-02','/api/v1/admin/db/tables/products?page=0&limit=25','page=0'],
    ['PAG-03','/api/v1/admin/db/tables/products?page=-1&limit=25','page=-1'],
    ['PAG-04','/api/v1/admin/db/tables/products?page=1&limit=10000','limit=10000 DoS probe'],
    ['PAG-05','/api/v1/admin/db/tables/products?limit=abc','limit=abc'],
  ]
  for (const [id,path,label] of pags) {
    const res = await req('GET',path,null,'')
    res.status===500 ? fail(id,label+' → 500!') : pass(id,label+' → '+res.status+' ('+res.ms+'ms)')
  }

  // ── RATE / BURST ──────────────────────────────────────────────────────────
  section('RATE — 30 concurrent запросов (без токена)')

  info('Запускаю 30 параллельных GET...')
  const burst = await concurrent(30, () => req('GET','/api/v1/admin/products?limit=5',null,''))
  const codes = burst.map(r=>r.status)
  const c500 = codes.filter(x=>x===500).length
  const c401 = codes.filter(x=>x===401).length
  const c429 = codes.filter(x=>x===429).length
  c500===0
    ? pass('RATE-01','30 concurrent → нет 500 (401:'+c401+' 429:'+c429+')')
    : fail('RATE-01','30 concurrent → '+c500+' ответов 500!')
  const times = burst.map(r=>r.ms).sort((a,b)=>a-b)
  const avg = Math.round(times.reduce((s,v)=>s+v,0)/times.length)
  const p95 = times[Math.floor(times.length*0.95)]
  info('Timing: avg='+avg+'ms  p95='+p95+'ms  min='+times[0]+'ms  max='+times[times.length-1]+'ms')
  if (p95>5000) warn_('RATE-01','p95 > 5s — latency bottleneck под нагрузкой')
  if (c429>0) info('Rate limit активен — '+c429+'/30 запросов ограничено (хорошо)')

  // ── ИТОГ ─────────────────────────────────────────────────────────────────
  section('ИТОГ')
  const total = stats.pass+stats.fail+stats.warn
  console.log('\n  '+c.green+c.bold+'PASS: '+stats.pass+c.reset+'  '+c.red+c.bold+'FAIL: '+stats.fail+c.reset+'  '+c.yellow+'WARN: '+stats.warn+c.reset)
  console.log(c.gray+'  Всего проверок: '+total+c.reset+'\n')
  if (stats.fail>0) { console.log(c.red+c.bold+'  ⚠️  ЕСТЬ КРИТИЧЕСКИЕ ПРОБЛЕМЫ'+c.reset); process.exit(1) }
  else console.log(c.green+c.bold+'  ✅ Все проверки прошли!'+c.reset)
}

main().catch(e=>{ console.error(c.red+'Fatal: '+e.message+c.reset); process.exit(1) })
