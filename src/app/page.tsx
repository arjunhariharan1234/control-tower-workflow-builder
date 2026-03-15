'use client';

import dynamic from 'next/dynamic';
import Toolbar from '@/components/toolbar/Toolbar';
import NodeLibrary from '@/components/panels/NodeLibrary';
import NodeConfigPanel from '@/components/panels/NodeConfigPanel';
import BottomPanel from '@/components/panels/BottomPanel';
import ImportModal from '@/components/modals/ImportModal';
import DeployModal from '@/components/modals/DeployModal';
import WorkflowsDrawer from '@/components/modals/WorkflowsDrawer';

const WorkflowCanvas = dynamic(() => import('@/components/canvas/WorkflowCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-slate-950">
      <div className="flex items-center gap-3 text-slate-400">
        <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Loading canvas...</span>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <NodeLibrary />
        <div className="flex-1 flex flex-col overflow-hidden">
          <WorkflowCanvas />
          <BottomPanel />
        </div>
        <NodeConfigPanel />
      </div>
      <ImportModal />
      <DeployModal />
      <WorkflowsDrawer />
    </div>
  );
}
