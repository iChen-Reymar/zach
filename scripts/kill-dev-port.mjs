import { execSync } from 'child_process'

const port = process.argv[2] || '5173'

try {
  if (process.platform === 'win32') {
    const out = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, { encoding: 'utf8' })
    const pids = [...new Set(out.split('\n').map((line) => line.trim().split(/\s+/).pop()).filter(Boolean))]
    for (const pid of pids) {
      if (pid && pid !== '0') {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
        console.log(`Stopped process ${pid} on port ${port}`)
      }
    }
  } else {
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' })
  }
} catch {
  // Port was already free
}
