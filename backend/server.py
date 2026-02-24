from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import httpx
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---- HELPERS ----

def generate_id(prefix=""):
    return f"{prefix}{uuid.uuid4().hex[:12]}"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    session_token = None
    if auth_header.startswith("Bearer "):
        session_token = auth_header[7:]
    else:
        session_token = request.cookies.get("session_token")

    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ---- MODELS ----

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str  # client/vendor
    company: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleSessionRequest(BaseModel):
    session_id: str
    role: Optional[str] = "client"

class RFQCreate(BaseModel):
    title: str
    description: str
    energy_type: str
    quantity_mw: float
    delivery_location: str
    start_date: str
    end_date: str
    price_ceiling: Optional[float] = None
    specs: Optional[Dict] = {}
    logistics: Optional[Dict] = {}
    financial_terms: Optional[Dict] = {}
    add_on_services: Optional[List[str]] = []

class RFQStatusUpdate(BaseModel):
    status: str

class BidCreate(BaseModel):
    price_per_unit: float
    quantity_mw: float
    delivery_timeline: str
    specs: Optional[Dict] = {}
    notes: Optional[str] = None

class BidStatusUpdate(BaseModel):
    status: str  # accepted/rejected

class VendorProfileUpdate(BaseModel):
    company_name: str
    description: Optional[str] = None
    energy_types: Optional[List[str]] = []
    capacity_mw: Optional[float] = None
    certifications: Optional[List[str]] = []
    carbon_credits: Optional[float] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    regulatory_docs: Optional[List[str]] = []

class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    verification_status: Optional[str] = None
    is_active: Optional[bool] = None

# ---- AUTH ENDPOINTS ----

