"""Build the local 1.5.5 catalog and structured guide data from supplied sources."""

import csv
import json
import re
import unicodedata
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "gs" / "src" / "data"
CSV = ROOT / "gs" / "source" / "catalog-1.5.5.csv"
GUIDES = ROOT / "Персонажи"
ICON_URL = "https://raw.githubusercontent.com/AlAstroMoody/gs-icons-full/main/"
STAGES = (10, 25, 30, 50, 75, 100, 150)
LEGACY_BOSS_INGREDIENTS = {
    "Обломки железной гаубицы": "bombs-I04K",
    "Треснувшая подзорная труба": "bombs-I04L",
    "Порваные перчатки": "bombs-I04M",
    "Пустой пороховой мешочек": "bombs-I04N",
    "Повреждённая броня": "bombs-I04O",
}


def key(value):
    value = unicodedata.normalize("NFKC", value).casefold().replace("ё", "е")
    return re.sub(r"[^\w]+", "", value)


def clean(value):
    return value.strip().replace("\r", "")


def get_legacy_icons():
    existing = OUTPUT / "items-1.5.5.json"
    if existing.exists():
        records = json.loads(existing.read_text(encoding="utf-8"))
        return {key(record["name"]): record["icon"] for record in records if record.get("icon")}
    url = ICON_URL + "craft.json"
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            records = json.load(response)
    except OSError:
        print("Icon catalog unavailable; missing icons will use the WC3 question mark")
        return {}
    matches = defaultdict(set)
    for record in records:
        if record.get("src"):
            matches[key(record["name"])].add(record["src"])
    return {name: next(iter(paths)) for name, paths in matches.items() if len(paths) == 1}


def build_items():
    with CSV.open(encoding="utf-8-sig", newline="") as source:
        rows = list(csv.reader(source))
    icons = get_legacy_icons()
    existing = json.loads((OUTPUT / "items-1.5.5.json").read_text(encoding="utf-8"))
    existing_ids = defaultdict(list)
    for record in existing:
        existing_ids[(record["kind"], key(record["name"]))].append(record["id"])
    next_ids = {kind: max(int(record["id"].split("-")[1]) for record in existing if record["kind"] == kind) + 1 for kind in ("item", "food")}
    items = []
    for row_number, row in enumerate(rows[3:], start=4):
        for offset, kind in ((0, "item"), (5, "food")):
            name = clean(row[offset])
            description = clean(row[offset + (3 if offset == 0 else 1)])
            recipe = clean(row[offset + (4 if offset == 0 else 2)])
            if not name or not (description or recipe):
                continue
            level_text = clean(row[1]) if offset == 0 else ""
            level = int(level_text) if level_text.isdigit() else None
            class_text = clean(row[2]) if offset == 0 else ""
            classes = []
            for value in re.split(r"[,;/\n]+", class_text):
                value = value.strip()
                if value and value not in classes:
                    classes.append(value)
            if not classes:
                restriction = re.search(r"Только для\s+([^.!\n]+)", description, flags=re.I)
                if restriction:
                    for candidate in ("Сталкер", "Инженер", "Пулемётчик", "Медик", "Подрывник", "Ракетчик", "Пироманьяк", "Снайпер"):
                        if key(candidate)[:5] in key(restriction.group(1)):
                            classes.append(candidate)
            previous = existing_ids[(kind, key(name))]
            if previous:
                item_id = previous.pop(0)
            else:
                item_id = f"{kind}-{next_ids[kind]}"
                next_ids[kind] += 1
            items.append({
                "id": item_id,
                "name": name,
                "level": level,
                "classes": classes,
                "description": description,
                "recipe": recipe,
                "kind": kind,
                "icon": icons.get(key(name), ""),
                "row": row_number,
            })

    lookup = defaultdict(list)
    for item in items:
        lookup[key(item["name"])].append(item["id"])
    for name, item_id in LEGACY_BOSS_INGREDIENTS.items():
        lookup[key(name)].append(item_id)
    for item in items:
        ingredients = []
        for line in item["recipe"].splitlines():
            label = line.strip().lstrip("-• ").strip()
            if not label:
                continue
            match = re.match(r"^(.+?)\s*[хx×]\s*(\d+)\s*(?:шт\.?\s*)?$", label, flags=re.I)
            name = match.group(1).strip() if match else label
            count = int(match.group(2)) if match else 1
            ingredient_key = key(name)
            if ingredient_key == key("Свеча рабовладельца"):
                ingredient_key = key("Свечка рабовладельца")
            elif ingredient_key == key("Порваная сеть дрессировщика"):
                ingredient_key = key("Порванная сеть")
            ids = lookup.get(ingredient_key, [])
            if ingredient_key == key("Охотник"):
                if item["name"] == "Драконья Душа":
                    ids = ["item-283"]
                elif item["name"] == "Драконья Душа-2":
                    ids = ["item-284"]
            ingredients.append({"text": label, "count": count, "itemId": ids[0] if len(ids) == 1 and ids[0] != item["id"] else None})
        item["ingredients"] = ingredients
    return items


