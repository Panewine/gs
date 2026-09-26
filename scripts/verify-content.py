import csv
import json
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parents[2]
items = json.loads((root / "gs/src/data/items-1.5.5.json").read_text(encoding="utf-8"))
guides = json.loads((root / "gs/src/data/guides-1.5.5.json").read_text(encoding="utf-8"))
with (root / "GS1.5.5 - Крафт всего.csv").open(encoding="utf-8-sig", newline="") as source:
    rows = list(csv.reader(source))[3:]

expected = []
for number, row in enumerate(rows, 4):
    for offset, kind in ((0, "item"), (5, "food")):
        if row[offset].strip() and (row[offset + (3 if offset == 0 else 1)].strip() or row[offset + (4 if offset == 0 else 2)].strip()):
            expected.append((f"{kind}-{number}", row[offset].strip()))
assert Counter(expected) == Counter((item["id"], item["name"]) for item in items)
boss_drop_ids = {f"bombs-I04{letter}" for letter in "KLMNO"}
known_ids = {item["id"] for item in items} | boss_drop_ids
assert all(ingredient["itemId"] is None or ingredient["itemId"] in known_ids for item in items for ingredient in item["ingredients"])
assert all(item["level"] is None or isinstance(item["level"], int) for item in items)
assert any(ingredient["count"] > 1 for item in items for ingredient in item["ingredients"])
assert next(item for item in items if item["name"] == "Руна")["level"] is None
assert len([item for item in items if item["name"] == "Потрясная Жрачка"]) == 5
final_set = next(item for item in items if item["name"] == "Сет Истинной Смерти")
assert sum(ingredient["itemId"] is not None for ingredient in final_set["ingredients"]) == 6
assert any("Великой кузнице" in ingredient["text"] and ingredient["itemId"] is None for ingredient in final_set["ingredients"])
assert len(guides["classes"]) == 8 and len(guides["variants"]) == 14
assert all(len(stage["items"]) == 6 and stage["sourceLevel"] <= stage["level"] for variant in guides["variants"] for stage in variant["stages"])
assert all(pick["itemId"] is None or pick["itemId"] in known_ids for variant in guides["variants"] for stage in variant["stages"] for pick in stage["items"])
items_by_id = {item["id"]: item for item in items}
items_by_id.update({item_id: {"ingredients": []} for item_id in boss_drop_ids})


def recipe_components(item_id, visited=None):
    visited = set() if visited is None else visited
    if item_id in visited:
        return set()
    visited.add(item_id)
    components = set()
    for ingredient in items_by_id[item_id]["ingredients"]:
        component_id = ingredient["itemId"]
        if component_id:
            components.add(component_id)
            components.update(recipe_components(component_id, visited.copy()))
    return components


for variant in guides["variants"]:
    for stage in variant["stages"]:
        equipped = {pick["itemId"] for pick in stage["items"] if pick["itemId"]}
        for item_id in equipped:
            consumed = equipped & recipe_components(item_id)
            assert not consumed, (
                variant["title"],
                stage["level"],
                items_by_id[item_id]["name"],
                [items_by_id[component_id]["name"] for component_id in consumed],
            )
print(f"Verified {len(items)} CSV records, 8 classes, 14 guide variants, and recipe links")
