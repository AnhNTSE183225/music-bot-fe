import { appConfig } from '@/config/app-config'

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

const weights: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
}

const currentLevel = appConfig.logging.level

const shouldLog = (level: LogLevel) => weights[level] >= weights[currentLevel]

const write = (level: LogLevel, message: string, payload?: unknown) => {
  if (!shouldLog(level)) {
    return
  }

  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] [${level}] ${message}`

  if (payload === undefined) {
    console.log(line)
    return
  }

  console.log(line, payload)
}

export const logger = {
  debug: (message: string, payload?: unknown) => write('DEBUG', message, payload),
  info: (message: string, payload?: unknown) => write('INFO', message, payload),
  warn: (message: string, payload?: unknown) => write('WARN', message, payload),
  error: (message: string, payload?: unknown) => write('ERROR', message, payload),
}
