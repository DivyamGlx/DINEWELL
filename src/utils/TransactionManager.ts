import { WAL } from './WAL';

export class TransactionManager {
  private wal: WAL;
  private activeTransactions: Set<string>;

  constructor(wal: WAL) {
    this.wal = wal;
    this.activeTransactions = new Set();
  }

  beginTransaction(): string {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeTransactions.add(transactionId);
    this.wal.log(transactionId, 'BEGIN', '', null, null);
    return transactionId;
  }

  commit(transactionId: string) {
    if (!this.activeTransactions.has(transactionId)) {
      throw new Error(`Transaction ${transactionId} not found.`);
    }
    this.wal.log(transactionId, 'COMMIT', '', null, null);
    this.activeTransactions.delete(transactionId);
  }

  rollback(transactionId: string) {
    if (!this.activeTransactions.has(transactionId)) {
      throw new Error(`Transaction ${transactionId} not found.`);
    }
    this.wal.log(transactionId, 'ROLLBACK', '', null, null);
    this.activeTransactions.delete(transactionId);
  }

  logOperation(transactionId: string, operation: string, tableName: string, key: any, value: any) {
    if (!this.activeTransactions.has(transactionId)) {
      throw new Error(`Transaction ${transactionId} not found.`);
    }
    this.wal.log(transactionId, operation, tableName, key, value);
  }

  getActiveTransactions(): string[] {
    return Array.from(this.activeTransactions);
  }
}
