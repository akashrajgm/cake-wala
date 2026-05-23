from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta
from typing import Optional, List
import uuid

from app.config import settings
from app.database import get_db
from app.models import User, Product, Order, OrderItem, DeliveryTracking
from app.schemas import UserCreate, UserResponse, UserLogin, TokenResponse, ProductResponse, OrderCreate, OrderResponse
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

# Initialize high-performance FastAPI server
app = FastAPI(
    title="Cake-Wala Bakery API",
    description="Scalable Backend API for Cake-Wala Bakery Store ordering and real-time delivery tracking.",
    version="1.0.0"
)

# Configure CORS Middleware
# Essential to allow our Vite frontend (usually http://localhost:5173) to securely communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact domains for strict security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["General"])
async def root():
    return {
        "app": settings.BAKERY_NAME,
        "status": "Online",
        "description": "Premium Bakery Store API with real-time tracking.",
        "coordinates": {"lat": settings.BAKERY_LAT, "lng": settings.BAKERY_LNG}
    }


# --- MODULE 2: AUTHENTICATION ROUTERS ---

@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new customer.
    Checks for email uniqueness, hashes the password, and creates a user profile in PostgreSQL.
    """
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
        
    # Check phone number uniqueness if provided
    if user_in.phone:
        result = await db.execute(select(User).where(User.phone == user_in.phone))
        existing_phone = result.scalars().first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this phone number already exists."
            )
            
    # Hash password and save user
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        phone=user_in.phone,
        full_name=user_in.full_name,
        hashed_password=hashed_pwd
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


@app.post("/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user and issue secure JWT access token (JSON Payload workflow).
    """
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalars().first()
    
    if not user or not user.hashed_password or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    # Generate Access Token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@app.post("/auth/token", response_model=TokenResponse, tags=["Authentication"], include_in_schema=False)
async def login_oauth_form(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """
    OAuth2 standard password form-urlencoded login.
    Primarily supports FastAPI's built-in Swagger UI authentication button!
    """
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@app.get("/auth/me", response_model=UserResponse, tags=["Authentication"])
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get secure profile details of the currently logged-in user.
    """
    return current_user


# --- MODULE 3: PRODUCT CATALOG ROUTERS ---

@app.get("/products", response_model=list[ProductResponse], tags=["Catalog"])
async def get_products(category: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """
    Retrieve all products. 
    Supports optional filtering by category (e.g., Cakes, Pastries, Breads, Cookies).
    """
    query = select(Product).where(Product.is_available == True)
    if category:
        query = query.where(Product.category == category)
        
    result = await db.execute(query)
    products = result.scalars().all()
    return products


@app.get("/products/categories", response_model=list[str], tags=["Catalog"])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """
    Get all unique active product categories to build dynamic frontend filters.
    """
    result = await db.execute(select(Product.category).distinct().where(Product.is_available == True))
    categories = result.scalars().all()
    return categories


@app.get("/products/{product_id}", response_model=ProductResponse, tags=["Catalog"])
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Retrieve details of a single product SKU by its UUID.
    """
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product SKU not found."
        )
        
    return product


# --- MODULE 4: ORDER & TRANSACTION ROUTERS ---
from sqlalchemy.orm import selectinload

@app.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Orders"])
async def create_order(
    order_in: OrderCreate, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """
    Place a new bakery order.
    Calculates prices server-side from PostgreSQL to prevent tampering, records transaction logs, 
    and initializes real-time delivery tracking.
    """
    # 1. Fetch products to get accurate prices
    product_ids = [item.product_id for item in order_in.items]
    result = await db.execute(select(Product).where(Product.id.in_(product_ids)))
    products = {p.id: p for p in result.scalars().all()}
    
    # Validate that all requested products exist and are available
    for pid in product_ids:
        if pid not in products:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with ID '{pid}' does not exist."
            )
        if not products[pid].is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{products[pid].name}' is currently sold out."
            )
            
    # 2. Compute total price and create Order ORM model
    total_price = 0.0
    order_items_orm = []
    
    # Create the Order first to get the ID
    new_order = Order(
        user_id=current_user.id,
        status="pending",
        total_price=0.0,  # Will update in a moment
        delivery_address=order_in.delivery_address,
        destination_lat=order_in.destination_lat,
        destination_lng=order_in.destination_lng
    )
    db.add(new_order)
    await db.flush()  # Flushes to get new_order.id
    
    # 3. Create individual Order Items capturing historical prices
    for item in order_in.items:
        prod = products[item.product_id]
        item_price = float(prod.price)
        total_price += item_price * item.quantity
        
        new_item = OrderItem(
            order_id=new_order.id,
            product_id=prod.id,
            quantity=item.quantity,
            price=item_price
        )
        order_items_orm.append(new_item)
        db.add(new_item)
        
    # Update final computed total price
    new_order.total_price = total_price
    
    # 4. Initialize real-time delivery tracking entry
    new_tracking = DeliveryTracking(
        order_id=new_order.id,
        current_lat=settings.BAKERY_LAT,  # Starts at Bakery HQ
        current_lng=settings.BAKERY_LNG,
        eta_minutes=25,                  # Standard initial ETA
        driver_name="Express Rider"
    )
    db.add(new_tracking)
    
    await db.commit()
    
    # 5. Fetch fully loaded order response with relationships using selectinload
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.tracking)
        )
        .where(Order.id == new_order.id)
    )
    order_loaded = result.scalars().first()
    return order_loaded


@app.get("/orders/user/me", response_model=list[OrderResponse], tags=["Orders"])
async def get_my_orders(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Retrieve order history for the currently logged-in user.
    """
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.tracking)
        )
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    return orders


@app.get("/orders/{order_id}", response_model=OrderResponse, tags=["Orders"])
async def get_order_details(
    order_id: uuid.UUID, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve details of a specific order by its UUID.
    Secured: Users can only view their own orders.
    """
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.tracking)
        )
        .where(Order.id == order_id)
    )
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found."
        )
        
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this order."
        )
        
    return order


