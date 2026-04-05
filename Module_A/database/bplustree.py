import math

class Node:
    def __init__(self, is_leaf=False):
        self.is_leaf = is_leaf
        self.keys = []
        self.values = []
        self.children = []
        self.next = None

class BPlusTree:
    def __init__(self, order=4):
        self.root = Node(is_leaf=True)
        self.order = order

    def search(self, key):
        node = self.root
        while not node.is_leaf:
            i = 0
            while i < len(node.keys) and key >= node.keys[i]:
                i += 1
            node = node.children[i]
        
        for i, k in enumerate(node.keys):
            if k == key:
                return node.values[i]
        return None

    def insert(self, key, value):
        node = self.root
        if len(node.keys) == self.order - 1:
            new_root = Node()
            new_root.children.append(self.root)
            self._split_child(new_root, 0)
            self.root = new_root
        self._insert_non_full(self.root, key, value)

    def _split_child(self, parent, i):
        order = self.order
        node = parent.children[i]
        new_node = Node(is_leaf=node.is_leaf)
        mid = order // 2

        parent.keys.insert(i, node.keys[mid-1])
        parent.children.insert(i + 1, new_node)

        new_node.keys = node.keys[mid:]
        node.keys = node.keys[:mid]

        if node.is_leaf:
            new_node.values = node.values[mid:]
            node.values = node.values[:mid]
            new_node.next = node.next
            node.next = new_node
        else:
            new_node.children = node.children[mid:]
            node.children = node.children[:mid]

    def _insert_non_full(self, node, key, value):
        if node.is_leaf:
            i = 0
            while i < len(node.keys) and key > node.keys[i]:
                i += 1
            if i < len(node.keys) and node.keys[i] == key:
                node.values[i] = value
            else:
                node.keys.insert(i, key)
                node.values.insert(i, value)
        else:
            i = 0
            while i < len(node.keys) and key >= node.keys[i]:
                i += 1
            if len(node.children[i].keys) == self.order - 1:
                self._split_child(node, i)
                if key >= node.keys[i]:
                    i += 1
            self._insert_non_full(node.children[i], key, value)

    def update(self, key, value):
        self.insert(key, value)

    def delete(self, key):
        # Simplified delete: just remove from leaf
        node = self.root
        while not node.is_leaf:
            i = 0
            while i < len(node.keys) and key >= node.keys[i]:
                i += 1
            node = node.children[i]
        
        for i, k in enumerate(node.keys):
            if k == key:
                node.keys.pop(i)
                node.values.pop(i)
                return True
        return False

    def get_all(self):
        node = self.root
        while not node.is_leaf:
            node = node.children[0]
        
        results = []
        while node:
            for i in range(len(node.keys)):
                results.append({'key': node.keys[i], 'value': node.values[i]})
            node = node.next
        return results
