import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Insets,
} from 'react-native';
import {
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  Settings2,
  FolderPlus,
  FilePlus,
  IterationCcw,
} from 'lucide-react-native';
import { GlassCard } from '../Dashboard/GlassCard';
import { useTheme } from '../../theme/ThemeContext';
import { useAdvancedWorkoutStore } from '../../store/useAdvancedWorkoutStore';
import {
  NodeType,
  WorkoutPlan,
  WorkoutNode,
  GroupNode,
  AtomicStep,
  ConditionType,
  ProfileMode,
} from '../../core/control/advanced-workout/types';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HIT_SLOP: Insets = { top: 10, bottom: 10, left: 10, right: 10 };

const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultStep = (name: string): AtomicStep => ({
  id: generateId(),
  type: NodeType.STEP,
  name,
  conditions: [{ type: ConditionType.TIME, value: 300 }], // 5 mins
  speedProfile: { mode: ProfileMode.STATIC, startValue: 8.0 },
  inclineProfile: { mode: ProfileMode.STATIC, startValue: 1.0 },
});

const createDefaultGroup = (name: string): GroupNode => ({
  id: generateId(),
  type: NodeType.GROUP,
  name,
  repeatCount: 1,
  children: [],
});

const createDefaultPlan = (): WorkoutPlan => ({
  id: generateId(),
  name: 'New Workout',
  root: {
    id: generateId(),
    type: NodeType.GROUP,
    name: 'Main Sequence',
    repeatCount: 1,
    children: [createDefaultStep('Warm Up')],
  },
});

interface NumericInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  keyboardType?: 'numeric' | 'decimal-pad';
  placeholder?: string;
}

const NumericInput = ({ label, value, onChange, keyboardType = 'numeric' }: NumericInputProps) => {
  const { palette } = useTheme();
  const [localValue, setLocalValue] = useState(value.toString());

  // Update local value when external value changes (e.g. from store reset)
  useEffect(() => {
    if (parseFloat(localValue) !== value) {
      setLocalValue(value.toString());
    }
  }, [value]);

  const handleBlur = () => {
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed)) {
      onChange(parsed);
      setLocalValue(parsed.toString());
    } else {
      setLocalValue(value.toString());
    }
  };

  return (
    <View style={styles.inputWrapper}>
      <Text style={[styles.label, { color: palette.text.secondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { color: palette.text.primary, borderColor: palette.border }]}
        keyboardType={keyboardType}
        value={localValue}
        onChangeText={setLocalValue}
        onBlur={handleBlur}
        placeholder="0"
        placeholderTextColor={palette.text.muted}
      />
    </View>
  );
};

interface StepNodeProps {
  node: AtomicStep;
  depth: number;
  isEditing: boolean;
  onToggleEdit: (id: string) => void;
  onUpdate: (id: string, updater: (node: WorkoutNode) => WorkoutNode) => void;
  onDelete: (id: string) => void;
}

const StepNode = memo(({ node, depth, isEditing, onToggleEdit, onUpdate, onDelete }: StepNodeProps) => {
  const { palette } = useTheme();

  return (
    <View style={[styles.nodeContainer, { marginLeft: depth * 16 }]}>
      <GlassCard style={styles.nodeCard}>
        <View style={styles.nodeHeader}>
          <View style={styles.nodeIconTitle}>
            <FilePlus size={20} color={palette.accent.blue} />
            <TextInput
              style={[styles.nodeTitleInput, { color: palette.text.primary }]}
              value={node.name}
              onChangeText={(text) => {
                onUpdate(node.id, (n) => ({ ...n, name: text }));
              }}
              placeholder="Step Name"
              placeholderTextColor={palette.text.muted}
            />
          </View>
          <View style={styles.nodeActions}>
            <TouchableOpacity 
              onPress={() => onToggleEdit(node.id)}
              hitSlop={HIT_SLOP}
            >
              <Settings2 size={20} color={isEditing ? palette.accent.blue : palette.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(node.id)}
              hitSlop={HIT_SLOP}
            >
              <Trash2 size={20} color={palette.accent.red} />
            </TouchableOpacity>
          </View>
        </View>

        {isEditing && (
          <View style={styles.editor}>
            <NumericInput
              label="Speed (km/h)"
              value={node.speedProfile.startValue}
              onChange={(val) => {
                onUpdate(node.id, (n) => ({
                  ...n,
                  speedProfile: { ...(n as AtomicStep).speedProfile, startValue: val },
                }));
              }}
              keyboardType="decimal-pad"
            />
            <NumericInput
              label="Incline (%)"
              value={node.inclineProfile.startValue}
              onChange={(val) => {
                onUpdate(node.id, (n) => ({
                  ...n,
                  inclineProfile: { ...(n as AtomicStep).inclineProfile, startValue: val },
                }));
              }}
              keyboardType="decimal-pad"
            />
            <NumericInput
              label="Duration (seconds)"
              value={node.conditions[0].type === ConditionType.TIME ? node.conditions[0].value : 0}
              onChange={(val) => {
                onUpdate(node.id, (n) => ({
                  ...n,
                  conditions: [{ type: ConditionType.TIME, value: Math.round(val) }],
                }));
              }}
            />
          </View>
        )}
      </GlassCard>
    </View>
  );
});

