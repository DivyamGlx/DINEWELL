import fs from 'fs';
import path from 'path';

export class WAL {
  private logFile: string;

  constructor(logFile: string = 'logs/wal.log') {
    this.logFile = path.resolve(process.cwd(), logFile);
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(transactionId: string, operation: string, tableName: string, key: any, value: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      transactionId,
      operation,
      tableName,
      key,
      value,
    };
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
  }

  getLogs(): any[] {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }
    const content = fs.readFileSync(this.logFile, 'utf8');
    return content.trim().split('\n').map(line => JSON.parse(line));
  }

  clear() {
    if (fs.existsSync(this.logFile)) {
      fs.truncateSync(this.logFile, 0);
    }
  }
}
