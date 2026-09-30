import { useStorage } from '@vueuse/core'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue } from 'firebase/database'
import { reactive } from 'vue'

import { config } from './firebaseConfig'

import { baseUrl } from '@/common/constants'
import { useGoblinState } from '@/components/composables/useGoblinState'

const version = useStorage('version')
const firebaseApp = initializeApp(config)
const db = getDatabase(firebaseApp)
const baseIconPath = `https://raw.githubusercontent.com/AlAstroMoody/gs-icons/main/`

export const store = reactive({
  entities: { items: [], itemsV16: [], bosses: [], goblins: [], quests: [], craft: [] },
  version: '1.5а',
  maxLevel: version === '1.5а' ? 200 : 150,

  currentItem(entity, id) {
    return this.entities[entity].find((item) => item.id === Number(id))
  },

  async setItems(entity) {
    if (!this.entities[entity].length) {
      const entitiesRef = ref(db, entity)
      onValue(entitiesRef, async (snapshot) => {
        this.entities[entity] = snapshot.val() || []
        this.entities[entity].forEach((item) => {
          if (item.src) {
            item.src = `${baseIconPath}${item.src.replace('/uploads/', '')}`
          }
        })

        if (entity === 'goblins') {
          const { user, setGoblin } = useGoblinState()
          const lsGoblin = localStorage.getItem('goblin')
          if (lsGoblin) setGoblin(this.entities.goblins.find((g) => g.name === lsGoblin))
          else user.goblin?.id ? null : setGoblin(this.entities.goblins[0])
        }
      })
    }
  },

  async setQuests() {
    if (!this.entities.quests.length) {
      const entitiesRef = ref(db, 'quests')
      onValue(entitiesRef, async (snapshot) => {
        this.entities.quests = await snapshot.val()
      })
    }
  },

  // Функция для извлечения уровня из описания предмета
  extractLevelFromDescription(desc) {
    if (!desc) return null

    // Ищем паттерны типа "100 уровня", "уровень 100", "lvl 100", "100 lvl"
    const levelPatterns = [
      /(\d+)\s*уровня/i,
      /уровень\s*(\d+)/i,
      /lvl\s*(\d+)/i,
      /(\d+)\s*lvl/i,
      /(\d+)\s*level/i,
      /level\s*(\d+)/i,
    ]

    for (const pattern of levelPatterns) {
      const match = desc.match(pattern)
      if (match) {
        return parseInt(match[1])
      }
    }

    return null
  },

  // Функция для нормализации текста (убирает регистр, ё/е, но сохраняет цифры)
  normalizeText(text) {
    return (
      text
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/c/g, 'с') // Заменяем латинскую c на кириллическую с
        .replace(/a/g, 'а') // Заменяем латинскую a на кириллическую а
        .replace(/o/g, 'о') // Заменяем латинскую o на кириллическую о
        .replace(/e/g, 'е') // Заменяем латинскую e на кириллическую е
        .replace(/p/g, 'р') // Заменяем латинскую p на кириллическую р
        .replace(/y/g, 'у') // Заменяем латинскую y на кириллическую у
        .replace(/x/g, 'х') // Заменяем латинскую x на кириллическую х
        .replace(/\s+/g, ' ') // Заменяем множественные пробелы на один
        // Исправляем опечатки в данных
        .replace(/дляп\s+/g, 'для ') // "дляп улемётчика" -> "для пулемётчика"
        .replace(/улемётчик/g, 'пулемётчик') // "улемётчик" -> "пулемётчик"
        .trim()
    )
  },

  // Функция для извлечения классов гоблинов из описания предмета
  extractGoblinClassesFromDescription(desc) {
    if (!desc) return []

    const normalizedDesc = this.normalizeText(desc)
    const goblinClasses = []

    // Используем реальный список гоблинов из данных
    const allGoblinClasses = this.entities.goblins?.length
      ? this.entities.goblins.map((goblin) => goblin.name)
      : [
          'подрывник',
          'сталкер',
          'ракетчик',
          'снайпер',
          'медик',
          'пироманьяк',
          'инженер',
          'пулемётчик',
        ]

    // Проверяем каждый класс
    allGoblinClasses.forEach((goblinClass) => {
      const normalizedGoblinClass = this.normalizeText(goblinClass)

      // Проверяем только явные ограничения по классу
      const patterns = [
        // "Только для снайпера и сталкера" или "Только для снайпера или сталкера"
        new RegExp(`только\\s+для\\s+[^!]*${normalizedGoblinClass}[^!]*`, 'i'),
        // "для снайпера класса"
        new RegExp(`для\\s+${normalizedGoblinClass}\\s+класса`, 'i'),
        // "класс снайпера"
        new RegExp(`класс\\s+${normalizedGoblinClass}`, 'i'),
        // "гоблин снайпер"
        new RegExp(`гоблин\\s+${normalizedGoblinClass}`, 'i'),
      ]

      // Проверяем частичное совпадение с учетом окончаний
      const words = normalizedGoblinClass.split(' ')
      words.forEach((word) => {
        if (word.length > 2) {
          const baseWord = word.replace(/[аяеёиыоуьъ]$/, '')
          if (baseWord.length >= 3) {
            const endings = ['', 'а', 'я', 'е', 'ё', 'и', 'ы', 'ом', 'ой', 'у', 'ю', 'ем', 'и', 'ы']
            endings.forEach((ending) => {
              const fullWord = baseWord + ending
              patterns.push(new RegExp(`\\b${fullWord}\\b`, 'i'))
            })
          }
        }
      })

      // Если найден хотя бы один паттерн, добавляем класс
      if (patterns.some((pattern) => pattern.test(normalizedDesc))) {
        goblinClasses.push(goblinClass)
      }
    })

    return goblinClasses
  },

  async getItems() {
    const response = await fetch(baseUrl + 'craft.json')
    const items = await response.json()

    // Обрабатываем каждый предмет
    items.forEach((item) => {
      // Если уровень равен '0' или 0, пытаемся извлечь из описания
      if (item.level === '0' || item.level === 0) {
        const levelFromDesc = this.extractLevelFromDescription(item.desc)
        if (levelFromDesc) {
          item.level = levelFromDesc.toString()
        }
      }

      // Извлекаем классы гоблинов из описания
      const goblinClasses = this.extractGoblinClassesFromDescription(item.desc)
      item.goblinClasses = goblinClasses
      item.isForAllClasses = goblinClasses.length === 0

      // Отладочная информация для проблемных предметов
      if (item.name === 'Душитель X-8') {
        const normalizedDesc = this.normalizeText(item.desc)
      }
    })

    store.entities.items = items
  },

  async getItemsV16() {
    if (this.entities.itemsV16.length > 0) return

    const response = await fetch(baseUrl + 'craft1_6.json')
    const items = await response.json()

    items.forEach((item) => {
      if (item.icon) {
        item.iconPath = item.icon
      }

      // Нормализуем уровень если нужно
      if (item.level === '0' || item.level === 0) {
        const levelFromDesc = this.extractLevelFromDescription(item.desc)
        if (levelFromDesc) {
          item.level = levelFromDesc.toString()
        }
      }
    })

    store.entities.itemsV16 = items
  },
})
