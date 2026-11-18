import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Layers,
  Info,
  GitCommit,
  Route,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { useComparison } from '../context/ComparisonContext.jsx';
import { Badge } from '../components/Badge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { SubNavTabs } from '../components/SubNavTabs.jsx';

export function DependencyGraphPage() {
  const { comparisonData, isLoading } = useComparison();
  const cyContainerRef = useRef(null);
  const cyInstanceRef = useRef(null);

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedSheetFilter, setSelectedSheetFilter] = useState('ALL');
  const [drawerOpen, setDrawerOpen] = useState(true);

  const graphData = comparisonData?.graphData;
  const impactAnalysis = comparisonData?.impactAnalysis || {};
  const cycles = graphData?.cycles || [];
  const sccList = impactAnalysis.cyclicComponents || [];

  // Initialize and update Cytoscape canvas
  useEffect(() => {
    if (!cyContainerRef.current || !graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return;
    }

    // Filter elements based on selected sheet if applicable
    let elementsNodes = graphData.nodes;
    let elementsEdges = graphData.edges;

    if (selectedSheetFilter !== 'ALL') {
      const allowedNodeIds = new Set(
        elementsNodes
          .filter((n) => n.data.sheet === selectedSheetFilter)
          .map((n) => n.data.id)
      );
      elementsNodes = elementsNodes.filter((n) => allowedNodeIds.has(n.data.id));
      elementsEdges = elementsEdges.filter(
        (e) => allowedNodeIds.has(e.data.source) && allowedNodeIds.has(e.data.target)
      );
    }

    if (cyInstanceRef.current) {
      cyInstanceRef.current.destroy();
    }

    const cy = cytoscape({
      container: cyContainerRef.current,
      elements: [...elementsNodes, ...elementsEdges],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'font-family': 'Inter, -apple-system, sans-serif',
            'font-size': '11px',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'color': '#090d16',
            'background-color': '#ffffff',
            'border-width': 1.5,
            'border-color': '#cbd5e1',
            'shape': 'round-rectangle',
            'width': 'label',
            'height': 'label',
            'padding': '7px'
          }
        },
        {
          selector: 'node[?isFormula]',
          style: {
            'background-color': '#eff6ff',
            'border-color': '#1e56f0',
            'border-width': 2,
            'color': '#090d16',
            'font-weight': 600
          }
        },
        {
          selector: 'node[?isChanged]',
          style: {
            'border-color': '#ea580c',
            'border-width': 2.5,
            'background-color': '#fff7ed'
          }
        },
        {
          selector: 'node[?inCycle]',
          style: {
            'border-color': '#dc2626',
            'border-width': 3,
            'background-color': '#fef2f2',
            'color': '#991b1b',
            'font-weight': 700
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.8,
            'line-color': '#cbd5e1',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.05
          }
        },
        {
          selector: 'edge[?inCycle]',
          style: {
            'line-color': '#dc2626',
            'target-arrow-color': '#dc2626',
            'width': 2.5,
            'line-style': 'dashed'
          }
        },
        {
          selector: '.highlighted',
          style: {
            'background-color': '#1e56f0',
            'color': '#ffffff',
            'border-color': '#0e3096',
            'border-width': 3,
            'line-color': '#1e56f0',
            'target-arrow-color': '#1e56f0',
            'width': 3
          }
        },
        {
          selector: '.downstream-affected',
          style: {
            'background-color': '#fed7aa',
            'border-color': '#ea580c',
            'border-width': 2
          }
        },
        {
          selector: '.path-highlight',
          style: {
            'background-color': '#10b981',
            'color': '#ffffff',
            'line-color': '#10b981',
            'target-arrow-color': '#10b981',
            'width': 3.5
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 40,
        spacingFactor: 1.25,
        animate: false
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeData = node.data();
      setSelectedNode(nodeData);
      setDrawerOpen(true);

      cy.elements().removeClass('highlighted downstream-affected path-highlight');
      node.addClass('highlighted');

      const successors = node.successors();
      successors.addClass('downstream-affected');
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        cy.elements().removeClass('highlighted downstream-affected path-highlight');
      }
    });

    cyInstanceRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [graphData, selectedSheetFilter]);

  const handleZoomIn = () => cyInstanceRef.current?.zoom(cyInstanceRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyInstanceRef.current?.zoom(cyInstanceRef.current.zoom() * 0.8);
  const handleFit = () => cyInstanceRef.current?.fit(null, 40);

  // Highlight specific path on Cytoscape canvas
  const handleHighlightPath = (pathNodes) => {
    if (!cyInstanceRef.current || !pathNodes || pathNodes.length === 0) return;
    const cy = cyInstanceRef.current;
    cy.elements().removeClass('path-highlight');

    for (let i = 0; i < pathNodes.length; i++) {
      cy.$id(pathNodes[i]).addClass('path-highlight');
      if (i < pathNodes.length - 1) {
        const source = pathNodes[i];
        const target = pathNodes[i + 1];
        cy.edges(`[source = "${source}"][target = "${target}"]`).addClass('path-highlight');
      }
    }
  };

  if (isLoading) {
    return <LoadingState message="Mapping formula dependency edges and executing Tarjan SCC..." />;
  }

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="page-container">
        <EmptyState
          icon={Network}
          title="No Calculation Dependencies Mapped"
          description="The active spreadsheets contain only static data and no formula-based cell dependency relationships."
          actionLabel="Try Demo Financial Model"
          actionTo="/new"
        />
      </div>
    );
  }

  const uniqueSheets = Array.from(new Set(graphData.nodes.map((n) => n.data.sheet)));
  const nodeImpactDetails = selectedNode ? impactAnalysis.perCellImpact?.[selectedNode.id] : null;

  const exploreTabs = [
    { label: 'Cell Changes', path: '/results', count: comparisonData?.summary?.totalChanges || 0 },
    { label: 'Formula Analysis', path: '/formulas', count: comparisonData?.formulaAnalyses?.length || 0 },
    { label: 'Formula Connections', path: '/graph' },
    { label: 'What-If Simulator', path: '/scenario' }
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingBottom: '1rem' }}>
      {/* Contextual Sub-Nav Tabs */}
      <SubNavTabs tabs={exploreTabs} />

      {/* Centralized Workspace Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.5rem 1rem',
          marginBottom: '0.75rem',
          boxShadow: 'var(--shadow-hairline)',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Network size={16} color="var(--primary)" />
            <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-main)' }}>
              Formula Connections
            </span>
          </div>

          <div style={{ width: 1, height: 16, backgroundColor: 'var(--border-subtle)' }} />

          {/* Legend Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.6875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--primary-subtle)', border: '1px solid var(--primary)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Formula Node</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#fff7ed', border: '1px solid #ea580c' }} />
              <span style={{ color: 'var(--text-muted)' }}>Changed Cell</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#fef2f2', border: '1px solid #dc2626' }} />
              <span style={{ color: 'var(--critical)' }}>Cycle Hazard</span>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <select
            value={selectedSheetFilter}
            onChange={(e) => setSelectedSheetFilter(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            <option value="ALL">All Sheets ({uniqueSheets.length})</option>
            {uniqueSheets.map((s) => (
              <option key={s} value={s}>
                Sheet: {s}
              </option>
            ))}
          </select>

          <button onClick={handleZoomIn} className="btn btn-secondary btn-sm" title="Zoom In">
            <ZoomIn size={12} />
          </button>
          <button onClick={handleZoomOut} className="btn btn-secondary btn-sm" title="Zoom Out">
            <ZoomOut size={12} />
          </button>
          <button onClick={handleFit} className="btn btn-secondary btn-sm" title="Fit to Canvas">
            <RotateCcw size={12} />
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* Cycle Hazard Warning Strip */}
      {cycles.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--critical-bg)',
            border: '1px solid var(--critical-border)',
            borderRadius: 'var(--radius-xs)',
            padding: '0.5rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            color: 'var(--critical-text)',
            fontSize: '0.75rem',
            flexShrink: 0
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <div>
            <strong>Tarjan SCC Detected Circular Calculation Loop:</strong> {cycles.map((c) => c.cyclePath).join(' | ')}
          </div>
        </div>
      )}

      {/* Main Focus: Graph Canvas + Inspection Drawer */}
      <div style={{ display: 'flex', flex: 1, gap: '0.75rem', minHeight: 0, overflow: 'hidden' }}>
        {/* Full Viewport Canvas */}
        <div
          ref={cyContainerRef}
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-hairline)',
            position: 'relative'
          }}
        />

        {/* Floating/Collapsible Inspection Drawer (340px) */}
        {drawerOpen && (
          <div
            style={{
              width: 340,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-hairline)',
              flexShrink: 0
            }}
          >
            {selectedNode ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.35rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Inspected Node
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {selectedNode.inCycle && <Badge variant="critical">IN CYCLE</Badge>}
                    {selectedNode.isChanged && <Badge variant="high">CHANGED</Badge>}
                  </div>
                </div>

                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.65rem' }}>
                  <span className="cell-code" style={{ fontSize: '1rem' }}>{selectedNode.id}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.875rem', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Worksheet:</span>{' '}
                    <strong style={{ color: 'var(--text-main)' }}>{selectedNode.sheet}</strong>
                  </div>
                  {selectedNode.formula && (
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.15rem' }}>Formula:</div>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-xs)', display: 'block', wordBreak: 'break-all' }}>
                        {selectedNode.formula}
                      </code>
                    </div>
                  )}
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Value:</span>{' '}
                    <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {selectedNode.formattedText || String(selectedNode.value ?? '—')}
                    </strong>
                  </div>
                </div>

                {/* Impact Paths Section */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                    Downstream Cascade Metrics
                  </span>

                  {nodeImpactDetails ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 700 }}>1-Hop Direct</div>
                          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                            {nodeImpactDetails.directDependents?.length || 0}
                          </div>
                        </div>

                        <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 700 }}>Indirect Cascade</div>
                          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#7e22ce', fontFamily: 'var(--font-mono)' }}>
                            {nodeImpactDetails.indirectDependents?.length || 0}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-body)', marginBottom: '0.65rem' }}>
                        Max Dependency Depth: <strong>{nodeImpactDetails.maxDepth} Tier(s)</strong>
                      </div>

                      {/* Shortest Paths Table */}
                      {nodeImpactDetails.impactPaths && Object.keys(nodeImpactDetails.impactPaths).length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                            Shortest Downstream Paths:
                          </div>
                          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {Object.entries(nodeImpactDetails.impactPaths).map(([target, info]) => (
                              <div
                                key={target}
                                style={{
                                  padding: '0.45rem 0.6rem',
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: 'var(--radius-xs)',
                                  fontSize: '0.6875rem',
                                  backgroundColor: '#ffffff'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{target}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleHighlightPath(info.shortestPath)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.1rem 0.35rem', fontSize: '0.625rem' }}
                                  >
                                    <Route size={10} />
                                    <span>Show Path</span>
                                  </button>
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.625rem' }}>
                                  {info.shortestPath.join(' ➔ ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                      Click on a formula node or changed cell to trace its exact downstream impact paths.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  color: 'var(--text-subtle)'
                }}
              >
                <Network size={28} style={{ marginBottom: '0.625rem', opacity: 0.35 }} />
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Node Inspector
                </div>
                <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-subtle)', maxWidth: 220 }}>
                  Tap any calculation node on the canvas to inspect formula precedent edges and downstream blast wave.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
