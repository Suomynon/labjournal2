from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app without a prefix
app = FastAPI(title="Lab Journal API", description="Electronic Lab Journal with Chemical Inventory")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Role and Permission Models
class Permission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "read_chemicals", "write_experiments"
    description: str
    category: str  # e.g., "chemicals", "experiments", "users", "system"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Role(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "admin", "researcher", "lab_manager"
    display_name: str  # e.g., "Administrator", "Senior Researcher"
    description: str
    permissions: List[str] = []  # List of permission names
    is_system: bool = False  # True for predefined roles (admin, researcher, etc.)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RoleCreate(BaseModel):
    name: str
    display_name: str
    description: str
    permissions: List[str] = []

class RoleUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

# User Roles and Permissions
class UserRole(str, Enum):
    ADMIN = "admin"
    RESEARCHER = "researcher"
    STUDENT = "student"
    GUEST = "guest"

ROLE_PERMISSIONS = {
    UserRole.ADMIN: ["read", "write", "delete", "manage_users", "manage_roles"],
    UserRole.RESEARCHER: ["read", "write", "delete"],
    UserRole.STUDENT: ["read", "write"],
    UserRole.GUEST: ["read"]
}

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    hashed_password: str
    role: UserRole = UserRole.GUEST
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.GUEST

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    role: UserRole
    created_at: datetime
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UnitType(str, Enum):
    WEIGHT = "weight"  # grams, kg, mg
    VOLUME = "volume"  # ml, L
    AMOUNT = "amount"  # pieces, units

class Experiment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    date: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None
    procedure: Optional[str] = None  # Text description or reference to procedure guide
    chemicals_used: List[Dict[str, Any]] = []  # [{"chemical_id": "id", "quantity_used": 10, "unit": "ml"}]
    equipment_used: List[str] = []  # List of equipment names/IDs
    observations: Optional[str] = None
    results: Optional[str] = None
    conclusions: Optional[str] = None
    external_links: List[str] = []  # URLs to related resources
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str  # user id

class ExperimentCreate(BaseModel):
    title: str
    date: Optional[datetime] = None
    description: Optional[str] = None
    procedure: Optional[str] = None
    chemicals_used: List[Dict[str, Any]] = []
    equipment_used: List[str] = []
    observations: Optional[str] = None
    results: Optional[str] = None
    conclusions: Optional[str] = None
    external_links: List[str] = []

class ExperimentUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    description: Optional[str] = None
    procedure: Optional[str] = None
    chemicals_used: Optional[List[Dict[str, Any]]] = None
    equipment_used: Optional[List[str]] = None
    observations: Optional[str] = None
    results: Optional[str] = None
    conclusions: Optional[str] = None
    external_links: Optional[List[str]] = None

class Chemical(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    quantity: float
    unit: str  # g, kg, mg, ml, L, pieces, etc.
    unit_type: UnitType
    location: str
    safety_data: Optional[str] = None
    expiration_date: Optional[datetime] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None
    low_stock_alert: bool = False
    low_stock_threshold: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str  # user id

class ChemicalCreate(BaseModel):
    name: str
    quantity: float
    unit: str
    unit_type: UnitType
    location: str
    safety_data: Optional[str] = None
    expiration_date: Optional[datetime] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None
    low_stock_alert: bool = False
    low_stock_threshold: Optional[float] = None

class ChemicalUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_type: Optional[UnitType] = None
    location: Optional[str] = None
    safety_data: Optional[str] = None
    expiration_date: Optional[datetime] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None
    low_stock_alert: Optional[bool] = None
    low_stock_threshold: Optional[float] = None

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

def check_permission(required_permission: str):
    async def permission_dependency(current_user: User = Depends(get_current_user)):
        user_permissions = ROLE_PERMISSIONS.get(current_user.role, [])
        if required_permission not in user_permissions:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return permission_dependency

# Authentication Routes
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user with guest role by default
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        role=UserRole.GUEST  # Always guest for self-registration
    )
    
    await db.users.insert_one(user.dict())
    return UserResponse(**user.dict())

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if not user["is_active"]:
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_response = UserResponse(**user)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

# User management endpoints for admin
@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    current_user: User = Depends(check_permission("manage_users"))
):
    query = {}
    
    if search:
        query["email"] = {"$regex": search, "$options": "i"}
    
    if role:
        query["role"] = role
    
    users = await db.users.find(query).skip(skip).limit(limit).to_list(1000)
    return [UserResponse(**user) for user in users]

