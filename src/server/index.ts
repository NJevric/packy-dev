import { createServer } from './app.js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PORT = parseInt(process.env.PORT || '3001', 10)
const projectPath = process.env.PROJECT_PATH || process.cwd()
const clientDistPath = join(__dirname, '../client')

const app = createServer(projectPath, clientDistPath, PORT)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Project path: ${projectPath}`)
})
