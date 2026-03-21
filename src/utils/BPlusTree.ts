/**
 * B+ Tree Implementation in TypeScript
 * Ported from Python implementation provided by user.
 */

export class BPlusTreeNode<K, V> {
  keys: K[] = [];
  children: BPlusTreeNode<K, V>[] = [];
  values: V[] = [];
  next: BPlusTreeNode<K, V> | null = null;
  isLeaf: boolean;

  constructor(isLeaf = false) {
    this.isLeaf = isLeaf;
  }
}

export class BPlusTree<K, V> {
  t: number;
  maxKeys: number;
  minKeys: number;
  root: BPlusTreeNode<K, V>;

  constructor(order = 4) {
    this.t = order;
    this.maxKeys = 2 * order - 1;
    this.minKeys = order - 1;
    this.root = new BPlusTreeNode<K, V>(true);
  }

  search(key: K): V | null {
    let node = this.root;
    while (!node.isLeaf) {
      let i = 0;
      while (i < node.keys.length && key >= node.keys[i]) {
        i++;
      }
      node = node.children[i];
    }

    for (let i = 0; i < node.keys.length; i++) {
      if (node.keys[i] === key) {
        return node.values[i];
      }
    }
    return null;
  }

  insert(key: K, value: V): void {
    if (nodeIsFull(this.root, this.maxKeys)) {
      const oldRoot = this.root;
      const newRoot = new BPlusTreeNode<K, V>(false);
      newRoot.children.push(oldRoot);
      this.splitChild(newRoot, 0);
      this.root = newRoot;
    }
    this.insertNonFull(this.root, key, value);
  }

  private insertNonFull(node: BPlusTreeNode<K, V>, key: K, value: V): void {
    if (node.isLeaf) {
      for (let i = 0; i < node.keys.length; i++) {
        if (node.keys[i] === key) {
          node.values[i] = value;
          return;
        }
      }

      let i = node.keys.length - 1;
      node.keys.push(null as any);
      node.values.push(null as any);
      while (i >= 0 && node.keys[i] > key) {
        node.keys[i + 1] = node.keys[i];
        node.values[i + 1] = node.values[i];
        i--;
      }
      node.keys[i + 1] = key;
      node.values[i + 1] = value;
    } else {
      let i = node.keys.length - 1;
      while (i >= 0 && key < node.keys[i]) {
        i--;
      }
      i++;

      if (nodeIsFull(node.children[i], this.maxKeys)) {
        this.splitChild(node, i);
        if (key >= node.keys[i]) {
          i++;
        }
      }
      this.insertNonFull(node.children[i], key, value);
    }
  }

  private splitChild(parent: BPlusTreeNode<K, V>, index: number): void {
    const t = this.t;
    const child = parent.children[index];
    const newNode = new BPlusTreeNode<K, V>(child.isLeaf);
    const mid = t - 1;

    if (child.isLeaf) {
      newNode.keys = child.keys.slice(mid);
      newNode.values = child.values.slice(mid);
      child.keys = child.keys.slice(0, mid);
      child.values = child.values.slice(0, mid);

      newNode.next = child.next;
      child.next = newNode;

      parent.keys.splice(index, 0, newNode.keys[0]);
    } else {
      const midKey = child.keys[mid];

      newNode.keys = child.keys.slice(mid + 1);
      newNode.children = child.children.slice(mid + 1);
      child.keys = child.keys.slice(0, mid);
      child.children = child.children.slice(0, mid + 1);

      parent.keys.splice(index, 0, midKey);
    }
    parent.children.splice(index + 1, 0, newNode);
  }

  update(key: K, newValue: V): boolean {
    let node = this.root;
    while (!node.isLeaf) {
      let i = 0;
      while (i < node.keys.length && key >= node.keys[i]) {
        i++;
      }
      node = node.children[i];
    }

    for (let i = 0; i < node.keys.length; i++) {
      if (node.keys[i] === key) {
        node.values[i] = newValue;
        return true;
      }
    }
    return false;
  }

  getAll(): [K, V][] {
    const result: [K, V][] = [];
    let node = this.root;
    while (!node.isLeaf) {
      node = node.children[0];
    }

    let current: BPlusTreeNode<K, V> | null = node;
    while (current !== null) {
      for (let i = 0; i < current.keys.length; i++) {
        result.push([current.keys[i], current.values[i]]);
      }
      current = current.next;
    }
    return result;
  }

  clear(): void {
    this.root = new BPlusTreeNode<K, V>(true);
  }
}

function nodeIsFull<K, V>(node: BPlusTreeNode<K, V>, maxKeys: number): boolean {
  return node.keys.length === maxKeys;
}
