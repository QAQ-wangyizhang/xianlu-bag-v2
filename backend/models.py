"""Pydantic 数据模型"""
from pydantic import BaseModel


class AccountCreate(BaseModel):
    username: str
    password: str


class AccountRemove(BaseModel):
    username: str


class AccountOwner(BaseModel):
    username: str
    owner: str


class OwnerCreate(BaseModel):
    name: str
    color: str | None = None


class OwnerColorUpdate(BaseModel):
    name: str
    color: str


class OwnerRemove(BaseModel):
    name: str


class BagPlayer(BaseModel):
    name: str | None = None
    sect_name: str | None = None
    faction_name: str | None = None
    major_realm: str | None = None
    stage: int | None = None
    exp: int | None = None
    spirit_stone: int | None = None
    great_dao_origin: int | None = None


class StaminaInfo(BaseModel):
    current: int | None = None
    max: int | None = None
    seconds_to_next: int | None = None
    regen_minutes: int | None = None


class BagData(BaseModel):
    player: BagPlayer
    materials: dict[str, int] = {}
    stamina: StaminaInfo | None = None


class SeclusionAction(BaseModel):
    username: str