@api_router.post("/admin/users", response_model=UserResponse)
async def create_user_by_admin(
    user_data: UserCreate,
    current_user: User = Depends(check_permission("manage_users"))
):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )
    
    await db.users.insert_one(user.dict())
    return UserResponse(**user.dict())

@api_router.get("/admin/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: User = Depends(check_permission("manage_users"))
):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

@api_router.put("/admin/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    update_data: dict,
    current_user: User = Depends(check_permission("manage_users"))
):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-modification of critical fields
    if current_user.id == user_id:
        if "role" in update_data and update_data["role"] != current_user.role:
            raise HTTPException(status_code=400, detail="Cannot change your own role")
        if "is_active" in update_data and not update_data["is_active"]:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    
    # Validate role if provided
    if "role" in update_data:
        try:
            UserRole(update_data["role"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
    
    # Hash password if provided
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data["password"])
        del update_data["password"]
    
    # Remove id if present in update data
    update_data.pop("id", None)
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    updated_user = await db.users.find_one({"id": user_id})
    return UserResponse(**updated_user)

@api_router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(check_permission("manage_users"))
):
    # Prevent self-deletion
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

# Chemical Routes
@api_router.post("/chemicals", response_model=Chemical)
async def create_chemical(
    chemical_data: ChemicalCreate,
    current_user: User = Depends(check_permission("write"))
):
    chemical = Chemical(**chemical_data.dict(), created_by=current_user.id)
    await db.chemicals.insert_one(chemical.dict())
    return chemical

@api_router.get("/chemicals", response_model=List[Chemical])
async def get_chemicals(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    location: Optional[str] = None,
    unit_type: Optional[UnitType] = None,
    low_stock_only: bool = False,
    current_user: User = Depends(check_permission("read"))
):
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"supplier": {"$regex": search, "$options": "i"}},
            {"notes": {"$regex": search, "$options": "i"}}
        ]
    
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    if unit_type:
        query["unit_type"] = unit_type
    
    chemicals = await db.chemicals.find(query).skip(skip).limit(limit).to_list(1000)
    result = [Chemical(**chemical) for chemical in chemicals]
    
    if low_stock_only:
        result = [
            chemical for chemical in result
            if chemical.low_stock_alert and chemical.low_stock_threshold
            and chemical.quantity <= chemical.low_stock_threshold
        ]
    
    return result

@api_router.get("/chemicals/{chemical_id}", response_model=Chemical)
async def get_chemical(
    chemical_id: str,
    current_user: User = Depends(check_permission("read"))
):
    chemical = await db.chemicals.find_one({"id": chemical_id})
    if not chemical:
        raise HTTPException(status_code=404, detail="Chemical not found")
    return Chemical(**chemical)

