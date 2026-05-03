from pydantic import BaseModel
from datetime import datetime


class Category(BaseModel):
    id: str | None = None
    name: str
    color: str
    priority: int


class Categories(BaseModel):
    categories: list[Category]
    semester_id: str


class Task(BaseModel):
    id: str
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


class FriendActivitySummary(BaseModel):
    completed_today: int | None = None
    completed_this_week: int | None = None
    upcoming_count: int | None = None
    next_due_title: str | None = None
    top_category: str | None = None
    streak_days: int | None = None
    last_completed_at: datetime | None = None
    recently_active: bool | None = None


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
    activity_summary: FriendActivitySummary | None = None
