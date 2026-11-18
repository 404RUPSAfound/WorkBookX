import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findStronglyConnectedComponents,
  findShortestPath,
  analyzeImpactPaths
} from '../utils/impactPathAlgorithms.js';
import { computeImpactAnalysis } from '../services/impactAnalysisService.js';

test('Tarjan SCC - identifies cyclic component and separates acyclic nodes', () => {
  const adj = new Map();
  // Loop: A -> B -> C -> A
  adj.set('A', new Set(['B']));
  adj.set('B', new Set(['C']));
  adj.set('C', new Set(['A', 'D'])); // C also feeds into independent D
  adj.set('D', new Set());

  const sccs = findStronglyConnectedComponents(adj);

  const cyclic = sccs.filter(s => s.isCycle);
  assert.equal(cyclic.length, 1);
  assert.equal(cyclic[0].componentNodes.length, 3);
  assert.deepEqual(cyclic[0].componentNodes.sort(), ['A', 'B', 'C']);

  const acyclic = sccs.filter(s => !s.isCycle);
  assert.equal(acyclic.length, 1);
  assert.equal(acyclic[0].componentNodes[0], 'D');
});

test('Impact Paths - computes shortest path with BFS', () => {
  const adj = new Map();
  // Path 1: A -> B -> C -> D (length 4)
  // Path 2: A -> E -> D (length 3, shorter!)
  adj.set('A', new Set(['B', 'E']));
  adj.set('B', new Set(['C']));
  adj.set('C', new Set(['D']));
  adj.set('E', new Set(['D']));
  adj.set('D', new Set());

  const shortest = findShortestPath('A', 'D', adj);
  assert.deepEqual(shortest, ['A', 'E', 'D']);
});

test('Impact Paths - classifies direct vs indirect dependents and max depth', () => {
  const adj = new Map();
  // Root A feeds B (direct). B feeds C (indirect). C feeds D (indirect).
  adj.set('A', new Set(['B']));
  adj.set('B', new Set(['C']));
  adj.set('C', new Set(['D']));
  adj.set('D', new Set());

  const impact = analyzeImpactPaths('A', adj);
  assert.deepEqual(impact.directDependents, ['B']);
  assert.deepEqual(impact.indirectDependents.sort(), ['C', 'D']);
  assert.equal(impact.maxDepth, 3);
  assert.equal(impact.totalAffected, 3);
  assert.deepEqual(impact.impactPaths['D'].shortestPath, ['A', 'B', 'C', 'D']);
});

test('Impact Analysis Service - analyzes parsed workbook model with changes', () => {
  const parsedWb = {
    sheetNames: ['Model'],
    sheets: {
      Model: {
        cells: {
          A1: { cell: 'A1', value: 10, formula: null },
          B1: { cell: 'B1', value: 20, formula: '=A1*2' },
          C1: { cell: 'C1', value: 40, formula: '=B1*2' }
        }
      }
    }
  };

  const changes = [{ sheet: 'Model', cell: 'A1', fullRef: 'Model!A1' }];
  const result = computeImpactAnalysis(parsedWb, changes);

  assert.equal(result.totalGraphNodes, 3);
  assert.equal(result.globalMaxDepth, 2);
  assert.ok(result.perCellImpact['Model!A1']);
  assert.equal(result.perCellImpact['Model!A1'].totalAffected, 2);
});
