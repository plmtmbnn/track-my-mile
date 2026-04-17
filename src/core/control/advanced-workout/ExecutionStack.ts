import { WorkoutNode, AtomicStep, NodeType, GroupNode } from './types';

export interface ExecutionPointer {
  readonly step: AtomicStep;
  readonly iteration: number;
  readonly totalIterations: number;
  readonly parentGroupNames: readonly string[];
}

/**
 * Utility to flatten a recursive workout tree into a linear execution plan.
 */
export class WorkoutFlattener {
  /**
   * Flattens a workout node (and its children) into a linear array of execution pointers.
   */
  static flatten(node: WorkoutNode): ExecutionPointer[] {
    const acc: ExecutionPointer[] = [];
    this.traverse(node, [], 1, 1, acc);
    return acc;
  }

  private static traverse(
    node: WorkoutNode,
    path: readonly string[],
    iter: number,
    total: number,
    acc: ExecutionPointer[]
  ): void {
    if (node.type === NodeType.STEP) {
      acc.push({
        step: node as AtomicStep,
        iteration: iter,
        totalIterations: total,
        parentGroupNames: path,
      });
      return;
    }

    if (node.type === NodeType.GROUP) {
      const group = node as GroupNode;
      const nextPath = group.name ? [...path, group.name] : path;

      for (let i = 1; i <= group.repeatCount; i++) {
        for (const child of group.children) {
          this.traverse(child, nextPath, i, group.repeatCount, acc);
        }
      }
    }
  }
}