@api_router.post("/auth/register")
async def register(data: RegisterRequest, response: Response):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = generate_id("usr_")
    user = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "role": data.role,
        "company": data.company,
        "picture": None,
        "password_hash": hash_password(data.password),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)

    if data.role == "vendor":
        await db.vendor_profiles.insert_one({
            "vendor_id": generate_id("vnd_"),
            "user_id": user_id,
            "company_name": data.company or data.name,
            "description": "",
            "energy_types": [],
            "capacity_mw": 0,
            "certifications": [],
            "regulatory_docs": [],
            "carbon_credits": 0,
            "verification_status": "pending",
            "contact_email": data.email,
            "contact_phone": "",
            "website": "",
            "location": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    session_token = generate_id("sess_")
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/")
    return_user = {k: v for k, v in user.items() if k not in ["_id", "password_hash"]}
    return {"user": return_user, "session_token": session_token}

@api_router.post("/auth/login")
async def login(data: LoginRequest, response: Response):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_token = generate_id("sess_")
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user["user_id"],
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/")
    return_user = {k: v for k, v in user.items() if k not in ["_id", "password_hash"]}
    return {"user": return_user, "session_token": session_token}

@api_router.post("/auth/google/session")
async def google_session(data: GoogleSessionRequest, response: Response):
    async with httpx.AsyncClient() as hclient:
        resp = await hclient.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google session")
        g_data = resp.json()

    email = g_data["email"]
    name = g_data.get("name", email)
    picture = g_data.get("picture")
    session_token = g_data.get("session_token")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = generate_id("usr_")
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": data.role,
            "company": None,
            "picture": picture,
            "password_hash": None,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)

        if data.role == "vendor":
            await db.vendor_profiles.insert_one({
                "vendor_id": generate_id("vnd_"),
                "user_id": user_id,
                "company_name": name,
                "description": "",
                "energy_types": [],
                "capacity_mw": 0,
                "certifications": [],
                "regulatory_docs": [],
                "carbon_credits": 0,
                "verification_status": "pending",
                "contact_email": email,
                "contact_phone": "",
                "website": "",
                "location": "",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    else:
        user_id = user["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"picture": picture, "name": name}})
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})

    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/")
    return_user = {k: v for k, v in user.items() if k not in ["_id", "password_hash"]}
    return {"user": return_user, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {k: v for k, v in user.items() if k not in ["_id", "password_hash"]}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        session_token = auth_header[7:]
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out"}

# ---- RFQ ENDPOINTS ----

@api_router.post("/rfqs")
async def create_rfq(data: RFQCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["client", "admin"]:
        raise HTTPException(status_code=403, detail="Only clients can create RFQs")

    rfq_id = generate_id("rfq_")
    rfq = {
        "rfq_id": rfq_id,
        "client_id": user["user_id"],
        "client_name": user["name"],
        "client_company": user.get("company", ""),
        "title": data.title,
        "description": data.description,
        "energy_type": data.energy_type,
        "quantity_mw": data.quantity_mw,
        "delivery_location": data.delivery_location,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "price_ceiling": data.price_ceiling,
        "specs": data.specs,
        "logistics": data.logistics,
        "financial_terms": data.financial_terms,
        "add_on_services": data.add_on_services,
        "status": "open",
        "bid_count": 0,
        "ai_analysis_summary": None,
        "best_bid_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.rfqs.insert_one(rfq)
    return {k: v for k, v in rfq.items() if k != "_id"}

@api_router.get("/rfqs")
async def list_rfqs(request: Request, status: Optional[str] = None, energy_type: Optional[str] = None):
    user = await get_current_user(request)
    query = {}
    if user["role"] == "client":
        query["client_id"] = user["user_id"]
        if status:
            query["status"] = status
    elif user["role"] == "vendor":
        query["status"] = "open"
    else:  # admin
        if status:
            query["status"] = status
    if energy_type:
        query["energy_type"] = energy_type
    rfqs = await db.rfqs.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return rfqs

@api_router.get("/rfqs/{rfq_id}")
async def get_rfq(rfq_id: str, request: Request):
    user = await get_current_user(request)
    rfq = await db.rfqs.find_one({"rfq_id": rfq_id}, {"_id": 0})
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return rfq

@api_router.patch("/rfqs/{rfq_id}/status")
async def update_rfq_status(rfq_id: str, data: RFQStatusUpdate, request: Request):
    user = await get_current_user(request)
    rfq = await db.rfqs.find_one({"rfq_id": rfq_id}, {"_id": 0})
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if rfq["client_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.rfqs.update_one({"rfq_id": rfq_id}, {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Status updated"}

# ---- BID ENDPOINTS ----

@api_router.post("/rfqs/{rfq_id}/bids")
async def submit_bid(rfq_id: str, data: BidCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can submit bids")
    rfq = await db.rfqs.find_one({"rfq_id": rfq_id}, {"_id": 0})
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if rfq["status"] != "open":
        raise HTTPException(status_code=400, detail="RFQ is not open for bids")
    existing = await db.bids.find_one({"rfq_id": rfq_id, "vendor_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted a bid for this RFQ")

    vendor_profile = await db.vendor_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    bid_id = generate_id("bid_")
    bid = {
        "bid_id": bid_id,
        "rfq_id": rfq_id,
        "vendor_id": user["user_id"],
        "vendor_name": user["name"],
        "vendor_company": vendor_profile.get("company_name", user["name"]) if vendor_profile else user["name"],
        "vendor_location": vendor_profile.get("location", "") if vendor_profile else "",
        "price_per_unit": data.price_per_unit,
        "quantity_mw": data.quantity_mw,
        "delivery_timeline": data.delivery_timeline,
        "specs": data.specs,
        "notes": data.notes,
        "ai_score": None,
        "ai_analysis": None,
        "status": "submitted",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bids.insert_one(bid)
    await db.rfqs.update_one({"rfq_id": rfq_id}, {"$inc": {"bid_count": 1}})
    return {k: v for k, v in bid.items() if k != "_id"}

@api_router.get("/rfqs/{rfq_id}/bids")
async def get_rfq_bids(rfq_id: str, request: Request):
    user = await get_current_user(request)
    rfq = await db.rfqs.find_one({"rfq_id": rfq_id}, {"_id": 0})
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if user["role"] == "vendor":
        bids = await db.bids.find({"rfq_id": rfq_id, "vendor_id": user["user_id"]}, {"_id": 0}).to_list(1)
    else:
        if rfq["client_id"] != user["user_id"] and user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        bids = await db.bids.find({"rfq_id": rfq_id}, {"_id": 0}).sort("ai_score", -1).to_list(200)
    return bids

@api_router.post("/rfqs/{rfq_id}/bids/ai-rank")
async def ai_rank_bids(rfq_id: str, request: Request):
    user = await get_current_user(request)
    rfq = await db.rfqs.find_one({"rfq_id": rfq_id}, {"_id": 0})
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if rfq["client_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    bids = await db.bids.find({"rfq_id": rfq_id}, {"_id": 0}).to_list(200)
    if not bids:
        raise HTTPException(status_code=400, detail="No bids to rank")

    rfq_summary = {
        "title": rfq["title"],
        "energy_type": rfq["energy_type"],
        "quantity_mw": rfq["quantity_mw"],
        "delivery_location": rfq["delivery_location"],
        "price_ceiling": rfq.get("price_ceiling"),
        "start_date": rfq["start_date"],
        "end_date": rfq["end_date"],
        "specs": rfq.get("specs", {}),
        "financial_terms": rfq.get("financial_terms", {})
    }

    bids_summary = [
        {
            "bid_id": b["bid_id"],
            "vendor": b["vendor_company"],
            "price_per_unit": b["price_per_unit"],
            "quantity_mw": b["quantity_mw"],
            "delivery_timeline": b["delivery_timeline"],
            "notes": b.get("notes", ""),
            "specs": b.get("specs", {})
        }
        for b in bids
    ]

    prompt = f"""You are an expert energy procurement analyst for a B2B energy trading platform.

RFQ Requirements:
{json.dumps(rfq_summary, indent=2)}

Vendor Bids Received:
{json.dumps(bids_summary, indent=2)}

Analyze each bid and provide:
1. A score from 0-100 (higher = better match)
2. Key strengths of the bid
3. Gap analysis (what is missing or concerning vs requirements)
4. A short recommendation

Respond ONLY with valid JSON in exactly this format:
{{
  "rankings": [
    {{
      "bid_id": "bid_id_here",
      "score": 85,
      "strengths": ["competitive price", "meets quantity requirement"],
      "gaps": ["delivery timeline is longer than needed"],
      "recommendation": "Strong candidate - competitive pricing and full quantity coverage"
    }}
  ],
  "summary": "Overall market analysis summary in 2-3 sentences",
  "best_bid_id": "bid_id_here"
}}"""

    try:
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            session_id=f"ai_rank_{rfq_id}_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert energy procurement analyst. Always respond with valid JSON only, no markdown."
        ).with_model("gemini", "gemini-2.0-flash")

        response_text = await chat.send_message(UserMessage(text=prompt))

        clean = response_text.strip()
        if "```" in clean:
            start = clean.find("{")
            end = clean.rfind("}") + 1
            clean = clean[start:end]
        ai_result = json.loads(clean)
    except Exception as e:
        logger.error(f"AI ranking error: {e}")
        ai_result = {
            "rankings": [{"bid_id": b["bid_id"], "score": 50, "strengths": [], "gaps": [], "recommendation": "Manual review required"} for b in bids],
            "summary": "AI analysis unavailable. Please review bids manually.",
            "best_bid_id": bids[0]["bid_id"] if bids else None
        }

    for ranking in ai_result.get("rankings", []):
        await db.bids.update_one(
            {"bid_id": ranking["bid_id"]},
            {"$set": {
                "ai_score": ranking.get("score"),
                "ai_analysis": {
                    "strengths": ranking.get("strengths", []),
                    "gaps": ranking.get("gaps", []),
                    "recommendation": ranking.get("recommendation", "")
                }
            }}
        )

    await db.rfqs.update_one(
        {"rfq_id": rfq_id},
        {"$set": {"ai_analysis_summary": ai_result.get("summary"), "best_bid_id": ai_result.get("best_bid_id")}}
    )
    return ai_result

@api_router.patch("/rfqs/{rfq_id}/bids/{bid_id}/status")
async def update_bid_status(rfq_id: str, bid_id: str, data: BidStatusUpdate, request: Request):
    user = await get_current_user(request)
    rfq = await db.rfqs.find_one({"rfq_id": rfq_id}, {"_id": 0})
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if rfq["client_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.bids.update_one({"bid_id": bid_id}, {"$set": {"status": data.status}})
    if data.status == "accepted":
        await db.rfqs.update_one({"rfq_id": rfq_id}, {"$set": {"status": "awarded", "awarded_bid_id": bid_id}})
    return {"message": "Bid status updated"}

# ---- VENDOR PROFILE ----

@api_router.get("/vendor/profile")
async def get_vendor_profile(request: Request):
    user = await get_current_user(request)
    profile = await db.vendor_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@api_router.put("/vendor/profile")
async def update_vendor_profile(data: VendorProfileUpdate, request: Request):
    user = await get_current_user(request)
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can update profiles")
    update_data = data.model_dump(exclude_none=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.vendor_profiles.update_one({"user_id": user["user_id"]}, {"$set": update_data}, upsert=True)
    profile = await db.vendor_profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return profile

@api_router.get("/vendor/bids")
async def get_my_bids(request: Request):
    user = await get_current_user(request)
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can view their bids")
    bids = await db.bids.find({"vendor_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    enriched = []
    for bid in bids:
        rfq = await db.rfqs.find_one({"rfq_id": bid["rfq_id"]}, {"_id": 0, "title": 1, "energy_type": 1, "delivery_location": 1, "status": 1, "quantity_mw": 1})
        enriched.append({**bid, "rfq": rfq})
    return enriched

# ---- ADMIN ENDPOINTS ----

@api_router.get("/admin/users")
async def admin_list_users(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return users

@api_router.patch("/admin/users/{target_user_id}")
async def admin_update_user(target_user_id: str, data: AdminUserUpdate, request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    await db.users.update_one({"user_id": target_user_id}, {"$set": update_data})
    if "verification_status" in update_data:
        await db.vendor_profiles.update_one({"user_id": target_user_id}, {"$set": {"verification_status": update_data["verification_status"]}})
    return {"message": "User updated"}

@api_router.get("/admin/vendors")
async def admin_list_vendors(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    vendors = await db.vendor_profiles.find({}, {"_id": 0}).to_list(500)
    enriched = []
    for v in vendors:
        u = await db.users.find_one({"user_id": v["user_id"]}, {"_id": 0, "email": 1, "name": 1, "is_active": 1, "created_at": 1})
        enriched.append({**v, "user": u})
    return enriched

@api_router.get("/admin/analytics")
async def admin_analytics(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    total_users = await db.users.count_documents({})
    total_clients = await db.users.count_documents({"role": "client"})
    total_vendors = await db.users.count_documents({"role": "vendor"})
    total_rfqs = await db.rfqs.count_documents({})
    open_rfqs = await db.rfqs.count_documents({"status": "open"})
    awarded_rfqs = await db.rfqs.count_documents({"status": "awarded"})
    total_bids = await db.bids.count_documents({})
    pending_vendors = await db.vendor_profiles.count_documents({"verification_status": "pending"})
    verified_vendors = await db.vendor_profiles.count_documents({"verification_status": "verified"})
    return {
        "total_users": total_users,
        "total_clients": total_clients,
        "total_vendors": total_vendors,
        "total_rfqs": total_rfqs,
        "open_rfqs": open_rfqs,
        "awarded_rfqs": awarded_rfqs,
        "total_bids": total_bids,
        "pending_vendors": pending_vendors,
        "verified_vendors": verified_vendors
    }

@api_router.get("/admin/rfqs")
async def admin_list_rfqs(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    rfqs = await db.rfqs.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return rfqs

@api_router.get("/market/insights")
async def market_insights(request: Request):
    """Returns simulated real-time energy market data and carbon credit prices"""
    await get_current_user(request)
    return {
        "energy_prices": [
            {"type": "Solar", "price": 2.85, "change": 0.05, "change_pct": 1.79, "unit": "₹/kWh", "trend": "up"},
            {"type": "Wind", "price": 3.12, "change": -0.08, "change_pct": -2.50, "unit": "₹/kWh", "trend": "down"},
            {"type": "Hydro", "price": 2.45, "change": 0.02, "change_pct": 0.82, "unit": "₹/kWh", "trend": "up"},
            {"type": "Thermal", "price": 4.20, "change": 0.15, "change_pct": 3.70, "unit": "₹/kWh", "trend": "up"},
            {"type": "Green H2", "price": 5.80, "change": -0.22, "change_pct": -3.65, "unit": "₹/kWh", "trend": "down"},
        ],
        "carbon": {
            "ccts_price": 245.50,
            "ccts_change": 12.30,
            "ccts_change_pct": 5.27,
            "unit": "₹/tCO2e",
            "eu_cbam": 68.50,
            "eu_cbam_change": 1.20,
            "eu_cbam_unit": "EUR/tCO2e",
            "india_budget_crore": 20000,
            "trading_scheme": "CCTS"
        },
        "market_stats": {
            "active_rfqs_india": 142,
            "registered_vendors": 523,
            "total_mw_traded": 8540,
            "avg_bid_response_hours": 36,
            "yoy_growth_pct": 34
        },
        "price_history": [
            {"month": "Aug", "solar": 3.10, "wind": 3.35, "carbon": 210},
            {"month": "Sep", "solar": 3.05, "wind": 3.28, "carbon": 218},
            {"month": "Oct", "solar": 2.98, "wind": 3.22, "carbon": 225},
            {"month": "Nov", "solar": 2.92, "wind": 3.18, "carbon": 232},
            {"month": "Dec", "solar": 2.88, "wind": 3.15, "carbon": 238},
            {"month": "Jan", "solar": 2.85, "wind": 3.12, "carbon": 245},
        ]
    }

@api_router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)
    notifs = await db.notifications.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    unread = await db.notifications.count_documents({"user_id": user["user_id"], "read": False})
    return {"notifications": notifs, "unread_count": unread}

@api_router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, request: Request):
    user = await get_current_user(request)
    await db.notifications.update_one({"notif_id": notif_id, "user_id": user["user_id"]}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()
