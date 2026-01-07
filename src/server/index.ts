import { createServer } from './app.js'

const PORT = parseInt(process.env.PORT || '3001', 10)
const projectPath = process.env.PROJECT_PATH || process.cwd()

const app = createServer(projectPath)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Project path: ${projectPath}`)
})
