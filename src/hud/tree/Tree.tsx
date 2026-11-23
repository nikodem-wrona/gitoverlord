import { useState } from "react";

import styles from "./Tree.module.css";
import { TreeIcon } from "./TreeIcon";
import { type TreeNode, toggled } from "./treeTypes";

interface TreeProps {
  /** The accessible name of the tree. */
  label: string;
  nodes: readonly TreeNode[];
  selectedId?: string;
  onSelect?(id: string): void;
  /** The IDs of the nodes that are open at the start. */
  defaultExpanded?: readonly string[];
}

interface LevelProps {
  nodes: readonly TreeNode[];
  expanded: ReadonlySet<string>;
  toggle(id: string): void;
  selectedId?: string;
  onSelect?(id: string): void;
}

/** A navigation tree. A row with children opens and closes. A row without children is selected. */
export function Tree({
  label,
  nodes,
  selectedId,
  onSelect,
  defaultExpanded = [],
}: TreeProps) {
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded));
  const toggle = (id: string) => setExpanded((current) => toggled(current, id));

  return (
    <nav aria-label={label} className={styles.tree}>
      <TreeLevel
        nodes={nodes}
        expanded={expanded}
        toggle={toggle}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </nav>
  );
}

function TreeLevel({ nodes, ...rest }: LevelProps) {
  return (
    <ul className={styles.level}>
      {nodes.map((node) => (
        <TreeRow key={node.id} node={node} {...rest} />
      ))}
    </ul>
  );
}

function TreeRow({
  node,
  ...rest
}: Omit<LevelProps, "nodes"> & { node: TreeNode }) {
  const { expanded, toggle, selectedId, onSelect } = rest;
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(node.id);

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.row}
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-current={node.id === selectedId ? "true" : undefined}
        onClick={() => (hasChildren ? toggle(node.id) : onSelect?.(node.id))}
      >
        <span className={styles.toggle} aria-hidden="true">
          {hasChildren && (isOpen ? "−" : "+")}
        </span>
        <TreeIcon kind={node.icon} />
        <span className={styles.label}>{node.label}</span>
        {node.meta && <span className={styles.meta}>{node.meta}</span>}
      </button>
      {hasChildren && isOpen && <TreeLevel nodes={children} {...rest} />}
    </li>
  );
}
