import { WAL } from './WAL';
import { DatabaseManager } from './DatabaseManager';

export class RecoveryManager {
  private wal: WAL;
  private dbManager: DatabaseManager;

  constructor(wal: WAL, dbManager: DatabaseManager) {
    this.wal = wal;
    this.dbManager = dbManager;
  }

  recover() {
    const logs = this.wal.getLogs();
    const transactions: { [txId: string]: any[] } = {};
    const committedTransactions: Set<string> = new Set();
    const rolledBackTransactions: Set<string> = new Set();

    // Group logs by transaction and identify committed/rolled back ones
    for (const log of logs) {
      const { transactionId, operation } = log;
      if (!transactions[transactionId]) {
        transactions[transactionId] = [];
      }
      transactions[transactionId].push(log);

      if (operation === 'COMMIT') {
        committedTransactions.add(transactionId);
      } else if (operation === 'ROLLBACK') {
        rolledBackTransactions.add(transactionId);
      }
    }

    // Redo committed transactions
    for (const txId of committedTransactions) {
      const txLogs = transactions[txId];
      for (const log of txLogs) {
        const { operation, tableName, key, value } = log;
        if (operation === 'INSERT' || operation === 'UPDATE') {
          const table = this.dbManager.getTable(tableName);
          if (table) {
            table.insert(key, value);
          }
        } else if (operation === 'DELETE') {
          const table = this.dbManager.getTable(tableName);
          if (table) {
            table.delete(key);
          }
        }
      }
    }

    // Identify uncommitted transactions (those without COMMIT or ROLLBACK)
    const uncommittedTransactions = Object.keys(transactions).filter(
      txId => !committedTransactions.has(txId) && !rolledBackTransactions.has(txId)
    );

    // Undo uncommitted transactions (if necessary, but for simplicity we just log them)
    // In a real system, we would undo changes made by these transactions.
    console.log(`Recovery complete. Redone ${committedTransactions.size} transactions. Found ${uncommittedTransactions.length} uncommitted transactions.`);
  }
}