def build_guides(items):
    lookup = defaultdict(list)
    for item in items:
        lookup[key(item["name"])].append(item["id"])
    classes = []
    variants = []
    for folder in sorted(GUIDES.iterdir()):
        if not folder.is_dir():
            continue
        class_name = folder.name.split("_", 1)[1]
        class_id = folder.name.split("_", 1)[0]
        common = (folder / "Общее.md").read_text(encoding="utf-8")
        role_text = re.search(r"## Рол[ьи].*?\n(.*?)(?=\n## |\Z)", common, re.S)
        summary = re.sub(r"\s+", " ", role_text.group(1)).strip() if role_text else ""
        summary = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", summary).replace("**", "")
        classes.append({"id": class_id, "name": class_name, "summary": summary[:700]})
        for path in sorted(folder.glob("*.md")):
            if path.name == "Общее.md":
                continue
            content = path.read_text(encoding="utf-8")
            title = content.splitlines()[0].lstrip("# ").strip()
            tags = []
            lower = title.casefold()
            for tag, fragments in (("ДД", ("дд",)), ("Танк", ("танк", "оффтанк")), ("Поддержка", ("саппорт", "поддерж", "хил", "станер"))):
                if any(fragment in lower for fragment in fragments):
                    tags.append(tag)
            if len(tags) > 1:
                tags.append("Смешанная")
            source_stages = []
            blocks = re.split(r"(?=^#### Уровень )", content, flags=re.M)
            for block in blocks:
                heading = re.match(r"#### Уровень\s+(\d+)", block)
                if not heading:
                    continue
                source_level = int(heading.group(1))
                picks = []
                for line in block.splitlines()[1:]:
                    match = re.match(r"^([1-6])\.\s+(.+)$", line)
                    if match:
                        name = re.sub(r"\s*\([^)]*lvl\)\s*$", "", match.group(2), flags=re.I).strip()
                        candidates = lookup.get(key(name), [])
                        if name.startswith("Охотник —"):
                            candidates = ["item-284" if "атакующ" in name else "item-283"]
                        picks.append({"name": name, "itemId": candidates[0] if len(candidates) == 1 else None})
                    elif picks:
                        break
                if picks:
                    note = re.search(r"\*\*Примечание:\*\*\s*(.+)", block)
                    source_stages.append({"level": source_level, "items": picks[:6], "note": note.group(1).strip() if note else ""})
            stages = []
            for level in STAGES:
                eligible = [stage for stage in source_stages if stage["level"] <= level]
                if eligible:
                    stages.append({"level": level, "sourceLevel": eligible[-1]["level"], "items": eligible[-1]["items"], "note": eligible[-1]["note"]})
            variants.append({"id": f"{class_id}-{path.stem}", "classId": class_id, "title": title, "tags": tags, "stages": stages})
    return {"classes": classes, "variants": variants, "levels": STAGES}


def main():
    OUTPUT.mkdir(exist_ok=True)
    items = build_items()
    guides = build_guides(items)
    (OUTPUT / "items-1.5.5.json").write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT / "guides-1.5.5.json").write_text(json.dumps(guides, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Imported {len(items)} catalog records and {len(guides['variants'])} guides")


if __name__ == "__main__":
    main()
