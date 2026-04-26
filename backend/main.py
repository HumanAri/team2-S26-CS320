

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
        "google_id, email, email_verified, display_name, first_name, last_name, profile_picture"
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
        raise HTTPException(status_code=400, detail="You can't add yourself as a friend")

    result = supabase.table("users").select(
        "id, display_name, email, profile_picture"
    ).eq("email", email).execute()

    if not result.data:
        raise HTTPException(
            status_code=404, detail="No user found with that email")

    found_user = result.data[0]

    # check if already friends or pending friend request exists
    current_email = current_user.get("email")
    me = supabase.table("users").select("id").eq("email", current_email).execute()

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

    return {"token": token, "email": user["email"]}

# Creating a new task
class TaskRequest(BaseModel):
    category_id: str
    title: str
    description: str = "" 
    due_date: str = None
    start_time: str = None
    end_time: str = None
    is_recurring: bool = False
    recurrence_days: list[int] = []

@app.post("/api/tasks")
def create_task(body: TaskRequest, current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    user = supabase.table("users").select("id").eq("email", email).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User does not exist")

    user_id = user.data[0]["id"]

    task = supabase.table("tasks").insert({
        "user_id": user_id,
        "category_id": body.category_id,
        "title": body.title,
        "description": body.description,
        "due_date": body.due_date,
        "start_time": body.start_time,
        "end_time": body.end_time,
        "status": "incomplete",
        "is_recurring": body.is_recurring,
    }).execute()

    task_id = task.data[0]["id"]

    # if the task is recurring, insert the recurrence days in to the recurrence_days table
    if body.is_recurring and body.recurrence_days:
        rows = []
        for day in body.recurrence_days:
            rows.append({"task_id": task_id, "day_of_week": day})
        supabase.table("recurrence_days").insert(rows).execute()

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

    supabase.table("categories").insert(rows).execute()

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
    categories: dict[str, Category]
    tasks: dict[str, Task]
    myFriends: list[FriendStub]
    incomingFriendRequests: list[FriendStub]

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
    
    my_accepted_friendships = [fs for fs in raw_friendships if fs["status"] == 1]
    my_friend_ids = [fs["user2_id"] if (fs["user1_id"] == user_id) else fs["user1_id"] for fs in my_accepted_friendships]

    my_pending_friendships = [fs for fs in raw_friendships if fs["status"] == 0]
    my_friend_req_ids = [fs["user2_id"] if (fs["user1_id"] == user_id) else fs["user1_id"] for fs in my_pending_friendships]

    my_friends = (
        supabase.table("users")
        .select("*")
        .in_("id", my_friend_ids)
        .execute()
    ).data

    my_friend_requests = (
        supabase.table("users")
        .select("*")
        .in_("id", my_friend_req_ids)
        .execute()
    ).data

    # put the raw data in to an object

    categories = {
        str(cat["id"]): Category(
            name=cat["name"], 
            color=cat["color"], 
            priority=cat["priority"]
        ) 
        for cat in raw_categories
    }

    tasks = {
        str(task["id"]): Task(
            category_id=task["category_id"],
            title=task["title"],
            description=task["description"],
            due_date=datetime.fromisoformat(task["due_date"]) if not task["due_date"] == None else None,
            start_time=datetime.fromisoformat(task["start_time"]) if not task["start_time"] == None else None,
            end_time=datetime.fromisoformat(task["end_time"]) if not task["end_time"] == None else None,
            status=task["status"], # not null, "complete" or "incomplete" exclusively
            is_recurring=task["is_recurring"],
            created_at=datetime.fromisoformat(task["created_at"]) if not task["created_at"] == None else None,
            completed_at=datetime.fromisoformat(task["created_at"]) if not task["created_at"] == None else None,
            recurring_days= recurring_days[task["id"]] if task["is_recurring"] else []
        )
        for task in raw_tasks
    }

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







     
    
    


