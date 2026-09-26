import assert from 'node:assert/strict'

import { emptyPlanner, plannerStages } from '../src/common/planner.js'

const levels = [10, 25, 30, 50]
const guide = { stages: [
  { level: 10, items: [{ itemId: 'a' }, { itemId: 'b' }] },
  { level: 25, items: [{ itemId: 'a' }, { itemId: 'c' }] },
  { level: 30, items: [{ itemId: 'a' }, { itemId: 'c' }] },
  { level: 50, items: [{ itemId: 'd' }, { itemId: 'c' }] },
] }

assert.deepEqual(plannerStages(guide, levels, emptyPlanner())[10], [null, null, null, null, null, null])
const state = { loaded: true, overrides: { 10: { 0: 'x' }, 30: { 1: 'y' } } }
const stages = plannerStages(guide, levels, state)
assert.deepEqual(stages[10].slice(0, 2), ['x', 'b'])
assert.deepEqual(stages[25].slice(0, 2), ['x', 'c'])
assert.deepEqual(stages[30].slice(0, 2), ['x', 'y'])
assert.deepEqual(stages[50].slice(0, 2), ['d', 'y'])
console.log('Verified planner inheritance, guide changes, and later overrides')
