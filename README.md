# Goblin Survival

pet-project for great justice :D

Таблица крафтов и интерактивный калькулятор для карты из warcraft 3 - goblin survival

![alt text](/public/readme/item.png)

![alt text](/public/readme/craft.png)

## Данные 1.5.5fix9

Каталог и структурированные сборки лежат в `src/data/`. Они собраны из CSV в корне соседней папки и Markdown-файлов `Персонажи/` командой `python scripts/build-content.py`. Для проверки импорта запустите `python scripts/verify-content.py`, для проверки наследования планера — `node scripts/verify-planner.mjs`. Иконки сопоставлены со старым каталогом; если иконка отсутствует, сайт показывает локальный значок вопроса Warcraft III.