@api_router.put("/chemicals/{chemical_id}", response_model=Chemical)
async def update_chemical(
    chemical_id: str,
    update_data: ChemicalUpdate,
    current_user: User = Depends(check_permission("write"))
):
    chemical = await db.chemicals.find_one({"id": chemical_id})
    if not chemical:
        raise HTTPException(status_code=404, detail="Chemical not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.chemicals.update_one({"id": chemical_id}, {"$set": update_dict})
    updated_chemical = await db.chemicals.find_one({"id": chemical_id})
    return Chemical(**updated_chemical)

@api_router.delete("/chemicals/{chemical_id}")
async def delete_chemical(
    chemical_id: str,
    current_user: User = Depends(check_permission("delete"))
):
    result = await db.chemicals.delete_one({"id": chemical_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chemical not found")
    return {"message": "Chemical deleted successfully"}

# Experiment Routes
@api_router.post("/experiments", response_model=Experiment)
async def create_experiment(
    experiment_data: ExperimentCreate,
    current_user: User = Depends(check_permission("write"))
):
    experiment_dict = experiment_data.dict()
    experiment_dict["created_by"] = current_user.id
    
    # Set date if not provided
    if not experiment_dict.get("date"):
        experiment_dict["date"] = datetime.utcnow()
    
    experiment = Experiment(**experiment_dict)
    await db.experiments.insert_one(experiment.dict())
    return experiment

@api_router.get("/experiments", response_model=List[Experiment])
async def get_experiments(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    created_by: Optional[str] = None,
    current_user: User = Depends(check_permission("read"))
):
    query = {}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"procedure": {"$regex": search, "$options": "i"}},
            {"observations": {"$regex": search, "$options": "i"}},
            {"results": {"$regex": search, "$options": "i"}}
        ]
    
    if date_from or date_to:
        date_query = {}
        if date_from:
            date_query["$gte"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        if date_to:
            date_query["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        query["date"] = date_query
    
    if created_by:
        query["created_by"] = created_by
    
    experiments = await db.experiments.find(query).sort("date", -1).skip(skip).limit(limit).to_list(1000)
    return [Experiment(**experiment) for experiment in experiments]

@api_router.get("/experiments/{experiment_id}", response_model=Experiment)
async def get_experiment(
    experiment_id: str,
    current_user: User = Depends(check_permission("read"))
):
    experiment = await db.experiments.find_one({"id": experiment_id})
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return Experiment(**experiment)

@api_router.put("/experiments/{experiment_id}", response_model=Experiment)
async def update_experiment(
    experiment_id: str,
    update_data: ExperimentUpdate,
    current_user: User = Depends(check_permission("write"))
):
    experiment = await db.experiments.find_one({"id": experiment_id})
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    # Check if user owns this experiment or is admin
    if current_user.role != UserRole.ADMIN and experiment["created_by"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own experiments")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.experiments.update_one({"id": experiment_id}, {"$set": update_dict})
    updated_experiment = await db.experiments.find_one({"id": experiment_id})
    return Experiment(**updated_experiment)

@api_router.delete("/experiments/{experiment_id}")
async def delete_experiment(
    experiment_id: str,
    current_user: User = Depends(check_permission("delete"))
):
    experiment = await db.experiments.find_one({"id": experiment_id})
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    # Check if user owns this experiment or is admin
    if current_user.role != UserRole.ADMIN and experiment["created_by"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own experiments")
    
    result = await db.experiments.delete_one({"id": experiment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return {"message": "Experiment deleted successfully"}

# Get chemicals for experiment creation (with current stock)
@api_router.get("/experiments/chemicals/available")
async def get_available_chemicals_for_experiment(
    current_user: User = Depends(check_permission("read"))
):
    chemicals = await db.chemicals.find({}).to_list(1000)
    return [{"id": chem["id"], "name": chem["name"], "quantity": chem["quantity"], "unit": chem["unit"]} for chem in chemicals]

# Dashboard stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(check_permission("read"))):
    total_chemicals = await db.chemicals.count_documents({})
    total_experiments = await db.experiments.count_documents({})
    
    # Low stock chemicals
    low_stock_chemicals = []
    chemicals = await db.chemicals.find({"low_stock_alert": True}).to_list(1000)
    for chemical_data in chemicals:
        chemical = Chemical(**chemical_data)
        if chemical.low_stock_threshold and chemical.quantity <= chemical.low_stock_threshold:
            low_stock_chemicals.append(chemical)
    
    # Expiring chemicals (within 30 days)
    thirty_days_from_now = datetime.utcnow() + timedelta(days=30)
    expiring_chemicals = await db.chemicals.find({
        "expiration_date": {"$lte": thirty_days_from_now, "$gte": datetime.utcnow()}
    }).to_list(1000)
    
    # Recent chemicals (added in last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_chemicals = await db.chemicals.count_documents({
        "created_at": {"$gte": seven_days_ago}
    })
    
    # Recent experiments (last 7 days)
    recent_experiments = await db.experiments.count_documents({
        "created_at": {"$gte": seven_days_ago}
    })
    
    # User's recent experiments (last 5)
    user_recent_experiments = await db.experiments.find({
        "created_by": current_user.id
    }).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_chemicals": total_chemicals,
        "total_experiments": total_experiments,
        "low_stock_count": len(low_stock_chemicals),
        "expiring_soon_count": len(expiring_chemicals),
        "recent_chemicals": recent_chemicals,
        "recent_experiments": recent_experiments,
        "low_stock_chemicals": low_stock_chemicals[:5],  # Top 5
        "expiring_chemicals": [Chemical(**chem) for chem in expiring_chemicals[:5]],  # Top 5
        "user_recent_experiments": [Experiment(**exp) for exp in user_recent_experiments]
    }

# Health check
@api_router.get("/")
async def root():
    return {"message": "Lab Journal API is running", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    # Create default admin user if not exists
    admin_user = await db.users.find_one({"email": "admin@lab.com"})
    if not admin_user:
        default_admin = User(
            email="admin@lab.com",
            hashed_password=hash_password("admin123"),
            role=UserRole.ADMIN
        )
        await db.users.insert_one(default_admin.dict())
        logger.info("Default admin user created: admin@lab.com / admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
