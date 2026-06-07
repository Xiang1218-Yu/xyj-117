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
        X["反应机理控制面板"] --> B
        Y["反应时间轴组件"] --> B
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
        U1["有机反应机理模拟引擎"]
        U2["电子转移动画系统"]
        U3["键变化渲染器"]
        U4["过渡态可视化"]
        U5["反应能量计算"]
    end
    
    subgraph "数据层"
        T["预设分子库 (JSON)"]
        U["模拟参数配置"]
        V["计算结果缓存"]
        W["性质计算结果"]
        U6["有机反应库 (JSON)"]
        U7["反应机理关键帧数据"]
    end
    
    A --> F
    C --> G
    D --> H
    D --> I
    D --> J
    D --> U1
    E --> K
    P --> R
    Q --> S
    X --> U1
    Y --> U1
    U1 --> U2
    U1 --> U3
    U1 --> U4
    U1 --> U5
    F --> T
    H --> U
    I --> U
    J --> U
    U1 --> U6
    U1 --> U7
    K --> V
    R --> W
    S --> W
    R --> B
    S --> B
    U1 --> B
    U5 --> K
```

## 2. 技术描述

- **前端框架**: React@18 + TypeScript + Vite@5
- **3D引擎**: three@0.160 + @react-three/fiber@8 + @react-three/drei@9 + @react-three/postprocessing@2
- **3D动画**: three/addons (TubeGeometry用于箭头动画、CatmullRomCurve3用于轨迹)
- **状态管理**: zustand@4
- **数据可视化**: recharts@2
- **样式方案**: tailwindcss@3 + postcss + autoprefixer
- **动画库**: framer-motion@11
- **图标库**: lucide-react@0.294
- **PDF导出**: jspdf@2 + html2canvas@1
- **化学工具库**: rdkit-js (用于分子描述符计算)
- **动画曲线**: 自定义贝塞尔曲线插值、缓动函数(easeInOutQuad, easeInOutCubic)
- **初始化工具**: vite-init (npm create vite@latest)
- **后端**: None (纯前端应用，计算在浏览器端使用Web Workers)
- **数据库**: LocalStorage 缓存计算结果，内置Mock分子数据和反应机理数据

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

### 4.5 有机反应机理模拟引擎架构

```mermaid
graph TD
    A["ReactionMechanismEngine"] --> B["反应选择器"]
    A --> C["时间轴控制器"]
    A --> D["关键帧插值器"]
    A --> E["动画渲染器"]
    
    B --> B1["反应库加载器"]
    B --> B2["反应数据解析器"]
    B2 --> B3["反应物分子"]
    B2 --> B4["产物分子"]
    B2 --> B5["过渡态结构"]
    B2 --> B6["电子转移路径"]
    B2 --> B7["键变化序列"]
    
    C --> C1["播放/暂停控制"]
    C --> C2["步进/后退控制"]
    C --> C3["速度调节(0.25x-4x)"]
    C --> C4["关键帧跳转"]
    
    D --> D1["原子位置插值(Bezier)"]
    D --> D2["键级变化插值"]
    D --> D3["电子流动时间映射"]
    D --> D4["能量曲线插值"]
    
    E --> E1["电子转移箭头"]
    E --> E2["键变化渲染器"]
    E --> E3["过渡态高亮"]
    E --> E4["反应能量曲线"]
    
    E1 --> E11["发光流动粒子"]
    E1 --> E12["曲线箭头动画"]
    E1 --> E13["电子轨迹线"]
    
    E2 --> E21["键断裂动画(虚线闪烁)"]
    E2 --> E22["键形成动画(渐变实线)"]
    E2 --> E23["键级动态标注"]
    
    E3 --> E31["半透明分子轮廓"]
    E3 --> E32["部分键虚线显示"]
    E3 --> E33["能量峰值标记"]
