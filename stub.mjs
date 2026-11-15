// Стаб /api/bookings: отдаёт dataset из рядом лежащего dataset.json (перечитывается на каждый запрос)
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'

createServer((req, res) => {
  if (req.url === '/api/bookings') {
    const data = JSON.parse(readFileSync(new URL('./dataset.json', import.meta.url), 'utf8'))
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(data))
    return
  }
  res.writeHead(404)
  res.end()
}).listen(18080, () => console.log('stub on 18080'))
