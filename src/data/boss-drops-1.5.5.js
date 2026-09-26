// Boss names and drops: the site's bosses.json, with Shizzl and Death's first
// five drops checked against https://goblinworkshop.ru/forum/viewtopic.php?t=48.
// The six "Истинной Смерти" items are attributed to Death by their CSV names.
const drops = {
  'Гигантский арахнид': ['item-85', 'item-86', 'item-87'],
  'Потный рабовладелец': ['item-100', 'item-101', 'item-102'],
  'Страж врат': ['item-128', 'item-129', 'item-130', 'item-131', 'item-132'],
  'Экскаватор КУС': ['item-149', 'item-150', 'item-151'],
  'Похоть': ['item-184', 'item-185', 'item-186', 'item-188'],
  'Алчность': ['item-234', 'item-235', 'item-236', 'item-237'],
  'Страх': ['item-299', 'item-300', 'item-301', 'item-302', 'item-303'],
  'Дрессировщик': ['item-332', 'item-333', 'item-334'],
  'Зависть': ['item-363', 'item-364', 'item-365', 'item-366', 'item-367'],
  'Шиззл': ['item-420', 'item-421', 'item-422'],
  'Смерть': ['item-441', 'item-442', 'item-443', 'item-444', 'item-445', 'item-465', 'item-466', 'item-467', 'item-468', 'item-469', 'item-470'],
}

export const bossByItemId = Object.fromEntries(
  Object.entries(drops).flatMap(([boss, ids]) => ids.map((id) => [id, boss]))
)
bossByItemId['item-461'] = 'Смерть и мини-боссы волн 61–64'
bossByItemId['item-416'] = 'Дракон'
for (const code of ['I04K', 'I04L', 'I04M', 'I04N', 'I04O']) {
  bossByItemId[`bombs-${code}`] = 'Бомбс и Аккуратерс'
}
