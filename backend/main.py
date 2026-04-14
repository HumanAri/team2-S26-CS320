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
        supabase.table("users").insert({
            "google_id":       google_id,
            "email":           email,
            "email_verified":  info.get("email_verified", False),
            "display_name":    info.get("name"),
            "first_name":      info.get("given_name"),
            "last_name":       info.get("family_name"),
            "profile_picture": info.get("picture"),
        }).execute()

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

    supabase.table("users").insert({
        "email": body.email,
        "first_name": name[0],
        "last_name": name[-1],
        "hashed_pw": hashed_pw.decode("utf-8"),
    }).execute()


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