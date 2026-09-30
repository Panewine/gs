import source from './bosses-recovered.md?raw'

const names = [
  'Гигантский арахнид',
  'Потный рабовладелец',
  'Страж врат',
  'Экскаватор КУС',
  'Похоть',
  'Бомбс и Аккуратерс',
  'Алчность',
  'Хазул',
  'Страх',
  'Дрессировщик',
  'Зависть',
  'Шиззл',
  'Смерть',
]

function section(body, title) {
  const start = body.indexOf(`### ${title}\n`)
  if (start < 0) return ''
  const rest = body.slice(start + title.length + 5)
  return rest.split(/\n### |\n---/)[0].trim()
}

const profiles = [...source.replaceAll('\r\n', '\n').matchAll(/^## Босс (\d+): [^\n]+\n([\s\S]*?)(?=^---$)/gm)]

export const fallbackBosses = profiles.map(([, number, body]) => ({
  id: Number(number),
  name: names[Number(number) - 1],
  wave: Number(body.match(/\*\*Волна:\*\* (\d+)/)?.[1]),
  ability: section(body, 'Способности').split('\n').filter((line) => line.startsWith('- ')).map((line, index) => ({
    id: index + 1,
    description: line.slice(2),
  })),
  summons: section(body, 'Призыв'),
  danger: section(body, 'Чем опасен'),
  stats: section(body, 'Параметры'),
  upgrade: '',
  items: [],
  recovered: true,
}))
