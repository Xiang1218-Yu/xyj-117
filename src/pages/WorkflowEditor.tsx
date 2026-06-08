import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import AppNavbar from '../components/common/AppNavbar';
import NodePanel from '../components/WorkflowEditor/NodePanel';
import WorkflowCanvas from '../components/WorkflowEditor/WorkflowCanvas';
import WorkflowControlPanel from '../components/WorkflowEditor/WorkflowControlPanel';
import WorkflowResultsPanel from '../components/WorkflowEditor/WorkflowResultsPanel';

export default function WorkflowEditor() {
  const currentWorkflow = useStore(state => state.currentWorkflow);
  const createNewWorkflow = useStore(state => state.createNewWorkflow);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedWorkflows');
      if (saved) {
        const workflows = JSON.parse(saved);
        useStore.setState({ savedWorkflows: workflows });
      }
    } catch (e) {
      console.error('Failed to load saved workflows:', e);
    }
  }, []);

  useEffect(() => {
    if (!currentWorkflow) {
      createNewWorkflow('默认工作流', '化学信息学自动化分析流程');
    }
  }, [currentWorkflow, createNewWorkflow]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <AppNavbar className="h-14 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50" />
      <WorkflowControlPanel />
      
      <div className="flex-1 flex overflow-hidden">
        <NodePanel />
        <WorkflowCanvas />
        <WorkflowResultsPanel />
      </div>
    </div>
  );
}
