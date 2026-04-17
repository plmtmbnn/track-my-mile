import { WorkoutNode, AtomicStep, NodeType, GroupNode } from './types';

export interface ExecutionPointer {
  step: AtomicStep;
  iteration: number;
  totalIterations: number;
  parentGroupNames: string[];
}

export class ExecutionStack {
  static flatten(node: WorkoutNode): ExecutionPointer[] {
    return this.traverse(node, [], 1, 1);
  }

  private static traverse(
    node: WorkoutNode,
    parentGroupNames: string[],
    iteration: number,
    totalIterations: number
  ): ExecutionPointer[] {
    if (node.type === NodeType.STEP) {
      return [
        {
          step: node as AtomicStep,
          iteration,
          totalIterations,
          parentGroupNames: [...parentGroupNames],
        },
      ];
    }

    if (node.type === NodeType.GROUP) {
      const queue: ExecutionPointer[] = [];
      const group = node as GroupNode;
      const nextPath = group.name ? [...parentGroupNames, group.name] : parentGroupNames;

      for (let i = 1; i <= group.repeatCount; i++) {
        for (const child of group.children) {
          queue.push(...this.traverse(child, nextPath, i, group.repeatCount));
        }
      }

      return queue;
    }

    return [];
  }
}
