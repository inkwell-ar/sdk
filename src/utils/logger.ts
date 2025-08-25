export enum LogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export enum LogGroup {
  SDK = 'SDK',
  API = 'API',
  AUTH = 'AUTH',
  DEPLOY = 'DEPLOY',
  VALIDATION = 'VALIDATION',
  REGISTRY = 'REGISTRY',
}

export interface LoggerConfig {
  level: LogLevel;
}

export class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = { level: LogLevel.INFO }) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.level >= level;
  }

  private formatMessage(group: LogGroup, message: string): string {
    return `[${group}] ${message}`;
  }

  error(group: LogGroup, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(group, message), ...args);
    }
  }

  warn(group: LogGroup, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(group, message), ...args);
    }
  }

  info(group: LogGroup, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(group, message), ...args);
    }
  }

  debug(group: LogGroup, message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(group, message), ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getLevel(): LogLevel {
    return this.config.level;
  }
}