interface GroupNodeProps {
  node: GroupNode;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onUpdate: (id: string, updater: (node: WorkoutNode) => WorkoutNode) => void;
  onDelete: (id: string) => void;
  onAddChild: (groupId: string, newNode: WorkoutNode) => void;
  isRoot: boolean;
  renderNode: (node: WorkoutNode, depth: number) => React.ReactNode;
}

const GroupNode = memo(({ 
  node, 
  depth, 
  isExpanded, 
  onToggleExpand, 
  onUpdate, 
  onDelete, 
  onAddChild,
  isRoot,
  renderNode 
}: GroupNodeProps) => {
  const { palette } = useTheme();

  return (
    <View style={[styles.nodeContainer, { marginLeft: depth * 16 }]}>
      <GlassCard style={[styles.nodeCard, { borderColor: palette.accent.purple + '40' }]}>
        <View style={styles.nodeHeader}>
          <View style={styles.nodeIconTitle}>
            <TouchableOpacity 
              onPress={() => onToggleExpand(node.id)}
              hitSlop={HIT_SLOP}
              style={styles.expandButton}
            >
              {isExpanded ? (
                <ChevronDown size={24} color={palette.text.primary} />
              ) : (
                <ChevronRight size={24} color={palette.text.primary} />
              )}
            </TouchableOpacity>
            <TextInput
              style={[styles.nodeTitleInput, { color: palette.text.primary, fontWeight: 'bold' }]}
              value={node.name}
              onChangeText={(text) => {
                onUpdate(node.id, (n) => ({ ...n, name: text }));
              }}
              placeholder="Group Name"
              placeholderTextColor={palette.text.muted}
            />
          </View>
          <View style={styles.nodeActions}>
            <View style={styles.repeatBadge}>
              <IterationCcw size={14} color={palette.accent.purple} />
              <NumericInputSmall
                value={node.repeatCount}
                onChange={(val) => {
                  onUpdate(node.id, (n) => ({
                    ...n,
                    repeatCount: Math.max(1, Math.round(val)),
                  }));
                }}
              />
            </View>
            {!isRoot && (
              <TouchableOpacity
                onPress={() => onDelete(node.id)}
                hitSlop={HIT_SLOP}
              >
                <Trash2 size={20} color={palette.accent.red} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isExpanded && (
          <View style={styles.groupChildren}>
            {node.children.map((child) => renderNode(child, depth + 1))}
            <View style={styles.addGroupActions}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: palette.accent.blue + '20' }]}
                onPress={() => onAddChild(node.id, createDefaultStep('New Step'))}
              >
                <FilePlus size={18} color={palette.accent.blue} />
                <Text style={[styles.addButtonText, { color: palette.accent.blue }]}>Add Step</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: palette.accent.purple + '20' }]}
                onPress={() => {
                  const newNode = createDefaultGroup('New Group');
                  onAddChild(node.id, newNode);
                }}
              >
                <FolderPlus size={18} color={palette.accent.purple} />
                <Text style={[styles.addButtonText, { color: palette.accent.purple }]}>Add Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </GlassCard>
    </View>
  );
});

const NumericInputSmall = ({ value, onChange }: { value: number; onChange: (val: number) => void }) => {
  const { palette } = useTheme();
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    if (parseInt(localValue) !== value) {
      setLocalValue(value.toString());
    }
  }, [value]);

  return (
    <TextInput
      style={[styles.repeatInput, { color: palette.text.primary }]}
      keyboardType="numeric"
      value={localValue}
      onChangeText={setLocalValue}
      onBlur={() => {
        const parsed = parseInt(localValue);
        if (!isNaN(parsed)) {
          onChange(parsed);
          setLocalValue(parsed.toString());
        } else {
          setLocalValue(value.toString());
        }
      }}
    />
  );
};

