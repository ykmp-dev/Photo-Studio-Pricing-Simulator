/**
 * ロギングユーティリティ
 * 全ての操作をログに記録し、デバッグとトラブルシューティングを容易にする
 */

// ログレベル
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

// ログのプレフィックス（色分け用）
const LOG_STYLES = {
  info: 'color: #2196F3; font-weight: bold',
  warn: 'color: #FF9800; font-weight: bold',
  error: 'color: #F44336; font-weight: bold',
  debug: 'color: #9E9E9E; font-weight: bold',
}

/**
 * 統一されたログ出力
 */
export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  /**
 * 情報ログ
   */
  info(message: string, data?: any) {
    const timestamp = new Date().toISOString()
    console.log(
      `%c[INFO] ${timestamp} [${this.context}]`,
      LOG_STYLES.info,
      message,
      data !== undefined ? data : ''
    )
  }

  /**
   * 警告ログ
   */
  warn(message: string, data?: any) {
    const timestamp = new Date().toISOString()
    console.warn(
      `%c[WARN] ${timestamp} [${this.context}]`,
      LOG_STYLES.warn,
      message,
      data !== undefined ? data : ''
    )
  }

  /**
   * エラーログ
   */
  error(message: string, error?: any) {
    const timestamp = new Date().toISOString()
    console.error(
      `%c[ERROR] ${timestamp} [${this.context}]`,
      LOG_STYLES.error,
      message,
      error !== undefined ? error : ''
    )
  }

  /**
   * デバッグログ（開発環境のみ）
   */
  debug(message: string, data?: any) {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString()
      console.log(
        `%c[DEBUG] ${timestamp} [${this.context}]`,
        LOG_STYLES.debug,
        message,
        data !== undefined ? data : ''
      )
    }
  }

  /**
   * 関数の開始をログ
   */
  functionStart(functionName: string, params?: any) {
    this.debug(`→ ${functionName} START`, params)
  }

  /**
   * 関数の終了をログ
   */
  functionEnd(functionName: string, result?: any) {
    this.debug(`← ${functionName} END`, result)
  }

  /**
   * 状態変更をログ
   */
  stateChange(stateName: string, oldValue: any, newValue: any) {
    this.debug(`STATE CHANGE: ${stateName}`, { old: oldValue, new: newValue })
  }

  /**
   * APIリクエストをログ
   */
  apiRequest(method: string, endpoint: string, params?: any) {
    this.info(`API REQUEST: ${method} ${endpoint}`, params)
  }

  /**
   * APIレスポンスをログ
   */
  apiResponse(method: string, endpoint: string, response: any) {
    this.info(`API RESPONSE: ${method} ${endpoint}`, response)
  }

  /**
   * APIエラーをログ
   */
  apiError(method: string, endpoint: string, error: any) {
    this.error(`API ERROR: ${method} ${endpoint}`, error)
  }

  /**
   * ユーザーアクションをログ
   */
  userAction(action: string, details?: any) {
    this.info(`USER ACTION: ${action}`, details)
  }

  /**
   * バリデーションエラーをログ
   */
  validationError(field: string, message: string, value?: any) {
    this.warn(`VALIDATION ERROR: ${field} - ${message}`, value)
  }
}

/**
 * ロガーインスタンスを作成
 */
export function createLogger(context: string): Logger {
  return new Logger(context)
}

/**
 * パフォーマンス計測用のタイマー
 */
export class PerformanceTimer {
  private startTime: number
  private label: string
  private logger: Logger

  constructor(label: string, logger: Logger) {
    this.label = label
    this.logger = logger
    this.startTime = performance.now()
    this.logger.debug(`⏱️ TIMER START: ${label}`)
  }

  /**
   * タイマーを停止して経過時間をログ
   */
  end() {
    const elapsed = performance.now() - this.startTime
    this.logger.debug(`⏱️ TIMER END: ${this.label}`, `${elapsed.toFixed(2)}ms`)
  }
}