```

### 4.6 电子转移动画系统架构

```mermaid
graph TD
    A["ElectronTransferAnimator"] --> B["路径定义器"]
    A --> C["粒子系统"]
    A --> D["箭头渲染器"]
    A --> E["发光效果"]
    
    B --> B1["起始原子定位"]
    B --> B1a["孤对电子/π键源"]
    B --> B2["目标原子定位"]
    B --> B2a["亲电中心/空轨道"]
    B --> B3["CatmullRom曲线生成"]
    B --> B4["控制点优化(避免空间位阻)"]
    
    C --> C1["粒子池管理"]
    C --> C2["粒子生命周期"]
    C --> C3["速度控制映射"]
    C --> C4["颜色渐变(蓝→黄→红)"]
    C --> C5["拖尾效果(Trail)"]
    
    D --> D1["TubeGeometry箭头体"]
    D --> D2["箭头头部(ConeGeometry)"]
    D --> D3["流动UV动画"]
    D --> D4["透明度脉冲(Pulse)"]
    
    E --> E1["Bloom后处理"]
    E --> E2["发光强度随时间变化"]
    E --> E3["颜色温度映射(能量)"]
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

// 有机反应类型
type ReactionType = 'SN2' | 'E2' | 'SN1' | 'E1' | 'nucleophilic_addition' | 'elimination' | 'electrophilic_substitution' | 'diels_alder' | 'grignard' | 'hydrolysis' | 'esterification';

// 电子转移类型
type ElectronTransferType = 'lone_pair_to_bond' | 'bond_to_lone_pair' | 'bond_to_bond' | 'lone_pair_to_lone_pair';

// 键变化类型
type BondChangeType = 'break' | 'form' | 'change_order';

// 电子转移路径
interface ElectronTransfer {
  id: string;
  type: ElectronTransferType;
  fromAtom: string;
  toAtom: string;
  fromBond?: string;
  toBond?: string;
  startTime: number;
  endTime: number;
  color: string;
  curvePoints: { x: number; y: number; z: number }[];
  electronCount: number;
}

// 键变化
interface BondChange {
  id: string;
  type: BondChangeType;
  atom1: string;
  atom2: string;
  startTime: number;
  endTime: number;
  initialOrder: number;
  finalOrder: number;
  isTransitionState?: boolean;
}

// 反应关键帧
interface ReactionKeyframe {
  time: number;
  label: string;
  type: 'reactant' | 'transition_state' | 'intermediate' | 'product';
  atoms: { id: string; x: number; y: number; z: number }[];
  bonds: { atom1: string; atom2: string; order: number }[];
  energy: number;
  isHighlighted?: boolean;
}

// 反应能量数据点
interface EnergyPoint {
  time: number;
  energy: number;
  label?: string;
  type: 'reactant' | 'transition_state' | 'intermediate' | 'product';
}

// 有机反应机理数据
interface ReactionMechanism {
  id: string;
  name: string;
  type: ReactionType;
  description: string;
  chemicalEquation: string;
  reactants: Molecule[];
  products: Molecule[];
  keyframes: ReactionKeyframe[];
  electronTransfers: ElectronTransfer[];
  bondChanges: BondChange[];
  energyProfile: EnergyPoint[];
  activationEnergy: number;
  reactionEnthalpy: number;
  conditions?: {
    solvent?: string;
    temperature?: string;
    catalyst?: string;
  };
  notes?: string;
}

// 反应机理模拟状态
interface ReactionSimulationState {
  isRunning: boolean;
  currentReaction: ReactionMechanism | null;
  currentTime: number;
  totalDuration: number;
  playbackSpeed: number;
  isPaused: boolean;
  currentKeyframe: number;
  showElectronFlow: boolean;
  showTransitionStates: boolean;
  showEnergyCurve: boolean;
  showBondChanges: boolean;
}

// 动画粒子
interface AnimationParticle {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  color: string;
  size: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number; z: number }[];
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
9. **反应动画优化**: 预计算所有关键帧插值数据，避免运行时重复计算
10. **粒子系统优化**: 使用对象池管理电子流动粒子，限制最大粒子数量（≤50）
11. **曲线插值优化**: 使用CatmullRomCurve3预计算路径点，运行时直接采样
12. **后处理优化**: 电子转移效果单独渲染层，只在需要时启用Bloom效果
13. **关键帧缓存**: 反应机理数据和插值结果缓存到LocalStorage，避免重复解析
