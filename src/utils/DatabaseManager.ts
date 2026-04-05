import { BPlusTree } from './BPlusTree';
import { TransactionManager } from './TransactionManager';

export class DatabaseManager {
  private tables: { [name: string]: BPlusTree<any, any> };
  private transactionManager: TransactionManager;

  constructor(transactionManager: TransactionManager) {
    this.tables = {};
    this.transactionManager = transactionManager;
  }

  createTable(name: string, order: number = 4) {
    if (this.tables[name]) {
      throw new Error(`Table ${name} already exists.`);
    }
    this.tables[name] = new BPlusTree<any, any>(order);
  }

  dropTable(name: string) {
    if (!this.tables[name]) {
      throw new Error(`Table ${name} not found.`);
    }
    delete this.tables[name];
  }

  getTable(name: string): BPlusTree<any, any> | undefined {
    return this.tables[name];
  }

  insert(transactionId: string, tableName: string, key: any, value: any) {
    const table = this.getTable(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not found.`);
    }
    this.transactionManager.logOperation(transactionId, 'INSERT', tableName, key, value);
    table.insert(key, value);
  }

  update(transactionId: string, tableName: string, key: any, value: any) {
    const table = this.getTable(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not found.`);
    }
    this.transactionManager.logOperation(transactionId, 'UPDATE', tableName, key, value);
    table.update(key, value);
  }

  delete(transactionId: string, tableName: string, key: any) {
    const table = this.getTable(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not found.`);
    }
    this.transactionManager.logOperation(transactionId, 'DELETE', tableName, key, null);
    table.delete(key);
  }

  search(tableName: string, key: any): any {
    const table = this.getTable(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not found.`);
    }
    return table.search(key);
  }

  getAll(tableName: string): any[] {
    const table = this.getTable(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} not found.`);
    }
    return table.getAll();
  }
}
