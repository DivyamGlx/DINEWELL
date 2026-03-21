# ============================================================
# B+ Tree Implementation
# CS 432 - Assignment 2, Module A
# ============================================================

try:
    from graphviz import Digraph
    GRAPHVIZ_AVAILABLE = True
except ImportError:
    GRAPHVIZ_AVAILABLE = False
    print("Warning: graphviz not installed. Visualisation disabled.")


class BPlusTreeNode:
    """
    A single node in the B+ Tree.

    Attributes
    ----------
    keys     : sorted list of keys in this node
    children : child node pointers (internal nodes only)
    values   : associated record values (leaf nodes only)
    next     : pointer to next leaf node (leaf nodes only)
    is_leaf  : True if this is a leaf node
    """

    def __init__(self, is_leaf=False):
        self.keys = []
        self.children = []
        self.values = []
        self.next = None
        self.is_leaf = is_leaf

    def __repr__(self):
        return f"BPlusTreeNode(keys={self.keys}, is_leaf={self.is_leaf})"


class BPlusTree:
    """
    B+ Tree with full CRUD, range queries, and Graphviz visualisation.

    Parameters
    ----------
    order : int
        Minimum degree t.
        - Max keys per node  : 2t - 1
        - Min keys (non-root): t - 1
        Default order=4 → nodes hold 3 to 7 keys.
    """

    def __init__(self, order=4):
        self.t        = order
        self.max_keys = 2 * order - 1
        self.min_keys = order - 1
        self.root     = BPlusTreeNode(is_leaf=True)

    # ============================================================
    # SEARCH
    # ============================================================

    def search(self, key):
        """
        Search for a key in the B+ tree.
        Return the associated value if found, else None.
        Traverses from root down to the appropriate leaf node.
        """
        node = self.root
        while not node.is_leaf:
            i = 0
            while i < len(node.keys) and key >= node.keys[i]:
                i += 1
            node = node.children[i]

        # Now at the correct leaf — check for key
        for i, k in enumerate(node.keys):
            if k == key:
                return node.values[i]
        return None

    # ============================================================
    # INSERT
    # ============================================================

    def insert(self, key, value):
        """
        Insert key-value pair into the B+ tree.
        If key already exists, its value is updated instead.
        Handles root splitting if necessary.
        Maintains sorted order and balance properties.
        """
        # Pre-split root if it is full
        if len(self.root.keys) == self.max_keys:
            old_root = self.root
            new_root = BPlusTreeNode(is_leaf=False)
            new_root.children.append(old_root)
            self._split_child(new_root, 0)
            self.root = new_root

        self._insert_non_full(self.root, key, value)

    def _insert_non_full(self, node, key, value):
        """
        Recursive helper to insert into a non-full node.
        Splits child nodes if they become full during insertion.
        """
        if node.is_leaf:
            # If key already exists, update its value
            for i, k in enumerate(node.keys):
                if k == key:
                    node.values[i] = value
                    return

            # Shift keys right to make room, then insert
            i = len(node.keys) - 1
            node.keys.append(None)
            node.values.append(None)
            while i >= 0 and node.keys[i] > key:
                node.keys[i + 1]   = node.keys[i]
                node.values[i + 1] = node.values[i]
                i -= 1
            node.keys[i + 1]   = key
            node.values[i + 1] = value

        else:
            # Find the correct child to descend into
            i = len(node.keys) - 1
            while i >= 0 and key < node.keys[i]:
                i -= 1
            i += 1

            # Pre-split child if it is full
            if len(node.children[i].keys) == self.max_keys:
                self._split_child(node, i)
                # After split decide which of the two new children to use
                if key >= node.keys[i]:
                    i += 1

            self._insert_non_full(node.children[i], key, value)

    def _split_child(self, parent, index):
        """
        Split parent.children[index] which is currently full.

        For leaves   : preserve the linked-list structure and COPY
                       the middle key up to the parent.
        For internal : PROMOTE (remove) the middle key up to the parent
                       and split the children list.
        """
        t        = self.t
        child    = parent.children[index]
        new_node = BPlusTreeNode(is_leaf=child.is_leaf)
        mid      = t - 1        # index of the split point

        if child.is_leaf:
            # ── Leaf split ──────────────────────────────────────
            new_node.keys   = child.keys[mid:]
            new_node.values = child.values[mid:]
            child.keys      = child.keys[:mid]
            child.values    = child.values[:mid]

            # Maintain the leaf linked list
            new_node.next = child.next
            child.next    = new_node

            # Copy first key of new_node up to parent (key stays in leaf too)
            parent.keys.insert(index, new_node.keys[0])

        else:
            # ── Internal node split ──────────────────────────────
            mid_key = child.keys[mid]

            new_node.keys     = child.keys[mid + 1:]
            new_node.children = child.children[mid + 1:]
            child.keys        = child.keys[:mid]
            child.children    = child.children[:mid + 1]

            # Promote mid_key to parent (it leaves the child)
            parent.keys.insert(index, mid_key)

        parent.children.insert(index + 1, new_node)

    # ============================================================
    # DELETE
    # ============================================================

    def delete(self, key):
        """
        Delete key from the B+ tree.
        Handles underflow by borrowing from siblings or merging nodes.
        Shrinks the root if it becomes empty.
        Returns True if deletion succeeded, False otherwise.
        """
        if not self.root.keys:
            return False

        result = self._delete(self.root, key)

        # If root became an empty internal node, shrink the tree height
        if not self.root.is_leaf and len(self.root.keys) == 0:
            self.root = self.root.children[0]

        return result

    def _delete(self, node, key):
        """
        Recursive helper for deletion.
        Handles both leaf and internal nodes.
        Ensures all nodes maintain minimum key count after deletion.
        """
        if node.is_leaf:
            if key in node.keys:
                idx = node.keys.index(key)
                node.keys.pop(idx)
                node.values.pop(idx)
                return True
            return False

        # Find the child to recurse into
        i = 0
        while i < len(node.keys) and key >= node.keys[i]:
            i += 1

        # Before descending, ensure child has more than the minimum keys
        # so it can afford to lose one key without underflowing
        if len(node.children[i].keys) <= self.min_keys:
            self._fill_child(node, i)
            # Recompute i because _fill_child may have changed the structure
            i = 0
            while i < len(node.keys) and key >= node.keys[i]:
                i += 1

        result = self._delete(node.children[i], key)

        # Update the separator key: node.keys[i-1] must equal the
        # minimum key reachable in node.children[i]
        if i > 0 and node.children[i].keys:
            min_key = self._get_min_leaf_key(node.children[i])
            if min_key is not None:
                node.keys[i - 1] = min_key

        return result

    def _get_min_leaf_key(self, node):
        """Return the smallest key in the subtree rooted at node."""
        if node.is_leaf:
            return node.keys[0] if node.keys else None
        return self._get_min_leaf_key(node.children[0])

    def _fill_child(self, node, index):
        """
        Ensure the child at the given index has enough keys by borrowing
        from siblings or merging with a sibling.
        """
        left_has_extra = (
            index > 0 and
            len(node.children[index - 1].keys) > self.min_keys
        )
        right_has_extra = (
            index < len(node.children) - 1 and
            len(node.children[index + 1].keys) > self.min_keys
        )

        if left_has_extra:
            self._borrow_from_prev(node, index)
        elif right_has_extra:
            self._borrow_from_next(node, index)
        else:
            # Merge — prefer merging with right sibling when possible
            if index < len(node.children) - 1:
                self._merge(node, index)
            else:
                self._merge(node, index - 1)

    def _borrow_from_prev(self, node, index):
        """Borrow a key from the left sibling to prevent underflow."""
        child   = node.children[index]
        sibling = node.children[index - 1]

        if child.is_leaf:
            # Move sibling's last key-value to the front of child
            child.keys.insert(0, sibling.keys.pop())
            child.values.insert(0, sibling.values.pop())
            # Update parent separator = new min key of child
            node.keys[index - 1] = child.keys[0]
        else:
            # Pull the parent separator down into the front of child
            child.keys.insert(0, node.keys[index - 1])
            child.children.insert(0, sibling.children.pop())
            # Push sibling's last key up to the parent
            node.keys[index - 1] = sibling.keys.pop()

    def _borrow_from_next(self, node, index):
        """Borrow a key from the right sibling to prevent underflow."""
        child   = node.children[index]
        sibling = node.children[index + 1]

        if child.is_leaf:
            # Move sibling's first key-value to the back of child
            child.keys.append(sibling.keys.pop(0))
            child.values.append(sibling.values.pop(0))
            # Update parent separator = new min key of sibling
            node.keys[index] = sibling.keys[0]
        else:
            # Pull the parent separator down to the back of child
            child.keys.append(node.keys[index])
            child.children.append(sibling.children.pop(0))
            # Push sibling's first key up to the parent
            node.keys[index] = sibling.keys.pop(0)

    def _merge(self, node, index):
        """
        Merge node.children[index] with node.children[index + 1].
        Updates parent keys after merging.
        """
        child   = node.children[index]
        sibling = node.children[index + 1]

        if child.is_leaf:
            # Absorb sibling's keys and values into child
            child.keys.extend(sibling.keys)
            child.values.extend(sibling.values)
            # Fix the linked list — skip over the now-removed sibling
            child.next = sibling.next
        else:
            # Pull the parent separator key down into child
            child.keys.append(node.keys[index])
            # Absorb sibling's keys and children
            child.keys.extend(sibling.keys)
            child.children.extend(sibling.children)

        # Remove the separator key and the sibling from parent
        node.keys.pop(index)
        node.children.pop(index + 1)

    # ============================================================
    # UPDATE
    # ============================================================

    def update(self, key, new_value):
        """Update value associated with an existing key. Return True if successful."""
        node = self.root
        while not node.is_leaf:
            i = 0
            while i < len(node.keys) and key >= node.keys[i]:
                i += 1
            node = node.children[i]

        for i, k in enumerate(node.keys):
            if k == key:
                node.values[i] = new_value
                return True
        return False

    # ============================================================
    # RANGE QUERY
    # ============================================================

    def range_query(self, start_key, end_key):
        """
        Return all key-value pairs where start_key <= key <= end_key.
        Traverses leaf nodes using the next pointers for efficient range scans.
        """
        result = []
        node   = self.root

        # Navigate down to the leaf where start_key would be
        while not node.is_leaf:
            i = 0
            while i < len(node.keys) and start_key >= node.keys[i]:
                i += 1
            node = node.children[i]

        # Walk the leaf linked list collecting matching keys
        while node is not None:
            for i, key in enumerate(node.keys):
                if key > end_key:
                    return result
                if key >= start_key:
                    result.append((key, node.values[i]))
            node = node.next

        return result

    # ============================================================
    # GET ALL
    # ============================================================

    def get_all(self):
        """Return all key-value pairs in sorted order via leaf traversal."""
        result = []
        node   = self.root

        # Find the leftmost leaf
        while not node.is_leaf:
            node = node.children[0]

        # Walk all leaves through the linked list
        while node is not None:
            for i, key in enumerate(node.keys):
                result.append((key, node.values[i]))
            node = node.next

        return result

    # ============================================================
    # VISUALISATION
    # ============================================================

    def visualize_tree(self, filename='tree', save=True):
        """
        Generate a Graphviz diagram of the B+ Tree.
        Uses HTML-like labels instead of record shape to avoid
        the 'flat edge between adjacent nodes' error on Windows.
        """
        if not GRAPHVIZ_AVAILABLE:
            print("Graphviz not installed.")
            print("Run: pip install graphviz")
            print("And install system binary from https://graphviz.org/download/")
            return None

        import os
        os.makedirs('visualizations', exist_ok=True)

        dot = Digraph(comment='B+ Tree Visualisation')

        # ── Global graph styling ──────────────────────────────────
        dot.attr(rankdir='TB')
        dot.attr(nodesep='0.5')
        dot.attr(ranksep='0.7')
        dot.attr('node',
                fontsize='12',
                fontname='Helvetica',
                shape='none')        # shape='none' required for HTML labels
        dot.attr('edge', fontsize='10')

        if self.root and self.root.keys:
            self._add_nodes(dot, self.root)
            self._add_edges(dot, self.root)
        else:
            # Empty tree placeholder
            dot.node(
                'empty',
                label='<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="4" '
                    'BGCOLOR="lightgray"><TR>'
                    '<TD><B>Empty Tree</B></TD>'
                    '</TR></TABLE>>',
                shape='none'
            )

        if save:
            output_path = os.path.join('visualizations', filename)
            dot.render(output_path, format='png', cleanup=True)
            print(f"Tree saved → visualizations/{filename}.png")

        return dot


    def _add_nodes(self, dot, node):
        """
        Recursively add every node to the Graphviz diagram.

        Uses HTML-like labels (not record shape) to avoid the
        'flat edge between adjacent record nodes' Graphviz error.

        - Internal nodes → light yellow background, orange border
        - Leaf nodes     → light blue background, steel blue border
        """
        node_id = str(id(node))

        # Build one <TD> cell per key
        cells = ''.join(
            f'<TD ALIGN="CENTER" CELLPADDING="4"> {k} </TD>'
            for k in node.keys
        )

        if node.is_leaf:
            label = (
                '<<TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" '
                'BGCOLOR="lightblue" COLOR="steelblue">'
                f'<TR>{cells}</TR>'
                '</TABLE>>'
            )
        else:
            label = (
                '<<TABLE BORDER="2" CELLBORDER="1" CELLSPACING="0" '
                'BGCOLOR="lightyellow" COLOR="darkorange">'
                f'<TR>{cells}</TR>'
                '</TABLE>>'
            )

        dot.node(node_id, label=label, shape='none')

        # Recurse into children (internal nodes only)
        if not node.is_leaf:
            for child in node.children:
                self._add_nodes(dot, child)


    def _add_edges(self, dot, node):
        """
        Recursively add two types of edges:

        1. Solid black arrows : internal node → child  (tree structure)
        2. Dashed blue arrows : leaf → next leaf        (linked list)

        HTML-label nodes support same-rank edges correctly —
        this is the key fix over the record-shape approach.
        """
        node_id = str(id(node))

        if not node.is_leaf:
            for child in node.children:
                child_id = str(id(child))
                dot.edge(
                    node_id,
                    child_id,
                    color='black',
                    penwidth='1.5',
                    arrowsize='0.8'
                )
                self._add_edges(dot, child)
        else:
            if node.next is not None:
                dot.edge(
                    node_id,
                    str(id(node.next)),
                    style='dashed',
                    color='steelblue',
                    constraint='false',
                    arrowsize='0.7',
                    penwidth='1.2'
                )

    # ============================================================
    # UTILITY
    # ============================================================

    def __len__(self):
        return len(self.get_all())

    def __repr__(self):
        all_keys = [k for k, _ in self.get_all()]
        preview  = str(all_keys[:10]) + ('...' if len(all_keys) > 10 else '')
        return f"BPlusTree(order={self.t}, size={len(all_keys)}, keys={preview})"