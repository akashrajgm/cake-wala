from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: str
    phone: str = Field(..., description="Mobile phone number is mandatory for passwordless OTP auth")

class UserCreate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: uuid.UUID
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Passwordless OTP Schemas
class OTPRequest(BaseModel):
    phone: str = Field(..., description="Phone number to send OTP to")

class OTPVerify(BaseModel):
    phone: str = Field(..., description="Phone number being verified")
    otp: str = Field(..., description="4-digit OTP code")
    full_name: Optional[str] = Field(None, description="Provided for dynamic profile creation if user is new")


# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    name: str = Field(..., min_length=2)
    description: str = Field(..., min_length=10)
    price: float = Field(..., gt=0)
    image_url: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2)
    is_available: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    is_available: Optional[bool] = None

class ProductResponse(ProductBase):
    id: uuid.UUID

    class Config:
        from_attributes = True


# --- ORDER ITEM SCHEMAS ---
class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(gt=0, description="Quantity must be at least 1")

class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product: ProductResponse
    quantity: int
    price: float

    class Config:
        from_attributes = True


# --- DELIVERY TRACKING SCHEMAS ---
class DeliveryTrackingResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    current_lat: float
    current_lng: float
    eta_minutes: int
    driver_name: str
    updated_at: datetime

    class Config:
        from_attributes = True


# --- ORDER SCHEMAS ---
class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(min_length=1, description="Order must contain at least one item")
    delivery_address: str = Field(min_length=5, description="Full delivery address is required")
    destination_lat: float = Field(..., description="Destination latitude is required")
    destination_lng: float = Field(..., description="Destination longitude is required")
    payment_method: str = Field("COD", description="COD or UPI")
    payment_status: str = Field("pending", description="pending or completed")

class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    total_price: float
    payment_method: str
    payment_status: str
    delivery_address: str
    destination_lat: float
    destination_lng: float
    created_at: datetime
    items: List[OrderItemResponse]
    tracking: Optional[DeliveryTrackingResponse] = None

    class Config:
        from_attributes = True


# --- ADMIN ANALYTICS SCHEMAS ---
class DynamicProductSales(BaseModel):
    product_id: uuid.UUID
    name: str
    category: str
    quantity_sold: int
    revenue: float

class AdminAnalyticsResponse(BaseModel):
    total_revenue: float
    total_orders: int
    unique_customers: int
    top_selling_products: List[DynamicProductSales]
