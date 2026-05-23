import uuid
from datetime import datetime
from sqlalchemy import String, Numeric, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), unique=True, index=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    orders: Mapped[List["Order"]] = relationship(back_populates="user", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(String(1000))
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    image_url: Mapped[str] = mapped_column(String(512))
    category: Mapped[str] = mapped_column(String(100), index=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    order_items: Mapped[List["OrderItem"]] = relationship(back_populates="product")

class Order(Base):
    __tablename__ = "orders"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)  # pending, preparing, dispatched, delivered, cancelled
    total_price: Mapped[float] = mapped_column(Numeric(10, 2))
    delivery_address: Mapped[str] = mapped_column(String(512))
    destination_lat: Mapped[float] = mapped_column(Float)
    destination_lng: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    tracking: Mapped[Optional["DeliveryTracking"]] = relationship(back_populates="order", uselist=False, cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), index=True)
    quantity: Mapped[int] = mapped_column(default=1)
    price: Mapped[float] = mapped_column(Numeric(10, 2))  # Historical price capture
    
    # Relationships
    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship(back_populates="order_items")

class DeliveryTracking(Base):
    __tablename__ = "delivery_tracking"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), unique=True, index=True)
    current_lat: Mapped[float] = mapped_column(Float)
    current_lng: Mapped[float] = mapped_column(Float)
    eta_minutes: Mapped[int] = mapped_column(default=30)
    driver_name: Mapped[str] = mapped_column(String(100), default="Rider Express")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order: Mapped["Order"] = relationship(back_populates="tracking")
