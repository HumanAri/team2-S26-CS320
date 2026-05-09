

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import requests
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv
from database import supabase
import bcrypt
from user_data_classes import *
from typing import Union
from collections import Counter

# for debugging, delete later
import logging
logger = logging.getLogger("uvicorn.error")

load_dotenv()

app = FastAPI()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET")
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer_scheme = HTTPBearer()


# Decode and validates the JWT, returns the payload as the current user
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


class GoogleTokenRequest(BaseModel):
    token: str


@app.post("/api/auth/google")
def google_login(body: GoogleTokenRequest):
    # Fetch user info from Google
    try:
        userinfo_res = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {body.token}"},
            timeout=5,
        )
        userinfo_res.raise_for_status()
    except requests.HTTPError:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except requests.RequestException:
        raise HTTPException(
            status_code=502, detail="Could not reach Google — try again")

    info = userinfo_res.json()

    # Validate the token was issued for this app's client ID
    if info.get("aud") and info.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Token audience mismatch")

    email = info.get("email", "")
    if not email.endswith("@umass.edu"):
        raise HTTPException(
            status_code=403, detail="Must use a @umass.edu email")

    # Look up user by google_id in the DB, if the user is not found, create a new user
    google_id = info.get("sub")

    existing = supabase.table("users").select(
        "*").eq("google_id", google_id).execute()

    if not existing.data:
        new_user = supabase.table("users").insert({
            "google_id":       google_id,
            "email":           email,
            "email_verified":  info.get("email_verified", False),
            "display_name":    info.get("name"),
            "first_name":      info.get("given_name"),
            "last_name":       info.get("family_name"),
            "profile_picture": info.get("picture"),
        }).execute()

        user_id = new_user.data[0]["id"]

        # Creating a semester
        now = datetime.now()
        if now.month <= 6:
            semester_name = f"Spring {now.year}"
            semester_start = datetime(now.year, 1, 25)
            semester_end = datetime(now.year, 5, 31)
        else:
            semester_name = f"Fall {now.year}"
            semester_start = datetime(now.year, 9, 1)
            semester_end = datetime(now.year, 12, 31)

        semester = supabase.table("semesters").insert({
            "user_id": user_id,
            "name": semester_name,
            "start_date": semester_start.isoformat(),
            "end_date": semester_end.isoformat(),
            "created_at": now.isoformat()
        }).execute()

        semester_id = semester.data[0]["id"]

    else:
        user_id = existing.data[0]["id"]
        semester = supabase.table("semesters").select(
            "id").eq("user_id", user_id).execute()
        semester_id = semester.data[0]["id"]

    token = jwt.encode(
        {
            "google_id":       info.get("sub"),
            "email":           email,
            "email_verified":  info.get("email_verified", False),
            "display_name":    info.get("name"),
            "first_name":      info.get("given_name"),
            "last_name":       info.get("family_name"),
            "profile_picture": info.get("picture"),
            "exp": datetime.now(timezone.utc) + timedelta(hours=8),
        },
        JWT_SECRET,
        algorithm="HS256",
    )
    return {
        "token":           token,
        "semester_id":     semester_id,
        "google_id":       info.get("sub"),
        "email":           email,
        "email_verified":  info.get("email_verified", False),
        "display_name":    info.get("name"),
        "first_name":      info.get("given_name"),
        "last_name":       info.get("family_name"),
        "profile_picture": info.get("picture"),
    }


# Returns 200 if the JWT is good, otherwise returns 401
@app.get("/api/auth/verify")
def verify_token(current_user: dict = Depends(get_current_user)):
    return {"valid": True}


# Returns the current users profile decoded from the JWT
# Used for letting frontend use the logged in users info without making another call to google
@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")
    google_id = current_user.get("google_id")

    query = supabase.table("users").select(
        "google_id, email, email_verified, display_name, first_name, last_name, profile_picture, share_goals, share_results, share_other, share_all"
    )

    if email:
        user = query.eq("email", email).execute()
    elif google_id:
        user = query.eq("google_id", google_id).execute()
    else:
        raise HTTPException(status_code=404, detail="User does not exist")

    if not user.data:
        raise HTTPException(status_code=404, detail="User does not exist")

    return user.data[0]


