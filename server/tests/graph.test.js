import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCycles, findDownstreamDependents } from '../utils/graphAlgorithms.js';
import { buildDependencyGraph } from '../services/dependencyGraphService.js';

test('Graph Algorithms - detects simple circular dependency A -> B -> A', () => {
  const adjacency = new Map();
  // A feeds into B
  adjacency.set('A', new Set(['B']));
  // B feeds into A (cycle!)
  adjacency.set('B', new Set(['A']));

  const cycles = detectCycles(adjacency);
  assert.equal(cycles.length, 1);
  assert.ok(cycles[0].cyclePath.includes('A -> B -> A') || cycles[0].cyclePath.includes('B -> A -> B'));
});

test('Graph Algorithms - finds downstream dependent blast radius', () => {
  const adjacency = new Map();
  // Root A feeds B and C; B feeds D
  adjacency.set('A', new Set(['B', 'C']));
  adjacency.set('B', new Set(['D']));
  adjacency.set('C', new Set());
  adjacency.set('D', new Set());

  const result = findDownstreamDependents('A', adjacency);
  assert.equal(result.dependentCount, 3);
  assert.deepEqual(result.dependentNodes.sort(), ['B', 'C', 'D']);
});

test('Dependency Graph Service - builds Cytoscape elements for formula dependencies', () => {
  const parsedWb = {
    sheetNames: ['Model'],
    sheets: {
      Model: {
        cells: {
          A1: { cell: 'A1', value: 10, formattedText: '10', formula: null },
          B1: { cell: 'B1', value: 20, formattedText: '20', formula: '=A1*2' },
          C1: { cell: 'C1', value: 40, formattedText: '40', formula: '=B1*2' }
        }
      }
    }
  };

  const graph = buildDependencyGraph(parsedWb);
  assert.equal(graph.totalNodes, 3);
  assert.equal(graph.totalEdges, 2);
  assert.equal(graph.cycles.length, 0);

  // A1 has 2 downstream dependents (B1 and C1)
  const a1Impact = graph.downstreamImpacts['Model!A1'];
  assert.ok(a1Impact);
  assert.equal(a1Impact.dependentCount, 2);
});
