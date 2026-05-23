from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta
from typing import Optional, List
import uuid
import asyncio
import json

from app.config import settings
from app.database import get_db
from app.models import User, Product, Order, OrderItem, DeliveryTracking
from app.schemas import (
    UserCreate, UserResponse, TokenResponse, ProductResponse, OrderCreate, OrderResponse,
    ProductCreate, ProductUpdate, OTPRequest, OTPVerify, AdminAnalyticsResponse
)
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.websocket import manager
from app.tracking import simulate_delivery

# In-memory session store for Phone OTP verification codes
# format: phone (str) -> otp (str)
otp_store = {}

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


# --- MODULE 2: PASSWORDLESS PHONE OTP AUTHENTICATION ---
import random

@app.post("/auth/otp/send", tags=["Authentication"])
async def send_otp(otp_req: OTPRequest):
    """
    Generate and send a 4-digit verification code to the customer's mobile number.
    Completely FREE: The OTP code is returned directly in the response so the PWA client 
    can auto-fill it, and is also printed to the server terminal console.
    """
    phone = otp_req.phone.strip()
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is required."
        )
        
    # Generate random 4-digit OTP
    otp = str(random.randint(1000, 9999))
    otp_store[phone] = otp
    
    print(f"\n[MOCK SMS GATEWAY] Generated OTP code '{otp}' for mobile '{phone}'")
    
    return {
        "message": "OTP verification code sent successfully (Simulated).",
        "otp": otp  # Exposed in API response to maintain 100% free sandbox testing!
    }


@app.post("/auth/otp/verify", response_model=TokenResponse, tags=["Authentication"])
async def verify_otp(otp_ver: OTPVerify, db: AsyncSession = Depends(get_db)):
    """
    Verify OTP code and authenticate user. 
    Frictionless: If this is a new customer, we dynamically create their user profile on the fly!
    """
    phone = otp_ver.phone.strip()
    otp = otp_ver.otp.strip()
    
    # Allow master bypass OTP '1234' for frictionless developer testing!
    if otp != "1234" and (phone not in otp_store or otp_store[phone] != otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification OTP code."
        )
        
    # Remove verified code
    if phone in otp_store:
        del otp_store[phone]
        
    # Check if user already exists
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalars().first()
    
    # Dynamically register user if they do not exist
    if not user:
        # Determine if this phone number belongs to the administrator
        is_admin = (phone == "+919988776655")
        
        full_name = otp_ver.full_name.strip() if otp_ver.full_name else "Bakery Patron"
        
        user = User(
            phone=phone,
            full_name=full_name,
            is_admin=is_admin,
            email=None
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print(f"Auth Service: Dynamically registered new patron: {user.full_name} | Admin: {user.is_admin}")
        
    # Generate Access Token
    access_token = create_access_token(data={"sub": user.phone})
    
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
        payment_method=order_in.payment_method,
        payment_status=order_in.payment_status,
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
    
    # 4.5. Trigger background real-time rider simulation task
    asyncio.create_task(
        simulate_delivery(
            order_id=new_order.id,
            start_lat=settings.BAKERY_LAT,
            start_lng=settings.BAKERY_LNG,
            end_lat=order_in.destination_lat,
            end_lng=order_in.destination_lng
        )
    )
    
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


@app.websocket("/ws/track/{order_id}")
async def websocket_endpoint(websocket: WebSocket, order_id: str):
    """
    WebSocket endpoint for real-time order delivery tracking.
    Enables mobile frontend to subscribe and receive instant GPS coordinate streams.
    """
    await manager.connect(order_id, websocket)
    try:
        while True:
            # Keep socket alive and respond to any heartbeat pings
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"type": "pong", "message": "alive"}))
    except WebSocketDisconnect:
        manager.disconnect(order_id, websocket)
    except Exception as e:
        print(f"WebSocket tracking error: {e}")
        manager.disconnect(order_id, websocket)


# --- UPGRADES: ADMIN ANALYTICS & INVENTORY CRUD ROUTERS ---
from sqlalchemy import func

@app.get("/admin/analytics", response_model=AdminAnalyticsResponse, tags=["Admin"])
async def get_admin_analytics(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve real-time bakery storefront analytics and sales metrics.
    Restricted to Admin accounts only.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator permissions required."
        )
        
    # 1. Calculate Total Revenue & Total Orders
    revenue_query = select(func.sum(Order.total_price)).where(Order.status != "cancelled")
    orders_query = select(func.count(Order.id))
    customers_query = select(func.count(User.id))
    
    revenue_res = await db.execute(revenue_query)
    orders_res = await db.execute(orders_query)
    customers_res = await db.execute(customers_query)
    
    total_revenue = float(revenue_res.scalar() or 0.0)
    total_orders = int(orders_res.scalar() or 0)
    unique_customers = int(customers_res.scalar() or 0)
    
    # 2. Get Top-Selling Products grouped by volume
    sales_query = (
        select(
            OrderItem.product_id,
            Product.name,
            Product.category,
            func.sum(OrderItem.quantity).label("quantity_sold"),
            func.sum(OrderItem.price * OrderItem.quantity).label("revenue")
        )
        .join(Product, OrderItem.product_id == Product.id)
        .group_by(OrderItem.product_id, Product.name, Product.category)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    )
    
    sales_res = await db.execute(sales_query)
    sales_rows = sales_res.all()
    
    top_selling_products = []
    for row in sales_rows:
        top_selling_products.append({
            "product_id": row.product_id,
            "name": row.name,
            "category": row.category,
            "quantity_sold": int(row.quantity_sold or 0),
            "revenue": float(row.revenue or 0.0)
        })
        
    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "unique_customers": unique_customers,
        "top_selling_products": top_selling_products
    }


@app.post("/admin/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, tags=["Admin"])
async def create_product(
    prod_in: ProductCreate, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new bakery product SKU in the store catalog.
    Restricted to Admin accounts only.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator permissions required."
        )
        
    new_product = Product(
        name=prod_in.name,
        description=prod_in.description,
        price=prod_in.price,
        image_url=prod_in.image_url,
        category=prod_in.category,
        is_available=prod_in.is_available
    )
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    return new_product


@app.put("/admin/products/{product_id}", response_model=ProductResponse, tags=["Admin"])
async def update_product(
    product_id: uuid.UUID,
    prod_in: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update details (pricing, availability, details) of an existing product in the catalog.
    Restricted to Admin accounts only.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator permissions required."
        )
        
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product SKU not found."
        )
        
    # Update fields dynamically
    update_data = prod_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
        
    await db.commit()
    await db.refresh(product)
    
    return product


@app.delete("/admin/products/{product_id}", tags=["Admin"])
async def delete_product(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a product SKU from the store catalog.
    Restricted to Admin accounts only.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator permissions required."
        )
        
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product SKU not found."
        )
        
    await db.delete(product)
    await db.commit()
    
    return {"message": f"Successfully deleted product '{product.name}'."}




