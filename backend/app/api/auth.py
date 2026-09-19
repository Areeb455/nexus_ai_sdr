import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.schemas.auth import UserRegister, UserLogin, GoogleAuthRequest, ClerkAuthRequest, Token, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = decode_token(token)
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")
    return user

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 compatible token login for Swagger UI"""
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    
    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/google", response_model=Token)
async def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or register user using Google Identity Services (GIS) ID token.
    Verifies the token cryptographically against Google's tokeninfo endpoint.
    """
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={req.credential}")
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google credential token"
                )
            google_data = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to verify Google token: {str(e)}"
        )

    email = google_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account did not provide an email"
        )
    
    full_name = google_data.get("name") or email.split("@")[0]

    # Find or auto-provision user
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        random_pass = str(uuid.uuid4())
        user = User(
            email=email.lower(),
            hashed_password=get_password_hash(random_pass),
            full_name=full_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))

@router.post("/clerk", response_model=Token)
def clerk_auth(req: ClerkAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or provision user authenticated via Clerk Dev Mode.
    Returns our JWT access token so all subsequent lead and agent requests work seamlessly.
    """
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        random_pass = str(uuid.uuid4())
        user = User(
            email=req.email.lower(),
            hashed_password=get_password_hash(random_pass),
            full_name=req.full_name or req.email.split("@")[0]
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))

@router.post("/dev-login", response_model=Token)
def dev_login(db: Session = Depends(get_db)):
    """
    1-click instant login for local developer mode without entering passwords.
    """
    demo_email = "demo@nexus.ai"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        user = User(
            email=demo_email,
            hashed_password=get_password_hash("password123"),
            full_name="Alex Rivera (Nexus SDR Dev)"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))
