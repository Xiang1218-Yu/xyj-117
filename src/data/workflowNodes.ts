import { WorkflowNodeDefinition, WorkflowNodeType } from '../types';

export const workflowNodeDefinitions: Record<WorkflowNodeType, WorkflowNodeDefinition> = {
  molecule_input: {
    type: 'molecule_input',
    name: '分子输入',
    description: '从分子库选择或导入分子结构',
    icon: 'FlaskConical',
    category: 'input',
    inputs: [],
    outputs: [
      { id: 'output', name: '分子', type: 'output', dataType: 'molecule' }
    ],
    defaultConfig: {
      moleculeId: null,
      moleculeName: '',
    }
  },
  molecule_library: {
    type: 'molecule_library',
    name: '分子库',
    description: '批量选择多个分子进行处理',
    icon: 'Library',
    category: 'input',
    inputs: [],
    outputs: [
      { id: 'output', name: '分子列表', type: 'output', dataType: 'molecule_list' }
    ],
    defaultConfig: {
      selectedMoleculeIds: [],
      category: 'all',
    }
  },
  quantum_calculation: {
    type: 'quantum_calculation',
    name: '量子化学计算',
    description: '计算量子化学描述符',
    icon: 'Atom',
    category: 'calculation',
    inputs: [
      { id: 'input', name: '分子', type: 'input', dataType: 'molecule', required: true }
    ],
    outputs: [
      { id: 'output', name: '描述符', type: 'output', dataType: 'descriptors' }
    ],
    defaultConfig: {
      calculateHOMO: true,
      calculateLUMO: true,
      calculateDipole: true,
      calculatePolarizability: true,
    }
  },
  admet_prediction: {
    type: 'admet_prediction',
    name: 'ADMET预测',
    description: '预测吸收、分布、代谢、排泄和毒性性质',
    icon: 'Activity',
    category: 'calculation',
    inputs: [
      { id: 'input', name: '描述符', type: 'input', dataType: 'descriptors', required: true }
    ],
    outputs: [
      { id: 'output', name: 'ADMET结果', type: 'output', dataType: 'admet' }
    ],
    defaultConfig: {
      predictAbsorption: true,
      predictDistribution: true,
      predictMetabolism: true,
      predictExcretion: true,
      predictToxicity: true,
    }
  },
  drug_likeness: {
    type: 'drug_likeness',
    name: '药物相似性评估',
    description: '评估分子的类药性特征',
    icon: 'Pill',
    category: 'calculation',
    inputs: [
      { id: 'molecule', name: '分子', type: 'input', dataType: 'molecule', required: true },
      { id: 'descriptors', name: '描述符', type: 'input', dataType: 'descriptors', required: true }
    ],
    outputs: [
      { id: 'output', name: '评估结果', type: 'output', dataType: 'drug_likeness' }
    ],
    defaultConfig: {
      checkLipinski: true,
      checkVeber: true,
      checkGhose: true,
      checkEgan: true,
      checkMuegge: true,
    }
  },
  property_calculation: {
    type: 'property_calculation',
    name: '性质计算',
    description: '综合计算分子的各种性质',
    icon: 'Calculator',
    category: 'calculation',
    inputs: [
      { id: 'input', name: '分子', type: 'input', dataType: 'molecule', required: true }
    ],
    outputs: [
      { id: 'descriptors', name: '描述符', type: 'output', dataType: 'descriptors' },
      { id: 'admet', name: 'ADMET', type: 'output', dataType: 'admet' },
      { id: 'drug_likeness', name: '药物相似性', type: 'output', dataType: 'drug_likeness' }
    ],
    defaultConfig: {
      calculationTypes: ['all'],
    }
  },
  spectrum_simulation: {
    type: 'spectrum_simulation',
    name: '光谱模拟',
    description: '模拟各种光谱数据',
    icon: 'BarChart3',
    category: 'simulation',
    inputs: [
      { id: 'input', name: '分子', type: 'input', dataType: 'molecule', required: true }
    ],
    outputs: [
      { id: 'output', name: '光谱结果', type: 'output', dataType: 'spectrum' }
    ],
    defaultConfig: {
      spectrumTypes: ['ir', 'nmr_1h', 'nmr_13c', 'uv_vis'],
      solvent: 'CDCl3',
      temperature: 298,
    }
  },
  folding_simulation: {
    type: 'folding_simulation',
    name: '蛋白质折叠',
    description: '模拟蛋白质折叠过程',
    icon: 'Dna',
    category: 'simulation',
    inputs: [
      { id: 'input', name: '蛋白质', type: 'input', dataType: 'molecule', required: true }
    ],
    outputs: [
      { id: 'output', name: '模拟结果', type: 'output', dataType: 'simulation_result' }
    ],
    defaultConfig: {
      temperature: 300,
      timestep: 1,
      forceField: 'MMFF94',
      iterations: 1000,
    }
  },
  docking_simulation: {
    type: 'docking_simulation',
    name: '分子对接',
    description: '模拟配体与靶点的结合',
    icon: 'GitMerge',
    category: 'simulation',
    inputs: [
      { id: 'ligand', name: '配体', type: 'input', dataType: 'molecule', required: true },
      { id: 'target', name: '靶点', type: 'input', dataType: 'molecule', required: true }
    ],
    outputs: [
      { id: 'output', name: '对接结果', type: 'output', dataType: 'simulation_result' }
    ],
    defaultConfig: {
      algorithm: 'AutoDock Vina',
      exhaustiveness: 8,
      gridSize: { x: 20, y: 20, z: 20 },
    }
  },
  reaction_simulation: {
    type: 'reaction_simulation',
    name: '反应机理模拟',
    description: '模拟有机化学反应机理',
    icon: 'Zap',
    category: 'simulation',
    inputs: [
      { id: 'reactants', name: '反应物', type: 'input', dataType: 'molecule_list', required: true }
    ],
    outputs: [
      { id: 'output', name: '反应结果', type: 'output', dataType: 'simulation_result' }
    ],
    defaultConfig: {
      reactionType: 'SN2',
      solvent: '',
      temperature: '298K',
      catalyst: '',
    }
  },
  data_filter: {
    type: 'data_filter',
    name: '数据过滤',
    description: '根据条件过滤数据',
    icon: 'Filter',
    category: 'transformation',
    inputs: [
      { id: 'input', name: '输入数据', type: 'input', dataType: 'any', required: true }
    ],
    outputs: [
      { id: 'output', name: '过滤结果', type: 'output', dataType: 'any' }
    ],
    defaultConfig: {
      filterType: 'property_threshold',
      propertyName: '',
      operator: '>',
      threshold: 0,
    }
  },
  data_merge: {
    type: 'data_merge',
    name: '数据合并',
    description: '合并多个数据源',
    icon: 'Combine',
    category: 'transformation',
    inputs: [
      { id: 'input1', name: '数据1', type: 'input', dataType: 'any', required: true },
      { id: 'input2', name: '数据2', type: 'input', dataType: 'any', required: true }
    ],
    outputs: [
      { id: 'output', name: '合并结果', type: 'output', dataType: 'any' }
    ],
    defaultConfig: {
      mergeStrategy: 'concatenate',
    }
  },
  result_export: {
    type: 'result_export',
    name: '结果导出',
    description: '导出分析结果',
    icon: 'Download',
    category: 'output',
    inputs: [
      { id: 'input', name: '数据', type: 'input', dataType: 'any', required: true }
    ],
    outputs: [],
    defaultConfig: {
      format: 'pdf',
      includeMoleculeInfo: true,
      include3DScreenshot: true,
      pageSize: 'a4',
    }
  },
  visualization: {
    type: 'visualization',
    name: '可视化展示',
    description: '可视化展示分析结果',
    icon: 'Eye',
    category: 'visualization',
    inputs: [
      { id: 'input', name: '数据', type: 'input', dataType: 'any', required: true }
    ],
    outputs: [],
    defaultConfig: {
      chartType: 'bar',
      showLegend: true,
      interactive: true,
    }
  },
};

export const getNodeDefinition = (type: WorkflowNodeType): WorkflowNodeDefinition => {
  return workflowNodeDefinitions[type];
};

export const getNodeDefinitionsByCategory = (): Record<string, WorkflowNodeDefinition[]> => {
  const categories: Record<string, WorkflowNodeDefinition[]> = {
    input: [],
    calculation: [],
    simulation: [],
    transformation: [],
    output: [],
    visualization: [],
  };
  
  Object.values(workflowNodeDefinitions).forEach(def => {
    categories[def.category].push(def);
  });
  
  return categories;
};

export const categoryNames: Record<string, string> = {
  input: '输入节点',
  calculation: '计算节点',
  simulation: '模拟节点',
  transformation: '数据转换',
  output: '输出节点',
  visualization: '可视化',
};

export const categoryColors: Record<string, string> = {
  input: 'from-blue-500 to-blue-600',
  calculation: 'from-purple-500 to-purple-600',
  simulation: 'from-orange-500 to-orange-600',
  transformation: 'from-green-500 to-green-600',
  output: 'from-red-500 to-red-600',
  visualization: 'from-cyan-500 to-cyan-600',
};
