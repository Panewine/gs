// These five drops are absent from the CSV item rows. Their names and icons
// come from the old craft catalog; the boss is confirmed by the game's forum.
const drops = [
  ['I04K', 'Обломки железной гаубицы', 'BTNGaussRifle1.png'],
  ['I04L', 'Треснувшая подзорная труба', 'BTNExpandedView.png'],
  ['I04M', 'Порваные перчатки', 'BTNPickUpItem.png'],
  ['I04N', 'Пустой пороховой мешочек', 'BTNINV_Misc_Ammo_Bullet_01.png'],
  ['I04O', 'Повреждённая броня', 'BTNDamagedShield.png'],
]

export default drops.map(([code, name, icon]) => ({
  id: `bombs-${code}`,
  name,
  level: null,
  classes: [],
  description: '',
  recipe: '',
  kind: 'item',
  icon,
  row: null,
  ingredients: [],
}))
