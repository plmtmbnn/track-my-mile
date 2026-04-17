import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  Clock,
  MapPin,
  Settings2,
  FolderPlus,
  FilePlus,
  IterationCcw,
  GripVertical,
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
  ConditionType as CompletionConditionType,
} from '../../core/control/advanced-workout/types';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

export const BuilderScreen = () => {
  const { palette } = useTheme();
  const { savePlan } = useAdvancedWorkoutStore();
  const [plan, setPlan] = useState<WorkoutPlan>(createDefaultPlan());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([plan.root.id]));
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const updateNode = (nodes: WorkoutNode[], id: string, updater: (node: WorkoutNode) => WorkoutNode): WorkoutNode[] => {
    return nodes.map((node) => {
      if (node.id === id) {
        return updater(node);
      }
      if (node.type === NodeType.GROUP) {
        return {
          ...node,
          children: updateNode(node.children, id, updater),
        };
      }
      return node;
    });
  };

  const deleteNode = (nodes: WorkoutNode[], id: string): WorkoutNode[] => {
    return nodes
      .filter((node) => node.id !== id)
      .map((node) => {
        if (node.type === NodeType.GROUP) {
          return {
            ...node,
            children: deleteNode(node.children, id),
          };
        }
        return node;
      });
  };

  const addNodeToGroup = (nodes: WorkoutNode[], groupId: string, newNode: WorkoutNode): WorkoutNode[] => {
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
          children: addNodeToGroup(node.children, groupId, newNode),
        };
      }
      return node;
    });
  };

  const handleSave = () => {
    savePlan(plan);
    // TODO: Navigation back or feedback
    console.log('Workout Saved:', plan.name);
  };

  const renderNode = (node: WorkoutNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isEditing = editingNodeId === node.id;

    if (node.type === NodeType.STEP) {
      return (
        <View key={node.id} style={[styles.nodeContainer, { marginLeft: depth * 16 }]}>
          <GlassCard style={styles.nodeCard}>
            <View style={styles.nodeHeader}>
              <View style={styles.nodeIconTitle}>
                <FilePlus size={20} color={palette.accent.blue} />
                <TextInput
                  style={[styles.nodeTitleInput, { color: palette.text.primary }]}
                  value={node.name}
                  onChangeText={(text) => {
                    setPlan((prev) => ({
                      ...prev,
                      root: updateNode([prev.root], node.id, (n) => ({ ...n, name: text }))[0] as GroupNode,
                    }));
                  }}
                />
              </View>
              <View style={styles.nodeActions}>
                <TouchableOpacity onPress={() => setEditingNodeId(isEditing ? null : node.id)}>
                  <Settings2 size={20} color={isEditing ? palette.accent.blue : palette.text.secondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setPlan((prev) => ({
                      ...prev,
                      root: deleteNode([prev.root], node.id)[0] as GroupNode,
                    }));
                  }}
                >
                  <Trash2 size={20} color={palette.accent.red} />
                </TouchableOpacity>
              </View>
            </View>

            {isEditing && (
              <View style={styles.editor}>
                <Text style={[styles.label, { color: palette.text.secondary }]}>Speed (km/h)</Text>
                <TextInput
                  style={[styles.input, { color: palette.text.primary, borderColor: palette.border }]}
                  keyboardType="numeric"
                  value={node.speedProfile.startValue.toString()}
                  onChangeText={(val) => {
                    setPlan((prev) => ({
                      ...prev,
                      root: updateNode([prev.root], node.id, (n) => ({
                        ...n,
                        speedProfile: { ...n.speedProfile, startValue: parseFloat(val) || 0 },
                      }))[0] as GroupNode,
                    }));
                  }}
                />
                <Text style={[styles.label, { color: palette.text.secondary }]}>Incline (%)</Text>
                <TextInput
                  style={[styles.input, { color: palette.text.primary, borderColor: palette.border }]}
                  keyboardType="numeric"
                  value={node.inclineProfile.startValue.toString()}
                  onChangeText={(val) => {
                    setPlan((prev) => ({
                      ...prev,
                      root: updateNode([prev.root], node.id, (n) => ({
                        ...n,
                        inclineProfile: { ...n.inclineProfile, startValue: parseFloat(val) || 0 },
                      }))[0] as GroupNode,
                    }));
                  }}
                />
                <Text style={[styles.label, { color: palette.text.secondary }]}>Duration (seconds)</Text>
                <TextInput
                  style={[styles.input, { color: palette.text.primary, borderColor: palette.border }]}
                  keyboardType="numeric"
                  value={node.conditions[0].type === ConditionType.TIME ? node.conditions[0].value.toString() : ''}
                  onChangeText={(val) => {
                    setPlan((prev) => ({
                      ...prev,
                      root: updateNode([prev.root], node.id, (n) => ({
                        ...n,
                        conditions: [{ type: ConditionType.TIME, value: parseInt(val) || 0 }],
                      }))[0] as GroupNode,
                    }));
                  }}
                />
              </View>
            )}
          </GlassCard>
        </View>
      );
    }

    return (
      <View key={node.id} style={[styles.nodeContainer, { marginLeft: depth * 16 }]}>
        <GlassCard style={[styles.nodeCard, { borderColor: palette.accent.purple + '40' }]}>
          <View style={styles.nodeHeader}>
            <TouchableOpacity onPress={() => toggleExpand(node.id)} style={styles.nodeIconTitle}>
              {isExpanded ? (
                <ChevronDown size={24} color={palette.text.primary} />
              ) : (
                <ChevronRight size={24} color={palette.text.primary} />
              )}
              <TextInput
                style={[styles.nodeTitleInput, { color: palette.text.primary, fontWeight: 'bold' }]}
                value={node.name}
                onChangeText={(text) => {
                  setPlan((prev) => ({
                    ...prev,
                    root: updateNode([prev.root], node.id, (n) => ({ ...n, name: text }))[0] as GroupNode,
                  }));
                }}
              />
            </TouchableOpacity>
            <View style={styles.nodeActions}>
              <View style={styles.repeatBadge}>
                <IterationCcw size={14} color={palette.accent.purple} />
                <TextInput
                  style={[styles.repeatInput, { color: palette.text.primary }]}
                  keyboardType="numeric"
                  value={node.repeatCount.toString()}
                  onChangeText={(val) => {
                    setPlan((prev) => ({
                      ...prev,
                      root: updateNode([prev.root], node.id, (n) => ({
                        ...n,
                        repeatCount: parseInt(val) || 1,
                      }))[0] as GroupNode,
                    }));
                  }}
                />
              </View>
              {node.id !== plan.root.id && (
                <TouchableOpacity
                  onPress={() => {
                    setPlan((prev) => ({
                      ...prev,
                      root: deleteNode([prev.root], node.id)[0] as GroupNode,
                    }));
                  }}
                >
                  <Trash2 size={20} color={palette.accent.red} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isExpanded && (
            <View style={styles.groupChildren}>
              {node.children.map((child) => renderNode(child, 0))}
              <View style={styles.addGroupActions}>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: palette.accent.blue + '20' }]}
                  onPress={() => {
                    const newNode = createDefaultStep('New Step');
                    setPlan((prev) => ({
                      ...prev,
                      root: addNodeToGroup([prev.root], node.id, newNode)[0] as GroupNode,
                    }));
                  }}
                >
                  <FilePlus size={18} color={palette.accent.blue} />
                  <Text style={[styles.addButtonText, { color: palette.accent.blue }]}>Add Step</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: palette.accent.purple + '20' }]}
                  onPress={() => {
                    const newNode = createDefaultGroup('New Group');
                    setPlan((prev) => ({
                      ...prev,
                      root: addNodeToGroup([prev.root], node.id, newNode)[0] as GroupNode,
                    }));
                    toggleExpand(newNode.id);
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
  };

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
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: palette.accent.green }]} onPress={handleSave}>
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
  nodeTitleInput: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    padding: 4,
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
  label: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    fontSize: 14,
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
  },
  repeatInput: {
    fontSize: 14,
    marginLeft: 4,
    width: 30,
    textAlign: 'center',
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
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  addButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
});