export const BuilderScreen = () => {
  const { palette } = useTheme();
  const { savePlan } = useAdvancedWorkoutStore();
  const [plan, setPlan] = useState<WorkoutPlan>(createDefaultPlan());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([plan.root.id]));
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedNodes((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  }, []);

  const toggleEdit = useCallback((id: string) => {
    setEditingNodeId((prev) => (prev === id ? null : id));
  }, []);

  const updateNodeInTree = useCallback((nodes: WorkoutNode[], id: string, updater: (node: WorkoutNode) => WorkoutNode): WorkoutNode[] => {
    return nodes.map((node) => {
      if (node.id === id) {
        return updater(node);
      }
      if (node.type === NodeType.GROUP) {
        return {
          ...node,
          children: updateNodeInTree(node.children, id, updater),
        };
      }
      return node;
    });
  }, []);

  const handleUpdateNode = useCallback((id: string, updater: (node: WorkoutNode) => WorkoutNode) => {
    setPlan((prev) => ({
      ...prev,
      root: updateNodeInTree([prev.root], id, updater)[0] as GroupNode,
    }));
  }, [updateNodeInTree]);

  const deleteNodeInTree = useCallback((nodes: WorkoutNode[], id: string): WorkoutNode[] => {
    return nodes
      .filter((node) => node.id !== id)
      .map((node) => {
        if (node.type === NodeType.GROUP) {
          return {
            ...node,
            children: deleteNodeInTree(node.children, id),
          };
        }
        return node;
      });
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setPlan((prev) => ({
      ...prev,
      root: deleteNodeInTree([prev.root], id)[0] as GroupNode,
    }));
  }, [deleteNodeInTree]);

  const addChildInTree = useCallback((nodes: WorkoutNode[], groupId: string, newNode: WorkoutNode): WorkoutNode[] => {
    return nodes.map((node) => {
      if (node.id === groupId && node.type === NodeType.GROUP) {
        return {
          ...node,
          children: [...node.children, newNode],
        };
      }
      if (node.type === NodeType.GROUP) {
        return {
          ...node,
          children: addChildInTree(node.children, groupId, newNode),
        };
      }
      return node;
    });
  }, []);

  const handleAddChild = useCallback((groupId: string, newNode: WorkoutNode) => {
    setPlan((prev) => ({
      ...prev,
      root: addChildInTree([prev.root], groupId, newNode)[0] as GroupNode,
    }));
    if (newNode.type === NodeType.GROUP) {
      toggleExpand(newNode.id);
    }
  }, [addChildInTree, toggleExpand]);

  const handleSave = () => {
    savePlan(plan);
    console.log('Workout Saved:', plan.name);
  };

  const renderNode = useCallback((node: WorkoutNode, depth: number = 0) => {
    if (node.type === NodeType.STEP) {
      return (
        <StepNode
          key={node.id}
          node={node}
          depth={depth}
          isEditing={editingNodeId === node.id}
          onToggleEdit={toggleEdit}
          onUpdate={handleUpdateNode}
          onDelete={handleDeleteNode}
        />
      );
    }

    return (
      <GroupNode
        key={node.id}
        node={node as GroupNode}
        depth={depth}
        isExpanded={expandedNodes.has(node.id)}
        onToggleExpand={toggleExpand}
        onUpdate={handleUpdateNode}
        onDelete={handleDeleteNode}
        onAddChild={handleAddChild}
        isRoot={node.id === plan.root.id}
        renderNode={renderNode}
      />
    );
  }, [expandedNodes, editingNodeId, toggleEdit, toggleExpand, handleUpdateNode, handleDeleteNode, handleAddChild, plan.root.id]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <TextInput
          style={[styles.planTitleInput, { color: palette.text.primary }]}
          value={plan.name}
          onChangeText={(text) => setPlan((prev) => ({ ...prev, name: text }))}
          placeholder="Workout Name"
          placeholderTextColor={palette.text.muted}
        />
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: palette.accent.green }]} 
          onPress={handleSave}
          hitSlop={HIT_SLOP}
        >
          <Save size={20} color={palette.background} />
          <Text style={[styles.saveButtonText, { color: palette.background }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {renderNode(plan.root)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  planTitleInput: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    marginRight: 16,
    paddingVertical: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveButtonText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  nodeContainer: {
    marginBottom: 12,
  },
  nodeCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandButton: {
    marginRight: 4,
  },
  nodeTitleInput: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
    padding: 8,
    minHeight: 44,
  },
  nodeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editor: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 44,
  },
  groupChildren: {
    marginTop: 12,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minHeight: 36,
  },
  repeatInput: {
    fontSize: 14,
    marginLeft: 4,
    width: 40,
    textAlign: 'center',
    padding: 4,
  },
  addGroupActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingLeft: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  addButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
});
