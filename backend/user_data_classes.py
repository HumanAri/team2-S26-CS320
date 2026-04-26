from pydantic import BaseModel
from datetime import datetime


class Category(BaseModel):
    id: str
    name: str
    color: str
    priority: int


class Categories(BaseModel):
    categories: list[Category]
    semester_id: str


class Task(BaseModel):
    category_id: str
    title: str
    description: str
    due_date: datetime | None
    start_time: datetime | None
    end_time: datetime | None
    status: str  # not null, "complete" or "incomplete" exclusively
    is_recurring: bool
    created_at: datetime | None
    completed_at: datetime | None
    recurring_days: list[int]


class FriendStub(BaseModel):  # minimal friend info required for displaying card on homepage
    id: str
    email: str
    profile_picture: str  # emoji
    full_name: str
    display_name: str | None = None
    share_goals: bool
    share_results: bool
    share_other: bool
    share_all: bool
