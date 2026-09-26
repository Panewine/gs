// These seven Pops recipes are missing as rows in the 1.5.5 CSV but appear
// as ingredients there. Stats and recipes come from the site's old craft.json.
function ingredient(name, count = 1, itemId = null) {
  return { text: count > 1 ? `${name} х${count}` : name, count, itemId }
}

function potion(code, name, description, icon, finalIngredient) {
  const ingredients = [
    ingredient('Мутная водичка'),
    ingredient('Съедобный грыбочек', 5),
    finalIngredient,
    ingredient('[Котелок Попса]'),
  ]

  return {
    id: `pops-${code}`,
    name,
    level: null,
    classes: [],
    description,
    recipe: ingredients.map((part) => part.text).join('\n'),
    kind: 'item',
    icon,
    row: null,
    ingredients,
  }
}

export default [
  potion('I072', 'Зелье интеллекта', 'Интеллект +25% на 3 минуты. Перезарядка 5 минут.', 'BTNMANA VIAL.png', ingredient('Топаз')),
  potion('I073', 'Зелье Силы', 'Сила +25% на 3 минуты. Перезарядка 5 минут.', 'BTNHEALTH VIAL.png', ingredient('Рубин')),
  potion('I074', 'Магическое зелье', 'Магический урон и лечение +25% на 3 минуты. Перезарядка 5 минут.', 'BTNPurplePotion.png', ingredient('Сапфир')),
  potion('I075', 'Зелье скорости', 'Скорость владельца и ближайших союзников увеличивается в 4 раза на 30 секунд.', 'BTNANTIDOTE VIAL.png', ingredient('Гоблинские сапоги', 1, 'item-20')),
  potion('I076', 'Зелье защиты', 'Защита +25%.', 'BTNManaPotion.png', ingredient('Изумруд')),
  potion('I077', 'Зелье ловкости', 'Ловкость +25% на 3 минуты. Перезарядка 5 минут.', 'BTNINV_Potion_18.png', ingredient('Серебряная пыль', 5)),
  potion('I078', 'Зелье урона', 'Физический урон +25% на 3 минуты. Перезарядка 5 минут.', 'BTNPoisonPotion.png', ingredient('Грибная самогонка', 1, 'item-44')),
]
