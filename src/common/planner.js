export const SLOT_COUNT = 6

export function emptyPlanner() {
  return { loaded: false, overrides: {} }
}

export function plannerStages(guide, levels, state) {
  const results = {}
  let current = Array(SLOT_COUNT).fill(null)
  let previousGuide = Array(SLOT_COUNT).fill(null)
  for (const level of levels) {
    const recommendation = guide?.stages.find((stage) => stage.level === level)
    const guideSlots = Array.from({ length: SLOT_COUNT }, (_, index) => recommendation?.items[index]?.itemId || null)
    current = [...current]
    if (state.loaded) {
      for (let index = 0; index < SLOT_COUNT; index++) {
        if (guideSlots[index] !== previousGuide[index]) current[index] = guideSlots[index]
      }
    }
    previousGuide = guideSlots
    const changes = state.overrides[level] || {}
    for (const [slot, id] of Object.entries(changes)) {
      if (Number(slot) >= 0 && Number(slot) < SLOT_COUNT) current[Number(slot)] = id
    }
    results[level] = current
  }

  return results
}
