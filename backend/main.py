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

    existing = supabase.table("users").select("*").eq("google_id", google_id).execute()

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

        #Creating a semester
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
        semester = supabase.table("semesters").select("id").eq("user_id", user_id).execute()

        # if the user somehow has no semester, create one
        if not semester.data:
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
    return {
        "google_id":       current_user.get("google_id"),
        "email":           current_user.get("email"),
        "email_verified":  current_user.get("email_verified"),
        "display_name":    current_user.get("display_name"),
        "first_name":      current_user.get("first_name"),
        "last_name":       current_user.get("last_name"),
        "profile_picture": current_user.get("profile_picture"),
    }


# Search for a user by email (used by friend search)
@app.get("/api/users/search")
def search_user(email: str, current_user: dict = Depends(get_current_user)):
    result = supabase.table("users").select(
        "id, display_name, email, profile_picture"
    ).eq("email", email).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="No user found with that email")

    return result.data[0]


#Non-SSO signup and login logic

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

#Registration
@app.post("/api/auth/signup")
def regular_signup(body: SignupRequest):
    # Limiting registration to only umass students
    if not body.email.endswith("@umass.edu"):
        raise HTTPException(
            status_code=403, detail="Must use a @umass.edu email")
    
    existing = supabase.table("users").select("*").eq("email", body.email).execute()
    # Throw error if already registered with this email
    if existing.data:
        raise HTTPException(status_code=409, detail="Already registered with this email")
    
    hashed_pw = bcrypt.hashpw(body.password.encode("utf-8"), bcrypt.gensalt())

    name = body.name.split()

    new_user = supabase.table("users").insert({
        "email": body.email,
        "first_name": name[0],
        "last_name": name[-1],
        "hashed_pw": hashed_pw.decode("utf-8"),
    }).execute()

    user_id = new_user.data[0]["id"]

    #Creating a semester
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
            "exp": datetime.now(timezone.utc)+ timedelta(hours=8),
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
    existing = supabase.table("users").select("*").eq("email", body.email).execute()
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



#ONBOARDING logic: (Step1-5)

#step 1: emoji profile picture
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
    
#steps 2 and 3: creating categories
class Category(BaseModel):
    name: str
    color: str
    priority: int = 1

class Categories(BaseModel):
    categories:list[Category]
    semester_id: str

@app.post("/api/categories")
def make_categories(body: Categories, current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    user = supabase.table("users").select("id").eq("email", email).execute()
    if not user.data:
        raise HTTPException(status_code=404, detail="User does not exist")
    
    user_id = user.data[0]["id"]

    rows = []
    for category in body.categories:
        rows.append({"user_id": user_id, "semester_id": body.semester_id, "name": category.name, "color": category.color, "priority": category.priority})

    supabase.table("categories").insert(rows).execute()

#step 4: send friend requests
class FriendRequestRequest(BaseModel):
    friends: list[str]

@app.post("/api/friends/requests")
def make_friends(body: FriendRequestRequest, current_user: dict = Depends(get_current_user)):
    email = current_user.get("email")

    user1 = supabase.table("users").select("id").eq("email", email).execute()
    if not user1.data:
        raise HTTPException(status_code=404, detail="User does not exist")
    
    user1_id = user1.data[0]["id"]

    requests = {"sent": [], "not_found": []}

    for friend in body.friends:
        user2 = supabase.table("users").select("id").eq("email", friend).execute()

        if not user2.data:
            user2 = supabase.table("users").select("id").eq("display_name", friend).execute()
        
        if not user2.data:
            requests["not_found"].append(friend)
            continue

        user2_id = user2.data[0]["id"]

        #0 for pending, 1 for accepted, 2 for rejected
        supabase.table("friendships").insert({
            "user1_id": user1_id,
            "user2_id": user2_id,
            "status": 0,
        }).execute()

        requests["sent"].append(friend)

    #To see which requests were successfully sent vs which couldn't send
    return requests


#step 5: setting privacy settings
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