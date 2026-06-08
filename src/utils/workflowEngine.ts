import { 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection,
  WorkflowNodeType,
  Molecule,
  QuantumDescriptor,
  ADMETProperty,
  DrugLikenessResult,
} from '../types';
import { 
  calculateQuantumDescriptors, 
  calculateADMETProperties, 
  calculateDrugLikeness,
  calculateAllProperties,
} from './propertyCalculator';
import { moleculeLibrary } from '../data/molecules';

export interface ExecutionContext {
  results: Record<string, any>;
  updateNodeStatus: (nodeId: string, status: 'running' | 'completed' | 'error', error?: string, progress?: number) => void;
  updateNodeResult: (nodeId: string, result: any) => void;
  setCurrentNode: (nodeId: string | null) => void;
  completeExecution: () => void;
  setError: (error: string) => void;
  isPaused: () => boolean;
  shouldStop: () => boolean;
}

function topologicalSort(nodes: WorkflowNode[], connections: WorkflowConnection[]): string[] {
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};
  
  nodes.forEach(node => {
    inDegree[node.id] = 0;
    adjacency[node.id] = [];
  });
  
  connections.forEach(conn => {
    if (adjacency[conn.fromNodeId]) {
      adjacency[conn.fromNodeId].push(conn.toNodeId);
    }
    if (inDegree[conn.toNodeId] !== undefined) {
      inDegree[conn.toNodeId]++;
    }
  });
  
  const queue: string[] = [];
  const result: string[] = [];
  
  Object.keys(inDegree).forEach(nodeId => {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
    }
  });
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);
    
    adjacency[nodeId]?.forEach(neighborId => {
      inDegree[neighborId]--;
      if (inDegree[neighborId] === 0) {
        queue.push(neighborId);
      }
    });
  }
  
  if (result.length !== nodes.length) {
    throw new Error('工作流中存在循环依赖，无法执行');
  }
  
  return result;
}

function getInputData(
  node: WorkflowNode, 
  connections: WorkflowConnection[], 
  results: Record<string, any>
): Record<string, any> {
  const inputData: Record<string, any> = {};
  
  node.inputs.forEach(inputPort => {
    const connection = connections.find(
      c => c.toNodeId === node.id && c.toPortId === inputPort.id
    );
    
    if (connection) {
      const sourceResult = results[connection.fromNodeId];
      if (sourceResult !== undefined) {
        if (typeof sourceResult === 'object' && sourceResult !== null && connection.fromPortId in sourceResult) {
          inputData[inputPort.id] = sourceResult[connection.fromPortId];
        } else {
          inputData[inputPort.id] = sourceResult;
        }
      }
    }
  });
  
  return inputData;
}

function validateInputs(node: WorkflowNode, inputData: Record<string, any>): string | null {
  for (const inputPort of node.inputs) {
    if (inputPort.required && inputData[inputPort.id] === undefined) {
      return `缺少必需的输入: ${inputPort.name}`;
    }
  }
  return null;
}

async function executeMoleculeInput(node: WorkflowNode): Promise<Molecule | null> {
  const moleculeId = node.config.moleculeId;
  if (moleculeId) {
    const molecule = moleculeLibrary.find(m => m.id === moleculeId);
    if (molecule) {
      return molecule;
    }
  }
  return moleculeLibrary[0] || null;
}

async function executeMoleculeLibrary(node: WorkflowNode): Promise<Molecule[]> {
  const selectedIds = node.config.selectedMoleculeIds || [];
  if (selectedIds.length > 0) {
    return moleculeLibrary.filter(m => selectedIds.includes(m.id));
  }
  const category = node.config.category;
  if (category && category !== 'all') {
    return moleculeLibrary.filter(m => m.category === category);
  }
  return moleculeLibrary;
}

async function executeQuantumCalculation(node: WorkflowNode, inputData: Record<string, any>): Promise<QuantumDescriptor[]> {
  const molecule = inputData['input'];
  if (!molecule) {
    throw new Error('缺少分子输入');
  }
  return calculateQuantumDescriptors(molecule);
}

async function executeADMETPrediction(node: WorkflowNode, inputData: Record<string, any>): Promise<ADMETProperty[]> {
  const descriptors = inputData['input'];
  if (!descriptors) {
    throw new Error('缺少描述符输入');
  }
  return calculateADMETProperties(descriptors);
}

async function executeDrugLikeness(node: WorkflowNode, inputData: Record<string, any>): Promise<DrugLikenessResult> {
  const molecule = inputData['molecule'];
  const descriptors = inputData['descriptors'];
  if (!molecule || !descriptors) {
    throw new Error('缺少必需的输入');
  }
  return calculateDrugLikeness(molecule, descriptors);
}

