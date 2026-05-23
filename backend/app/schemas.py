from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
import uuid

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: uuid.UUID
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


# --- PRODUCT SCHEMAS ---
class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    price: float
    image_url: str
    category: str
    is_available: bool

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

class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    total_price: float
    delivery_address: str
    destination_lat: float
    destination_lng: float
    created_at: datetime
    items: List[OrderItemResponse]
    tracking: Optional[DeliveryTrackingResponse] = None

    class Config:
        from_attributes = True
