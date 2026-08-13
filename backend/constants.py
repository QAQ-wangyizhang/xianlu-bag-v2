"""游戏数据常量：境界段消耗表、秘境刷新表、境界覆写等"""

from typing import Any

# 各境界段单件装备材料消耗表
GRADE_TIERS: list[dict[str, Any]] = [
    {"key": "lianqi", "name": "炼气段", "range": "1→9", "perItem": {"spirit_stone": 100}},
    {"key": "zhuji", "name": "筑基段", "range": "10→18", "perItem": {
        "spirit_stone": 1200, "foundation_crystal": 12, "spirit_dust": 10, "blood_iron": 6, "jade_fragment": 6}},
    {"key": "jindan", "name": "金丹段", "range": "19→27", "perItem": {
        "spirit_stone": 8000, "golden_core_fragment": 20, "jade_fragment": 12, "gu_powder": 8, "spirit_dust": 12}},
    {"key": "yuanying", "name": "元婴段", "range": "28→36", "perItem": {
        "spirit_stone": 21600, "nascent_soul_jade": 27, "gadget_part": 15, "cloud_silk": 12,
        "moon_bead": 8, "spirit_dust": 15}},
    # 来自玩家截图权威数据
    {"key": "huashen", "name": "化神段 ⭐", "range": "36→45", "perItem": {
        "spirit_stone": 64800, "transformation_crystal": 108, "nascent_soul_jade": 27,
        "dao_base_ore": 12, "gu_powder": 12, "moon_bead": 12, "fire_essence": 10,
        "cloud_silk": 10, "jade_fragment": 10, "blood_iron": 8, "thunder_essence": 8,
        "spirit_copper": 8}},
    {"key": "lianxu", "name": "炼虚段（待实测）", "range": "46→54", "perItem": {}, "placeholder": True},
    {"key": "heti", "name": "合体段（待实测）", "range": "55→63", "perItem": {}, "placeholder": True},
]

# 秘境每日刷新表（奇偶周轮换）
# weekday: 0=周日 ... 6=周六
DUNGEON_SCHEDULE: dict[str, dict[int, dict]] = {
    "odd": {  # 奇数周（变异周）
        0: {"name": "极速雷界-变", "main": {"thunder_essence": 3}, "sub": {"foundation_crystal": 1}},
        1: {"name": "烈焰火域-变", "main": {"fire_essence": 3}, "sub": {"foundation_crystal": 1}},
        2: {"name": "重水深渊-变", "main": {"water_essence": 3}, "sub": {"dao_base_ore": 1}},
        3: {"name": "金戈矿脉-变", "main": {"blood_iron": 5}, "sub": {"dao_base_ore": 1}},
        4: {"name": "青木灵薮-变", "main": {"cloud_silk": 5}, "sub": {"foundation_crystal": 1}},
        5: {"name": "厚土灵穴-变", "main": {"moon_bead": 4}, "sub": {"dao_base_ore": 1}},
        6: {"name": "极速雷界-变", "main": {"thunder_essence": 3}, "sub": {"foundation_crystal": 1}},
    },
    "even": {  # 偶数周（普通周）
        0: {"name": "极速雷界", "main": {"thunder_essence": 2}, "sub": {}},
        1: {"name": "烈焰火域", "main": {"fire_essence": 2}, "sub": {}},
        2: {"name": "重水深渊", "main": {"water_essence": 2}, "sub": {}},
        3: {"name": "金戈矿脉", "main": {"blood_iron": 4}, "sub": {"spirit_copper": 2}},
        4: {"name": "青木灵薮", "main": {"cloud_silk": 4}, "sub": {"jade_fragment": 2}},
        5: {"name": "厚土灵穴", "main": {"moon_bead": 3}, "sub": {"gu_powder": 2}},
        6: {"name": "极速雷界", "main": {"thunder_essence": 2}, "sub": {}},
    },
}

# 每次秘境附加掉落（4~6 取平均 5）
DUNGEON_BONUS: dict[str, int] = {"spirit_dust": 5}

# 境界覆写：不同境界玩家的副材料变化
REALM_OVERRIDE: dict[str, dict[str, Any]] = {
    "jindan": {"sub": "golden_core_fragment", "subQty": 2},
    "yuanying": {"sub": "nascent_soul_jade", "subQty": 2},
    "huashen": {"mainReplace": "transformation_crystal", "mainReplaceQty": 2,
                "sub": "nascent_soul_jade", "subQty": 2},
}

# 场所名称
VENUE_NAMES: dict[str, str] = {
    "mountain": "凡俗深山", "vein": "宗门灵脉", "relic": "上古遗迹",
}

WEEKDAY_NAMES: list[str] = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