async function executePropertyCalculation(node: WorkflowNode, inputData: Record<string, any>): Promise<any> {
  const molecule = inputData['input'];
  if (!molecule) {
    throw new Error('缺少分子输入');
  }
  const types = node.config.calculationTypes || ['all'];
  return calculateAllProperties(molecule, types);
}

async function executeSpectrumSimulation(node: WorkflowNode, inputData: Record<string, any>): Promise<any> {
  const molecule = inputData['input'];
  if (!molecule) {
    throw new Error('缺少分子输入');
  }
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    molecule: molecule.name,
    spectrumTypes: node.config.spectrumTypes || ['ir', 'nmr_1h'],
    simulatedAt: new Date().toISOString(),
  };
}

async function executeFoldingSimulation(node: WorkflowNode, inputData: Record<string, any>): Promise<any> {
  const molecule = inputData['input'];
  if (!molecule) {
    throw new Error('缺少蛋白质输入');
  }
  
  const iterations = node.config.iterations || 1000;
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return {
    molecule: molecule.name,
    simulationType: 'folding',
    finalEnergy: -120.5 + Math.random() * 50,
    rmsd: 2.3 + Math.random(),
    radiusOfGyration: 15.2 + Math.random() * 2,
    parameters: node.config,
  };
}

async function executeDockingSimulation(node: WorkflowNode, inputData: Record<string, any>): Promise<any> {
  const ligand = inputData['ligand'];
  const target = inputData['target'];
  if (!ligand || !target) {
    throw new Error('缺少配体或靶点输入');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    ligand: ligand.name,
    target: target.name,
    bindingAffinity: -8.5 + Math.random() * 3,
    bindingEnergy: -12.3 + Math.random() * 4,
    hydrogenBonds: Math.floor(Math.random() * 5) + 2,
    hydrophobicContacts: Math.floor(Math.random() * 10) + 5,
    parameters: node.config,
  };
}

async function executeReactionSimulation(node: WorkflowNode, inputData: Record<string, any>): Promise<any> {
  const reactants = inputData['reactants'];
  if (!reactants) {
    throw new Error('缺少反应物输入');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    reactionType: node.config.reactionType || 'SN2',
    reactants: reactants.map((r: Molecule) => r.name),
    activationEnergy: 15.5 + Math.random() * 10,
    reactionEnthalpy: -5.2 + Math.random() * 8,
    conditions: {
      solvent: node.config.solvent,
      temperature: node.config.temperature,
      catalyst: node.config.catalyst,
    },
  };
}

async function executeDataFilter(node: WorkflowNode, inputData: Record<string, any>): Promise<any> {
  const input = inputData['input'];
  if (!input) {
    throw new Error('缺少输入数据');
  }
  
  const { propertyName, operator, threshold } = node.config;
  
  if (Array.isArray(input) && propertyName) {
    return input.filter((item: any) => {
      const value = typeof item === 'object' && item !== null ? item[propertyName] : item;
      switch (operator) {
        case '>': return value > threshold;
        case '>=': return value >= threshold;
        case '<': return value < threshold;
        case '<=': return value <= threshold;
        case '==': return value === threshold;
        case '!=': return value !== threshold;
        default: return true;
      }
    });
  }
  
  return input;
}

async function executeDataMerge(node: WorkflowNode, inputData: Record<string, any>): Promise<any> {
  const input1 = inputData['input1'];
  const input2 = inputData['input2'];
  
  const strategy = node.config.mergeStrategy || 'concatenate';
  
  switch (strategy) {
    case 'concatenate':
      if (Array.isArray(input1) && Array.isArray(input2)) {
        return [...input1, ...input2];
      }
      return { ...input1, ...input2 };
    case 'sum':
      return input1 + input2;
    case 'average':
      return (input1 + input2) / 2;
    default:
      return { input1, input2 };
  }
}

async function executeResultExport(node: WorkflowNode, inputData: Record<string, any>): Promise<any> {
  const data = inputData['input'];
  if (!data) {
    throw new Error('缺少导出数据');
  }
  
  return {
    format: node.config.format || 'pdf',
    exportedAt: new Date().toISOString(),
    includeMoleculeInfo: node.config.includeMoleculeInfo,
    include3DScreenshot: node.config.include3DScreenshot,
    pageSize: node.config.pageSize || 'a4',
    data,
  };
}

async function executeVisualization(node: WorkflowNode, inputData: Record<string, any>): Promise<any> {
  const data = inputData['input'];
  if (!data) {
    throw new Error('缺少可视化数据');
  }
  
  return {
    chartType: node.config.chartType || 'bar',
    showLegend: node.config.showLegend,
    interactive: node.config.interactive,
    data,
  };
}

