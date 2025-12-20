import { createLogger } from './logger'

const mainLogger = createLogger('ErrorReporter')

interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  context: string
  message: string
  data?: any
}

interface ErrorReport {
  sessionId: string
  url: string
  userAgent: string
  timestamp: string
  logs: LogEntry[]
  error?: {
    message: string
    stack?: string
    componentStack?: string
  }
}

class ErrorReporter {
  private logs: LogEntry[] = []
  private maxLogs = 100 // 最大保持ログ数
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.loadFromLocalStorage() // ページリロード時に以前のログを復元
    this.setupConsoleInterceptor()
    this.setupErrorHandlers()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private setupConsoleInterceptor() {
    // 元のconsoleメソッドを保存
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    }

    // console.log をインターセプト
    console.log = (...args: any[]) => {
      this.addLog('info', 'Console', args.join(' '))
      originalConsole.log.apply(console, args)
    }

    // console.info をインターセプト
    console.info = (...args: any[]) => {
      this.addLog('info', 'Console', args.join(' '))
      originalConsole.info.apply(console, args)
    }

    // console.warn をインターセプト
    console.warn = (...args: any[]) => {
      this.addLog('warn', 'Console', args.join(' '))
      originalConsole.warn.apply(console, args)
    }

    // console.error をインターセプト
    console.error = (...args: any[]) => {
      this.addLog('error', 'Console', args.join(' '))
      originalConsole.error.apply(console, args)

      // エラーが発生したら自動的にレポート送信
      this.sendReport()
    }

    // console.debug をインターセプト
    console.debug = (...args: any[]) => {
      this.addLog('debug', 'Console', args.join(' '))
      originalConsole.debug.apply(console, args)
    }
  }

  private setupErrorHandlers() {
    // グローバルエラーハンドラ
    window.addEventListener('error', (event) => {
      this.addLog('error', 'GlobalError', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
      })
      this.sendReport()
    })

    // Promise の unhandledrejection
    window.addEventListener('unhandledrejection', (event) => {
      this.addLog('error', 'UnhandledRejection', String(event.reason), {
        promise: event.promise,
      })
      this.sendReport()
    })
  }

  addLog(level: LogEntry['level'], context: string, message: string, data?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
    }

    this.logs.push(logEntry)

    // 最大ログ数を超えたら古いものから削除
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // ローカルストレージにも保存（ページリロード時も保持）
    this.saveToLocalStorage()
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('error-reporter-logs', JSON.stringify(this.logs))
      localStorage.setItem('error-reporter-session', this.sessionId)
    } catch (e) {
      // ローカルストレージが使えない場合は無視
      mainLogger.warn('Failed to save logs to localStorage', e)
    }
  }

  private loadFromLocalStorage() {
    try {
      const savedLogs = localStorage.getItem('error-reporter-logs')
      const savedSession = localStorage.getItem('error-reporter-session')

      if (savedLogs) {
        this.logs = JSON.parse(savedLogs)
      }

      if (savedSession) {
        this.sessionId = savedSession
      }
    } catch (e) {
      mainLogger.warn('Failed to load logs from localStorage', e)
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
    localStorage.removeItem('error-reporter-logs')
  }

  async sendReport(error?: Error) {
    const report: ErrorReport = {
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      logs: this.getLogs(),
      error: error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    }

    // コンソールに出力（開発環境）
    if (import.meta.env.DEV) {
      console.group('📊 Error Report')
      console.log('Session ID:', report.sessionId)
      console.log('URL:', report.url)
      console.log('Timestamp:', report.timestamp)
      console.table(report.logs.slice(-20)) // 最新20件を表示
      if (report.error) {
        console.error('Error:', report.error)
      }
      console.groupEnd()
    }

    // バックエンドに送信（本番環境）
    if (!import.meta.env.DEV) {
      try {
        // TODO: バックエンドAPIを実装したら有効化
        // await fetch('/api/logs', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(report),
        // })

        // 暫定: ローカルストレージに保存
        const allReports = JSON.parse(localStorage.getItem('error-reports') || '[]')
        allReports.push(report)
        // 最新10件のみ保持
        if (allReports.length > 10) {
          allReports.shift()
        }
        localStorage.setItem('error-reports', JSON.stringify(allReports))

        mainLogger.info('Error report saved to localStorage')
      } catch (e) {
        mainLogger.error('Failed to send error report', e)
      }
    }
  }

  // 手動でレポートをダウンロード
  downloadReport() {
    const report: ErrorReport = {
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      logs: this.getLogs(),
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-report-${this.sessionId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// シングルトンインスタンス
export const errorReporter = new ErrorReporter()

// グローバルからアクセス可能にする（デバッグ用）
if (typeof window !== 'undefined') {
  ;(window as any).errorReporter = errorReporter
}