# Search for a user by email (used by friend search)
@app.get("/api/users/search")
def search_user(email: str, current_user: dict = Depends(get_current_user)):
    if email == current_user.get("email"):
        raise HTTPException(
            status_code=400, detail="You can't add yourself as a friend")

    result = supabase.table("users").select(
        "id, display_name, email, profile_picture"
    ).eq("email", email).execute()

    if not result.data:
        raise HTTPException(
            status_code=404, detail="No user found with that email")

    found_user = result.data[0]

    # check if already friends or pending friend request exists
    current_email = current_user.get("email")
    me = supabase.table("users").select("id").eq(
        "email", current_email).execute()

    if me.data:
        my_id = me.data[0]["id"]
        their_id = found_user["id"]

        # check both directions (i sent them a request, or they sent me one)
        sent = supabase.table("friendships").select("status").eq(
            "user1_id", my_id).eq("user2_id", their_id).execute()
        received = supabase.table("friendships").select("status").eq(
            "user1_id", their_id).eq("user2_id", my_id).execute()

        if sent.data:
            found_user["friendship_status"] = sent.data[0]["status"]
        elif received.data:
            found_user["friendship_status"] = received.data[0]["status"]
        else:
            found_user["friendship_status"] = None

    return found_user


# Non-SSO signup and login logic

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

# Registration


@app.post("/api/auth/signup")
def regular_signup(body: SignupRequest):
    # Limiting registration to only umass students
    if not body.email.endswith("@umass.edu"):
        raise HTTPException(
            status_code=403, detail="Must use a @umass.edu email")

    existing = supabase.table("users").select(
        "*").eq("email", body.email).execute()
    # Throw error if already registered with this email
    if existing.data:
        raise HTTPException(
            status_code=409, detail="Already registered with this email")

    hashed_pw = bcrypt.hashpw(body.password.encode("utf-8"), bcrypt.gensalt())

    name = body.name.split()

    new_user = supabase.table("users").insert({
        "email": body.email,
        "first_name": name[0],
        "last_name": name[-1],
        "hashed_pw": hashed_pw.decode("utf-8"),
    }).execute()

    user_id = new_user.data[0]["id"]

    # Creating a semester
    now = datetime.now()
    if now.month <= 6:
        semester_name = f"Spring {now.year}"
        semester_start = datetime(now.year, 1, 25)
        semester_end = datetime(now.year, 5, 31)
    else:
        semester_name = f"Fall {now.year}"
        semester_start = datetime(now.year, 9, 1)
        semester_end = datetime(now.year, 12, 31)

    semester = supabase.table("semesters").insert({
        "user_id": user_id,
        "name": semester_name,
        "start_date": semester_start.isoformat(),
        "end_date": semester_end.isoformat(),
        "created_at": now.isoformat()
    }).execute()

    semester_id = semester.data[0]["id"]

    token = jwt.encode(
        {
            "email": body.email,
            "first_name": name[0],
            "last_name": name[-1],
            "exp": datetime.now(timezone.utc) + timedelta(hours=8),
        },
        JWT_SECRET,
        algorithm="HS256",
    )

    return {"token": token, "user_id": user_id, "semester_id": semester_id}