async function executeNode(
  node: WorkflowNode, 
  inputData: Record<string, any>,
  updateProgress: (progress: number) => void
): Promise<any> {
  updateProgress(10);
  
  let result: any;
  
  switch (node.type as WorkflowNodeType) {
    case 'molecule_input':
      result = await executeMoleculeInput(node);
      updateProgress(100);
      break;
      
    case 'molecule_library':
      result = await executeMoleculeLibrary(node);
      updateProgress(100);
      break;
      
    case 'quantum_calculation':
      updateProgress(30);
      result = await executeQuantumCalculation(node, inputData);
      updateProgress(100);
      break;
      
    case 'admet_prediction':
      updateProgress(30);
      result = await executeADMETPrediction(node, inputData);
      updateProgress(100);
      break;
      
    case 'drug_likeness':
      updateProgress(30);
      result = await executeDrugLikeness(node, inputData);
      updateProgress(100);
      break;
      
    case 'property_calculation':
      updateProgress(20);
      result = await executePropertyCalculation(node, inputData);
      updateProgress(100);
      break;
      
    case 'spectrum_simulation':
      updateProgress(20);
      result = await executeSpectrumSimulation(node, inputData);
      updateProgress(100);
      break;
      
    case 'folding_simulation':
      for (let i = 20; i <= 90; i += 10) {
        updateProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      result = await executeFoldingSimulation(node, inputData);
      updateProgress(100);
      break;
      
    case 'docking_simulation':
      for (let i = 20; i <= 90; i += 10) {
        updateProgress(i);
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      result = await executeDockingSimulation(node, inputData);
      updateProgress(100);
      break;
      
    case 'reaction_simulation':
      for (let i = 20; i <= 90; i += 10) {
        updateProgress(i);
        await new Promise(resolve => setTimeout(resolve, 60));
      }
      result = await executeReactionSimulation(node, inputData);
      updateProgress(100);
      break;
      
    case 'data_filter':
      updateProgress(50);
      result = await executeDataFilter(node, inputData);
      updateProgress(100);
      break;
      
    case 'data_merge':
      updateProgress(50);
      result = await executeDataMerge(node, inputData);
      updateProgress(100);
      break;
      
    case 'result_export':
      updateProgress(50);
      result = await executeResultExport(node, inputData);
      updateProgress(100);
      break;
      
    case 'visualization':
      updateProgress(50);
      result = await executeVisualization(node, inputData);
      updateProgress(100);
      break;
      
    default:
      throw new Error(`未知的节点类型: ${node.type}`);
  }
  
  return result;
}

export async function executeWorkflow(
  workflow: Workflow,
  context: ExecutionContext
): Promise<void> {
  try {
    if (workflow.nodes.length === 0) {
      throw new Error('工作流中没有节点');
    }
    
    const executionOrder = topologicalSort(workflow.nodes, workflow.connections);
    
    for (const nodeId of executionOrder) {
      if (context.shouldStop()) {
        return;
      }
      
      while (context.isPaused()) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (context.shouldStop()) {
          return;
        }
      }
      
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) continue;
      
      context.setCurrentNode(nodeId);
      context.updateNodeStatus(nodeId, 'running', undefined, 0);
      
      try {
        const inputData = getInputData(node, workflow.connections, context.results);
        
        const validationError = validateInputs(node, inputData);
        if (validationError) {
          throw new Error(validationError);
        }
        
        const result = await executeNode(node, inputData, (progress) => {
          context.updateNodeStatus(nodeId, 'running', undefined, progress);
        });
        
        context.updateNodeResult(nodeId, result);
        context.updateNodeStatus(nodeId, 'completed', undefined, 100);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error: any) {
        context.updateNodeStatus(nodeId, 'error', error.message, undefined);
        context.setError(`节点 "${node.name}" 执行失败: ${error.message}`);
        return;
      }
    }
    
    context.setCurrentNode(null);
    context.completeExecution();
    
  } catch (error: any) {
    context.setError(error.message || '工作流执行失败');
  }
}

export function validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (workflow.nodes.length === 0) {
    errors.push('工作流中没有节点');
    return { valid: false, errors };
  }
  
  const hasInputNode = workflow.nodes.some(n => 
    n.type === 'molecule_input' || n.type === 'molecule_library'
  );
  
  if (!hasInputNode) {
    errors.push('工作流需要至少一个输入节点（分子输入或分子库）');
  }
  
  workflow.nodes.forEach(node => {
    node.inputs.forEach(inputPort => {
      if (inputPort.required) {
        const hasConnection = workflow.connections.some(
          c => c.toNodeId === node.id && c.toPortId === inputPort.id
        );
        if (!hasConnection) {
          errors.push(`节点 "${node.name}" 缺少必需的输入: ${inputPort.name}`);
        }
      }
    });
  });
  
  try {
    topologicalSort(workflow.nodes, workflow.connections);
  } catch (e: any) {
    errors.push(e.message);
  }
  
  return { valid: errors.length === 0, errors };
}
