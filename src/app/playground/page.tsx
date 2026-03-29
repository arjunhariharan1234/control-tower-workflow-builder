'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Toolbar from '@/components/toolbar/Toolbar';
import NodeLibrary from '@/components/panels/NodeLibrary';
import NodeConfigPanel from '@/components/panels/NodeConfigPanel';
import BottomPanel from '@/components/panels/BottomPanel';
import ImportModal from '@/components/modals/ImportModal';
import DeployModal from '@/components/modals/DeployModal';
import WorkflowsDrawer from '@/components/modals/WorkflowsDrawer';
import ExecutionHistoryDrawer from '@/components/modals/ExecutionHistoryDrawer';
import VersionHistoryDrawer from '@/components/modals/VersionHistoryDrawer';
import CommunicationDirectoryDrawer from '@/components/modals/CommunicationDirectoryDrawer';
import { useWorkflowStore } from '@/store/workflow-store';
import { getTemplateById } from '@/lib/templates';
import { getSavedWorkflowById } from '@/lib/saved-workflows';

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

function PlaygroundInner() {
  const searchParams = useSearchParams();
  const initialized = useRef(false);
  const { loadDSL, setShowWorkflowsDrawer } = useWorkflowStore();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const templateId = searchParams.get('template');
    const mode = searchParams.get('mode');
    const loadId = searchParams.get('load');

    if (loadId) {
      const saved = getSavedWorkflowById(loadId);
      if (saved) loadDSL(saved.dsl);
    } else if (templateId) {
      const template = getTemplateById(templateId);
      if (template) loadDSL(template.dsl);
    } else if (mode === 'templates') {
      setShowWorkflowsDrawer(true, 'templates');
    }
  }, [searchParams, loadDSL, setShowWorkflowsDrawer]);

  return null;
}

export default function PlaygroundPage() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Suspense>
        <PlaygroundInner />
      </Suspense>
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
      <ExecutionHistoryDrawer />
      <VersionHistoryDrawer />
      <CommunicationDirectoryDrawer />
    </div>
  );
}