class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/api/auth/login")
def regular_login(body: LoginRequest):
    existing = supabase.table("users").select(
        "*").eq("email", body.email).execute()
    if not existing.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = existing.data[0]

    if not bcrypt.checkpw(body.password.encode('utf-8'), user["hashed_pw"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Incorrect email/password")

    token = jwt.encode(
        {
            "email":           user["email"],
            "first_name":      user["first_name"],
            "last_name":       user["last_name"],
            "exp": datetime.now(timezone.utc) + timedelta(hours=8),
        },
        JWT_SECRET,
        algorithm="HS256",
    )

    semester = supabase.table('semesters').select(
        'id').eq('user_id', user['id']).execute()
    if semester.data:
        semester_id = semester.data[0]['id']
    else:
        semester_id = None

    return {"token": token, "email": user["email"], 'semester_id': semester_id}



# Creating a new task
class TaskRequest(BaseModel):
    category_id: str
    title: str
    description: Union[str, None]
    due_date: Union[str, None]
    start_time: Union[str, None]
    end_time: Union[str, None]
    is_recurring: bool = False
    recurrence_days: list[int] = []

@app.post("/api/tasks")
def create_task(body: TaskRequest, current_user: dict = Depends(get_current_user)):
    logger.debug(body)
    email = current_user.get("email")

    user = supabase.table("users").select("id").eq("email", email).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User does not exist")

    user_id = user.data[0]["id"]

    # if recurring, create a separate task for each selected day
    if body.is_recurring and body.recurrence_days:
        base_date = datetime.fromisoformat(body.due_date) if body.due_date else datetime.now()
        base_day_of_week = base_date.weekday()  # Monday=0, Sunday=6

        # convert our day format (0=Sun) to Python's (0=Mon)
        def to_python_weekday(day):
            return (day - 1) % 7  # 0=Sun->6, 1=Mon->0, 2=Tue->1, etc.

        created_tasks = []
        for day in body.recurrence_days:
            python_day = to_python_weekday(day)
            # calculate the offset from the base date's day of week
            day_offset = python_day - base_day_of_week
            target_date = base_date + timedelta(days=day_offset)

            # adjust start_time and end_time to the target date
            task_due = target_date.strftime("%Y-%m-%dT23:59:00")
            task_start = None
            task_end = None

            if body.start_time:
                start_parsed = datetime.fromisoformat(body.start_time)
                task_start = target_date.strftime(f"%Y-%m-%dT{start_parsed.strftime('%H:%M:%S')}")

            if body.end_time:
                end_parsed = datetime.fromisoformat(body.end_time)
                task_end = target_date.strftime(f"%Y-%m-%dT{end_parsed.strftime('%H:%M:%S')}")

            task = supabase.table("tasks").insert({
                "user_id": user_id,
                "category_id": body.category_id,
                "title": body.title,
                "description": body.description,
                "due_date": task_due,
                "start_time": task_start,
                "end_time": task_end,
                "status": "incomplete",
                "is_recurring": True,
            }).execute()

            created_tasks.append(task.data[0])

        return created_tasks

    # non-recurring: create a single task
    task = supabase.table("tasks").insert({
        "user_id": user_id,
        "category_id": body.category_id,
        "title": body.title,
        "description": body.description,
        "due_date": body.due_date,
        "start_time": body.start_time if body.start_time != "" else None,
        "end_time": body.end_time if body.end_time != "" else None,
        "status": "incomplete",
        "is_recurring": False,
    }).execute()

    return task.data[0]


# deleting a task, also deletes the recurrence days if it's a recurring task
@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    user = supabase.table("users").select("id").eq("email", email).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User does not exist")

    user_id = user.data[0]["id"]

    # make sure the task belongs to this user
    task = supabase.table("tasks").select("id").eq("id", task_id).eq("user_id", user_id).execute()
    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")

    # delete recurrence days first, then the task
    supabase.table("recurrence_days").delete().eq("task_id", task_id).execute()
    supabase.table("tasks").delete().eq("id", task_id).execute()

    return {"deleted": True}

class UpdateTaskRequest(BaseModel):
    id: str
    category_id: str
    title: str
    description: Union[str, None]
    due_date: Union[str, None]
    start_time: Union[str, None]
    end_time: Union[str, None]
    is_recurring: bool = False
    status: str

@app.patch("/api/update-task")
def set_task(body: UpdateTaskRequest, current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    user = supabase.table("users").select("id").eq("email", email).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User does not exist")
    
    user_id = user.data[0]["id"]
    
    task_update = body.model_dump()
    if body.status == "complete":
        task_update["completed_at"] = datetime.now(timezone.utc).isoformat()
    else:
        task_update["completed_at"] = None

    task = (
        supabase.table("tasks")
        .update(task_update)
        .eq("id", body.id)
        .eq("user_id", user_id)
    ).execute()

    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")

    return task.data[0]
    



# ONBOARDING logic: (Step1-5)

# step 1: emoji profile picture
class PFPRequest(BaseModel):
    pfp: str


@app.patch("/api/users/pfp")
def set_pfp(body: PFPRequest, current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    existing = supabase.table("users").update({
        "profile_picture": body.pfp,
    }).eq("email", email).execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="User does not exist")

# steps 2 and 3: creating categories


@app.post("/api/categories")
def make_categories(body: Categories, current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    user = supabase.table("users").select("id").eq("email", email).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User does not exist")

    user_id = user.data[0]["id"]

    rows = []
    for category in body.categories:
        rows.append({"user_id": user_id, "semester_id": body.semester_id,
                    "name": category.name, "color": category.color, "priority": category.priority})

    result = supabase.table("categories").insert(rows).execute()
    return {'created': result.data}

# step 4: send friend requests


class FriendRequestRequest(BaseModel):
    friends: list[str]


@app.post("/api/friends/requests")
def make_friends(body: FriendRequestRequest, current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    user1 = supabase.table("users").select("id").eq("email", email).execute()
    if not user1.data:
        raise HTTPException(status_code=404, detail="User does not exist")

    user1_id = user1.data[0]["id"]

    requests = {"sent": [], "not_found": [], 'pending': []}

    for friend in body.friends:
        user2 = supabase.table("users").select(
            "id").eq("email", friend).execute()

        if not user2.data:
            user2 = supabase.table("users").select(
                "id").eq("display_name", friend).execute()

        if not user2.data:
            requests["not_found"].append(friend)
            continue

        user2_id = user2.data[0]["id"]

        # Check for existing pending requests
        existing = supabase.table('friendships').select('id').eq(
            'user1_id', user1_id).eq('user2_id', user2_id).eq('status', 0).execute()

        if existing.data:
            requests['pending'].append(friend)
            continue

        # 0 for pending, 1 for accepted, 2 for rejected
        supabase.table("friendships").insert({
            "user1_id": user1_id,
            "user2_id": user2_id,
            "status": 0,
        }).execute()

        requests["sent"].append(friend)

    # To see which requests were successfully sent vs which couldn't send
    return requests


class FriendshipStatusChangeRequest(BaseModel):
    friend_user_id: str
    new_status: int

@app.patch("/api/friends/change-status")
def accept_friend_request(body: FriendshipStatusChangeRequest, current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    user = supabase.table("users").select("id").eq("email", email).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User does not exist")
    
    user_id = user.data[0]["id"]

    res = (
        supabase.table("friendships")
        .update({"status": body.new_status})
        .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
        .or_(f"user1_id.eq.{body.friend_user_id},user2_id.eq.{body.friend_user_id}")
    ).execute()

    return res




# step 5: setting privacy settings
class PrivacyRequest(BaseModel):
    share_goals: bool
    share_results: bool
    share_other: bool
    share_all: bool


@app.patch("/api/users/privacy")
def set_privacy(body: PrivacyRequest, current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    existing = supabase.table("users").update({
        "share_goals": body.share_goals,
        "share_results": body.share_results,
        "share_other": body.share_other,
        "share_all": body.share_all,
    }).eq("email", email).execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="User does not exist")

# Logic for populating homepage from existing user data


class HomepageDataRequest(BaseModel):
    categories: list[Category]
    tasks: list[Task]
    myFriends: list[FriendStub]
    incomingFriendRequests: list[FriendStub]


def parse_optional_datetime(value):
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value
    if not isinstance(value, str):
        return None

    normalized_value = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized_value)
    except ValueError:
        return None


def completed_at_for_summary(task):
    completed_at = parse_optional_datetime(task.get("completed_at"))
    if completed_at is not None:
        return completed_at

    if task.get("status") == "complete":
        return parse_optional_datetime(task.get("created_at"))

    return None


def build_friend_activity_summary(friend, friend_tasks, friend_categories):
    share_results = friend["share_all"] or friend["share_results"]
    share_goals = friend["share_all"] or friend["share_goals"]
    share_other = friend["share_all"] or friend["share_other"]

    if not (share_results or share_goals or share_other):
        return None

    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=today.weekday())
    summary = {}

    completed_tasks = [
        (task, completed_at_for_summary(task))
        for task in friend_tasks
        if task.get("status") == "complete"
    ]
    completed_tasks = [
        (task, completed_at)
        for task, completed_at in completed_tasks
        if completed_at is not None
    ]

    if share_results:
        completed_dates = [completed_at.date() for _, completed_at in completed_tasks]
        summary["completed_today"] = sum(1 for date in completed_dates if date == today)
        summary["completed_this_week"] = sum(
            1 for date in completed_dates if week_start <= date <= today
        )

        completed_date_set = set(completed_dates)
        streak_days = 0
        streak_date = today
        while streak_date in completed_date_set:
            streak_days += 1
            streak_date -= timedelta(days=1)
        summary["streak_days"] = streak_days

        if completed_tasks:
            summary["last_completed_at"] = max(
                completed_at for _, completed_at in completed_tasks
            )

    incomplete_tasks = [
        task for task in friend_tasks if task.get("status") != "complete"
    ]

    if share_goals:
        upcoming_tasks = [
            task
            for task in incomplete_tasks
            if parse_optional_datetime(task.get("due_date")) is not None
        ]
        upcoming_tasks.sort(key=lambda task: parse_optional_datetime(task.get("due_date")))

        summary["upcoming_count"] = len(incomplete_tasks)
        if upcoming_tasks:
            summary["next_due_title"] = upcoming_tasks[0].get("title")

        category_names_by_id = {
            category["id"]: category["name"] for category in friend_categories
        }
        category_counts = Counter(
            task.get("category_id")
            for task in incomplete_tasks
            if task.get("category_id") in category_names_by_id
        )
        if category_counts:
            top_category_id = category_counts.most_common(1)[0][0]
            summary["top_category"] = category_names_by_id[top_category_id]

    if share_other and not (share_results or share_goals):
        summary["recently_active"] = len(completed_tasks) > 0 or len(incomplete_tasks) > 0

    return FriendActivitySummary(**summary)


@app.get("/api/homepage", response_model=HomepageDataRequest)
def get_homepage_data(current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    user = supabase.table("users").select("id").eq("email", email).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User does not exist")
    else:
        user_id = user.data[0]["id"]

    raw_categories = (
        supabase.table("categories")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    ).data

    raw_tasks = (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    ).data

    # to do: package recurring days with tasks and send with get req
    raw_recurring_days = []
    if raw_tasks:
        raw_recurring_days = (
            supabase.table("recurrence_days")
            .select("*")
            .in_("task_id", [task["id"] for task in raw_tasks])
            .execute()
        ).data

    # aggregate recurring day objects in to a single hash table by task id
    recurring_days = dict()
    for day in raw_recurring_days:
        if day["task_id"] in recurring_days:
            recurring_days[day["task_id"]].append(day["day_of_week"])
        else:
            recurring_days[day["task_id"]] = [day["day_of_week"]]

    raw_friendships = (
        supabase.table("friendships")
        .select("*")
        .or_(f"user1_id.eq.{user_id},user2_id.eq.{user_id}")
        .execute()
    ).data

    # converting the raw friendship table rows in to a list of user ids

    my_accepted_friendships = [
        fs for fs in raw_friendships if fs["status"] == 1]
    my_friend_ids = [fs["user2_id"] if (
        fs["user1_id"] == user_id) else fs["user1_id"] for fs in my_accepted_friendships]

    my_pending_friendships = [
        fs for fs in raw_friendships if fs["status"] == 0]
    my_friend_req_ids = [fs["user2_id"] if (
        fs["user1_id"] == user_id) else fs["user1_id"] for fs in my_pending_friendships]

    my_friends = []
    if my_friend_ids:
        my_friends = (
            supabase.table("users")
            .select("*")
            .in_("id", my_friend_ids)
            .execute()
        ).data

    my_friend_requests = []
    if my_friend_req_ids:
        my_friend_requests = (
            supabase.table("users")
            .select("*")
            .in_("id", my_friend_req_ids)
            .execute()
        ).data

    friend_tasks = []
    friend_categories = []
    if my_friend_ids:
        friend_tasks = (
            supabase.table("tasks")
            .select("*")
            .in_("user_id", my_friend_ids)
            .execute()
        ).data

        friend_categories = (
            supabase.table("categories")
            .select("*")
            .in_("user_id", my_friend_ids)
            .execute()
        ).data

    friend_tasks_by_user_id = {
        friend_id: [] for friend_id in my_friend_ids
    }
    for task in friend_tasks:
        friend_tasks_by_user_id.setdefault(task["user_id"], []).append(task)

    friend_categories_by_user_id = {
        friend_id: [] for friend_id in my_friend_ids
    }
    for category in friend_categories:
        friend_categories_by_user_id.setdefault(category["user_id"], []).append(category)

    # put the raw data in to an object

    categories = [
        Category(
            id=cat["id"],
            name=cat["name"], 
            color=cat["color"], 
            priority=cat["priority"]
        )
        for cat in raw_categories
    ]

    tasks = [
        Task(
            id=task["id"],
            category_id=task["category_id"],
            title=task["title"],
            description=task["description"],
            due_date=parse_optional_datetime(task["due_date"]),
            start_time=parse_optional_datetime(task["start_time"]),
            end_time=parse_optional_datetime(task["end_time"]),
            # not null, "complete" or "incomplete" exclusively
            status=task["status"],
            is_recurring=task["is_recurring"],
            created_at=parse_optional_datetime(task["created_at"]),
            completed_at=parse_optional_datetime(task.get("completed_at")),
            recurring_days=recurring_days.get(task["id"], []) if task["is_recurring"] else []
        )
        for task in raw_tasks
    ]

    myFriends = [
        FriendStub(
            id=friend["id"],
            email=friend["email"],
            profile_picture=friend["profile_picture"],
            full_name=f"{friend["first_name"]} {friend["last_name"]}",
            display_name=friend["display_name"],
            share_goals=friend["share_goals"],
            share_results=friend["share_results"],
            share_other=friend["share_other"],
            share_all=friend["share_all"],
            activity_summary=build_friend_activity_summary(
                friend,
                friend_tasks_by_user_id.get(friend["id"], []),
                friend_categories_by_user_id.get(friend["id"], []),
            ),
        )
        for friend in my_friends
    ]

    incomingFriendRequests = [
        FriendStub(
            id=friend["id"],
            email=friend["email"],
            profile_picture=friend["profile_picture"],
            full_name=f"{friend["first_name"]} {friend["last_name"]}",
            display_name=friend["display_name"],
            share_goals=friend["share_goals"],
            share_results=friend["share_results"],
            share_other=friend["share_other"],
            share_all=friend["share_all"],
        )
        for friend in my_friend_requests
    ]

    homepage_data = HomepageDataRequest(
        categories=categories,
        tasks=tasks,
        myFriends=myFriends,
        incomingFriendRequests=incomingFriendRequests
    )

    logger.debug(f"Debug: homepage data {homepage_data.model_dump_json()} ")

    return homepage_data
