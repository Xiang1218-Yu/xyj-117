## 1. 架构设计

```mermaid
graph TD
    subgraph "前端应用层"
        A["React UI 组件"] --> B["状态管理 (Zustand)"]
        C["3D渲染层 (Three.js)"] --> B
        D["模拟计算引擎"] --> B
        E["数据可视化 (Recharts)"] --> B
        P["性质计算面板"] --> B
        Q["PDF导出组件"] --> B
    end
    
    subgraph "核心模块"
        F["分子结构解析器"]
        G["分子渲染器 (InstancedMesh)"]
        H["蛋白质折叠模拟"]
        I["分子对接模拟"]
        J["材料性质预测"]
        K["实时计算可视化"]
        R["分子性质计算引擎"]
        S["PDF报告生成器"]
    end
    
    subgraph "数据层"
        T["预设分子库 (JSON)"]
        U["模拟参数配置"]
        V["计算结果缓存"]
        W["性质计算结果"]
    end
    
    A --> F
    C --> G
    D --> H
    D --> I
    D --> J
    E --> K
    P --> R
    Q --> S
    F --> T
    H --> U
    I --> U
    J --> U
    K --> V
    R --> W
    S --> W
    R --> B
    S --> B
```

## 2. 技术描述

- **前端框架**: React@18 + TypeScript + Vite@5
- **3D引擎**: three@0.160 + @react-three/fiber@8 + @react-three/drei@9 + @react-three/postprocessing@2
- **状态管理**: zustand@4
- **数据可视化**: recharts@2
- **样式方案**: tailwindcss@3 + postcss + autoprefixer
- **动画库**: framer-motion@11
- **图标库**: lucide-react@0.294
- **PDF导出**: jspdf@2 + html2canvas@1
- **化学工具库**: rdkit-js (用于分子描述符计算)
- **初始化工具**: vite-init (npm create vite@latest)
- **后端**: None (纯前端应用，计算在浏览器端使用Web Workers)
- **数据库**: LocalStorage 缓存计算结果，内置Mock分子数据

## 3. 路由定义

| Route | Purpose |
|-------|---------|
| / | 主工作台页面，包含3D视口、分子库、控制面板、数据面板 |

## 4. 核心模块架构

### 4.1 3D渲染模块架构

```mermaid
graph LR
    A["MoleculeScene"] --> B["CameraController"]
    A --> C["LightingSystem"]
    A --> D["MoleculeRenderer"]
    D --> E["AtomRenderer (InstancedMesh)"]
    D --> F["BondRenderer (InstancedMesh)"]
    D --> G["SurfaceRenderer (Marching Cubes)"]
    D --> H["RibbonRenderer (TubeGeometry)"]
    A --> I["PostProcessing (Bloom, AO)"]
    A --> J["InteractionHandler"]
```

### 4.2 模拟引擎架构

```mermaid
graph TD
    A["SimulationEngine"] --> B["WebWorker Pool"]
    B --> C["FoldingSimulator"]
    B --> D["DockingSimulator"]
    B --> E["MaterialSimulator"]
    C --> F["EnergyCalculator"]
    D --> G["ForceField"]
    E --> H["BandStructure"]
    F --> I["实时数据推送"]
    G --> I
    H --> I
    I --> J["DataVisualization"]
```

### 4.3 分子性质计算引擎架构

```mermaid
graph TD
    A["PropertyCalculator"] --> B["WebWorker"]
    B --> C["量子化学描述符"]
    B --> D["ADMET性质预测"]
    B --> E["药物相似性评估"]
    C --> F["DescriptorCalculator"]
    D --> G["ADMETPredictor"]
    E --> H["DrugLikenessScorer"]
    F --> I["结果格式化"]
    G --> I
    H --> I
    I --> J["卡片式展示"]
    J --> K["状态更新"]
```

### 4.4 PDF报告生成器架构

```mermaid
graph TD
    A["PDFExporter"] --> B["数据收集"]
    B --> C["分子信息"]
    B --> D["计算结果"]
    B --> E["3D分子截图"]
    C --> F["报告模板"]
    D --> F
    E --> F
    F --> G["jsPDF 渲染"]
    G --> H["PDF文件生成"]
    H --> I["浏览器下载"]
```

## 5. 数据模型

### 5.1 数据模型定义

