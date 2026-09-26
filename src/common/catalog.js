import bombsDrops from '@/data/bombs-drops-legacy'
import { bossByItemId, bossLevelByName } from '@/data/boss-drops-1.5.5'
import items from '@/data/items-1.5.5.json'
import popsPotions from '@/data/pops-potions-legacy'

export const catalog = [...items, ...popsPotions, ...bombsDrops]
export const itemById = new Map(catalog.map((item) => [item.id, item]))
export const fallbackIcon = `${import.meta.env.BASE_URL}images/question-wc3.png`

export function bossFor(item) {
  return bossByItemId[item?.id] || ''
}

export function bossLevelFor(item) {
  return bossLevelByName[bossFor(item)] ?? null
}

export function catalogLevelLabel(item) {
  if (item.level != null) return `Уровень ${item.level}`
  const bossLevel = bossLevelFor(item)

  if (bossLevel == null) return 'Уровень не указан'

  return `Уровень предмета не указан · ${bossFor(item).includes('мини-боссы') ? 'источник от' : 'босс'} ур. ${bossLevel}`
}

export function normalizeName(value) {
  return String(value || '')
    .toLocaleLowerCase('ru')
    .replaceAll('ё', 'е')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

const sameName = new Map()
for (const item of catalog) {
  const name = normalizeName(item.name)
  sameName.set(name, (sameName.get(name) || 0) + 1)
}
const seenName = new Map()
const variantNumber = new Map()
for (const item of catalog) {
  const name = normalizeName(item.name)
  const number = (seenName.get(name) || 0) + 1
  seenName.set(name, number)
  variantNumber.set(item.id, number)
}

export function catalogLabel(item) {
  return sameName.get(normalizeName(item.name)) > 1
    ? `${item.name} · вариант ${variantNumber.get(item.id)}`
    : item.name
}

export function fitsClass(item, className) {
  return !className || !item.classes.length || item.classes.some(
    (name) => normalizeName(name) === normalizeName(className)
  )
}

export function iconFor(item) {
  return item?.icon
    ? `https://raw.githubusercontent.com/AlAstroMoody/gs-icons-full/main/${item.icon}`
    : fallbackIcon
}

export function catalogKindLabel(item) {
  return item.kind === 'food' || /энергетик/i.test(item.name) ? 'Еда' : 'Предмет'
}
