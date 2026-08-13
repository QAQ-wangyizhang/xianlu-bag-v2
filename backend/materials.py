"""材料名称、用途、分类映射表 —— 从游戏前端 bundle 提取"""

MATERIAL_NAMES: dict[str, str] = {
    "spirit_dust": "灵尘", "blood_iron": "血铁", "jade_fragment": "玉华残片", "gu_powder": "蛊粉",
    "gadget_part": "机括零件", "cloud_silk": "云丝", "spirit_copper": "灵铜", "moon_bead": "月珠",
    "fire_essence": "火之本源", "water_essence": "水之本源", "thunder_essence": "雷之本源",
    "skill_page": "功法残页", "divine_shard": "神髓碎片", "secret_shard": "秘纹碎片",
    "foundation_crystal": "筑基晶", "dao_base_ore": "道基矿", "golden_core_fragment": "金丹碎晶",
    "nascent_soul_jade": "元婴灵玉", "transformation_crystal": "化神结晶", "void_essence": "虚空灵髓",
    "unity_crystal": "合道灵晶", "myriad_lotus": "万相道莲", "tribulation_thunder_core": "天劫雷核",
    "secret_manual_box": "秘籍宝箓", "secret_manual_fragment": "秘籍残片",
    "wanjie_manual": "修罗血海诀", "taihua_manual": "甘霖普渡经", "shihun_manual": "噬魂蚀骨典",
    "hunyuan_manual": "无极剑心典", "tianji_manual": "天机玄枢录",
    "blood_battle_curse": "血战咒", "stamina_pill": "体力丹", "realm_protection_talisman": "界域保护符",
    "tracking_talisman": "寻踪符", "gathering_token": "聚义令", "guandi_holy_grail": "关帝圣杯",
    "rename_card": "改名卡", "attr_page_scroll": "修为分身符", "cultivation_pill": "修为丹",
    "lianqi_material_bag": "炼气材料袋", "zhuji_material_bag": "筑基材料袋",
    "jindan_material_bag": "金丹材料袋", "yuanying_material_bag": "元婴材料袋",
    "huashen_material_bag": "化神材料袋", "lianxu_material_bag": "炼虚材料袋",
    "heti_material_bag": "合体材料袋", "dacheng_material_bag": "大乘材料袋",
    "dujie_material_bag": "渡劫材料袋", "spirit_stone_bag": "灵石袋",
    "faction_resignation_letter": "辞势力信",
}

MATERIAL_USES: dict[str, str] = {
    "spirit_dust": "全装通用强化", "blood_iron": "武器 / 手镯 攻击向", "jade_fragment": "护甲 / 头盔 防御向",
    "gu_powder": "裤子 / 靴子 速度向", "gadget_part": "腰带 / 高阶通用", "cloud_silk": "头盔 / 靴子 软甲辅料",
    "spirit_copper": "腰带 / 手镯 中阶金属", "moon_bead": "项链 / 戒指 饰品专精",
    "fire_essence": "高阶突破辅料", "water_essence": "高阶突破辅料", "thunder_essence": "高阶突破辅料",
    "skill_page": "研习进阶功法", "divine_shard": "神功石解锁与强化", "secret_shard": "秘功石解锁与强化",
    "foundation_crystal": "筑基段装备强化", "dao_base_ore": "筑基段装备与遗迹掉落",
    "golden_core_fragment": "金丹段装备强化", "nascent_soul_jade": "元婴段装备强化",
    "transformation_crystal": "化神段装备强化", "void_essence": "炼虚段装备强化",
    "unity_crystal": "合体段装备强化", "myriad_lotus": "大乘段装备强化", "tribulation_thunder_core": "渡劫段装备强化",
    "secret_manual_box": "使用后随机获得一册门派秘籍（金丹才可开启）",
    "secret_manual_fragment": "集齐 1000 个可兑换一册本门派秘籍（金丹才可兑换）",
    "wanjie_manual": "万劫宗门派秘籍", "taihua_manual": "太华门门派秘籍", "shihun_manual": "噬魂殿门派秘籍",
    "hunyuan_manual": "混元剑派门派秘籍", "tianji_manual": "天机谷门派秘籍",
    "blood_battle_curse": "恢复 1 次劫关次数", "stamina_pill": "恢复 1 点体力",
    "realm_protection_talisman": "恢复 1 次界域挑战次数", "tracking_talisman": "恢复 1 次劫关名单刷新次数",
    "gathering_token": "恢复 1 次通天塔助战次数", "guandi_holy_grail": "恢复 1 次通天塔助战列表刷新次数",
    "rename_card": "更改一次道号", "attr_page_scroll": "解锁一页修为加点方案（最多 3 页）",
    "cultivation_pill": "使用后增加 10000 点修为",
}

MATERIAL_CATEGORY: dict[str, str] = {
    "spirit_dust": "强化材料", "blood_iron": "强化材料", "jade_fragment": "强化材料", "gu_powder": "强化材料",
    "gadget_part": "强化材料", "cloud_silk": "强化材料", "spirit_copper": "强化材料", "moon_bead": "强化材料",
    "foundation_crystal": "强化材料", "dao_base_ore": "强化材料", "golden_core_fragment": "强化材料",
    "nascent_soul_jade": "强化材料", "transformation_crystal": "强化材料", "void_essence": "强化材料",
    "unity_crystal": "强化材料", "myriad_lotus": "强化材料", "tribulation_thunder_core": "强化材料",
    "fire_essence": "突破辅料", "water_essence": "突破辅料", "thunder_essence": "突破辅料",
    "skill_page": "功法", "divine_shard": "功法", "secret_shard": "功法",
    "secret_manual_box": "功法", "secret_manual_fragment": "功法",
    "wanjie_manual": "功法", "taihua_manual": "功法", "shihun_manual": "功法",
    "hunyuan_manual": "功法", "tianji_manual": "功法",
    "blood_battle_curse": "消耗品", "stamina_pill": "消耗品", "realm_protection_talisman": "消耗品",
    "tracking_talisman": "消耗品", "gathering_token": "消耗品", "guandi_holy_grail": "消耗品",
    "cultivation_pill": "消耗品",
    "lianqi_material_bag": "礼盒", "zhuji_material_bag": "礼盒", "jindan_material_bag": "礼盒",
    "yuanying_material_bag": "礼盒", "huashen_material_bag": "礼盒", "lianxu_material_bag": "礼盒",
    "heti_material_bag": "礼盒", "dacheng_material_bag": "礼盒", "dujie_material_bag": "礼盒",
    "spirit_stone_bag": "礼盒",
    "rename_card": "功能道具", "attr_page_scroll": "功能道具", "faction_resignation_letter": "功能道具",
}

# 境界 key → 中文名
REALM_NAMES: dict[str, str] = {
    "lianqi": "炼气", "zhuji": "筑基", "jindan": "金丹", "yuanying": "元婴",
    "huashen": "化神", "lianxu": "炼虚", "heti": "合体", "dacheng": "大乘", "dujie": "渡劫",
}


def name_of(key: str) -> str:
    return MATERIAL_NAMES.get(key, key)


def use_of(key: str) -> str:
    return MATERIAL_USES.get(key, "")


def category_of(key: str) -> str:
    return MATERIAL_CATEGORY.get(key, "其他")