```mermaid
erDiagram
    MOLECULE ||--o{ ATOM : contains
    MOLECULE ||--o{ BOND : contains
    SIMULATION ||--|| MOLECULE : uses
    SIMULATION ||--o{ SIMULATION_RESULT : produces
    PROPERTY_CALCULATION ||--|| MOLECULE : uses
    PROPERTY_CALCULATION ||--o{ QUANTUM_DESCRIPTOR : produces
    PROPERTY_CALCULATION ||--o{ ADMET_PROPERTY : produces
    PROPERTY_CALCULATION ||--o{ DRUG_LIKENESS : produces
    
    MOLECULE {
        string id
        string name
        string formula
        string type
        json metadata
    }
    
    ATOM {
        string id
        string element
        float x
        float y
        float z
        float charge
    }
    
    BOND {
        string id
        string atom1_id
        string atom2_id
        int order
        float length
    }
    
    SIMULATION {
        string id
        string type
        json parameters
        string status
        datetime started_at
    }
    
    SIMULATION_RESULT {
        string id
        string simulation_id
        int step
        float energy
        json coordinates
        json metrics
    }
    
    PROPERTY_CALCULATION {
        string id
        string molecule_id
        string status
        datetime calculated_at
    }
    
    QUANTUM_DESCRIPTOR {
        string id
        string calculation_id
        string name
        float value
        string unit
    }
    
    ADMET_PROPERTY {
        string id
        string calculation_id
        string category
        string name
        string prediction
        float probability
        string status
    }
    
    DRUG_LIKENESS {
        string id
        string calculation_id
        string rule_name
        boolean passed
        string details
        float score
    }
```

### 5.2 核心TypeScript类型定义

```typescript
// 原子类型
interface Atom {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
  charge?: number;
  residue?: string;
  chain?: string;
}

// 化学键类型
interface Bond {
  id: string;
  atom1: string;
  atom2: string;
  order: 1 | 2 | 3 | 'aromatic';
  length: number;
}

// 分子结构类型
interface Molecule {
  id: string;
  name: string;
  formula: string;
  type: 'protein' | 'small_molecule' | 'material';
  atoms: Atom[];
  bonds: Bond[];
  sequence?: string;
  pdbId?: string;
}

// 显示模式类型
type DisplayMode = 'ball_stick' | 'space_filling' | 'ribbon' | 'surface';

// 模拟类型
type SimulationType = 'folding' | 'docking' | 'material';

// 模拟状态
interface SimulationState {
  isRunning: boolean;
  type: SimulationType | null;
  currentStep: number;
  totalSteps: number;
  energy: number[];
  parameters: SimulationParameters;
}

// 模拟参数
interface SimulationParameters {
  temperature: number;
  timestep: number;
  forceField: string;
  iterations: number;
}

// 计算结果
interface CalculationResult {
  bindingEnergy?: number;
  homoEnergy?: number;
  lumoEnergy?: number;
  bandGap?: number;
  conductivity?: number;
  elasticity?: number;
  electronDensity?: number[][];
  molecularOrbitals?: Orbital[];
}

// 分子轨道
interface Orbital {
  energy: number;
  occupancy: number;
  type: 'HOMO' | 'LUMO' | 'other';
  coefficients: number[];
}

// 计算类型
type PropertyCalculationType = 'quantum' | 'admet' | 'drug_likeness' | 'all';

// 量子化学描述符
interface QuantumDescriptor {
  name: string;
  value: number;
  unit?: string;
  description?: string;
  category: 'electronic' | 'structural' | 'topological' | 'physicochemical';
}

// ADMET分类
type ADMETCategory = 'absorption' | 'distribution' | 'metabolism' | 'excretion' | 'toxicity';

// ADMET性质
interface ADMETProperty {
  name: string;
  category: ADMETCategory;
  prediction: string;
  probability: number;
  status: 'good' | 'moderate' | 'poor' | 'unknown';
  description?: string;
  reference?: string;
}

// 药物相似性规则
interface DrugLikenessRule {
  ruleName: string;
  passed: boolean;
  score: number;
  details: string;
  threshold?: string;
}

// 药物相似性评估结果
interface DrugLikenessResult {
  overallScore: number;
  rules: DrugLikenessRule[];
  summary: string;
}

// 性质计算状态
interface PropertyCalculationState {
  isCalculating: boolean;
  selectedTypes: PropertyCalculationType[];
  quantumDescriptors: QuantumDescriptor[] | null;
  admetProperties: ADMETProperty[] | null;
  drugLikeness: DrugLikenessResult | null;
  error: string | null;
  calculatedAt: Date | null;
}

// PDF导出配置
interface PDFExportConfig {
  includeMoleculeInfo: boolean;
  includeQuantum: boolean;
  includeADMET: boolean;
  includeDrugLikeness: boolean;
  include3DScreenshot: boolean;
  pageSize: 'a4' | 'letter';
}
```

## 6. 性能优化策略

1. **3D渲染优化**: 使用 InstancedMesh 批量渲染原子和化学键，减少Draw Call
2. **计算优化**: 密集型计算使用 Web Workers，避免阻塞UI线程
3. **性质计算优化**: 分子描述符计算缓存，避免重复计算；增量计算支持
4. **PDF生成优化**: 流式生成PDF，大报告分块处理；Canvas截图压缩
5. **LOD策略**: 根据距离自动切换分子显示精度
6. **内存管理**: 及时释放Geometry和Material，避免内存泄漏
7. **帧率控制**: 模拟计算帧率与渲染帧率分离，确保流畅体验
8. **状态管理优化**: 使用 Zustand selectors 减少不必要的重渲染
