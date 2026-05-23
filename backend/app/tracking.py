import asyncio
import uuid
from datetime import datetime
from sqlalchemy import update, select
from app.database import async_session_maker
from app.models import DeliveryTracking, Order
from app.websocket import manager

async def simulate_delivery(
    order_id: uuid.UUID, 
    start_lat: float, 
    start_lng: float, 
    end_lat: float, 
    end_lng: float
):
    """
    Asynchronous background task simulating real-time delivery rider navigation.
    Interpolates GPS coordinates from the Bakery HQ straight to the customer's doorstep.
    Updates the PostgreSQL database and broadcasts coordinates over WebSockets every 2 seconds.
    """
    print(f"Tracking Simulator: Starting background rider simulation for order {order_id}...")
    steps = 15
    
    # Give the kitchen 4 seconds of "preparing" status before dispatching the rider!
    await asyncio.sleep(4)
    
    # Broadcast preparation state
    await manager.broadcast_to_order(
        str(order_id),
        {
            "type": "tracking_update",
            "order_id": str(order_id),
            "current_lat": start_lat,
            "current_lng": start_lng,
            "eta_minutes": 25,
            "status": "preparing"
        }
    )
    
    await asyncio.sleep(3)
    
    # Transition database order status to 'dispatched'
    async with async_session_maker() as session:
        await session.execute(
            update(Order).where(Order.id == order_id).values(status="dispatched")
        )
        await session.commit()
        print(f"Tracking Simulator: Order {order_id} is now DISPATCHED.")

    # 15-step linear interpolation for rider route
    for i in range(1, steps + 1):
        fraction = i / steps
        current_lat = start_lat + (end_lat - start_lat) * fraction
        current_lng = start_lng + (end_lng - start_lng) * fraction
        eta_minutes = max(0, int(25 * (1 - fraction)))
        
        # Determine status
        status = "dispatched" if i < steps else "delivered"
        
        # 1. Update database records using a isolated session context
        async with async_session_maker() as session:
            # Update tracking table coordinates and ETA
            await session.execute(
                update(DeliveryTracking)
                .where(DeliveryTracking.order_id == order_id)
                .values(
                    current_lat=current_lat,
                    current_lng=current_lng,
                    eta_minutes=eta_minutes,
                    updated_at=datetime.utcnow()
                )
            )
            
            # If final step, mark order status as delivered
            if i == steps:
                await session.execute(
                    update(Order).where(Order.id == order_id).values(status="delivered")
                )
                print(f"Tracking Simulator: Order {order_id} has been DELIVERED!")
                
            await session.commit()
            
        # 2. Broadcast coordinates to active WebSockets
        await manager.broadcast_to_order(
            str(order_id),
            {
                "type": "tracking_update",
                "order_id": str(order_id),
                "current_lat": current_lat,
                "current_lng": current_lng,
                "eta_minutes": eta_minutes,
                "status": status,
                "driver_name": "Express Rider"
            }
        )
        
        # Sleep 2 seconds between steps
        await asyncio.sleep(2)
        
    print(f"Tracking Simulator: Background rider simulation for order {order_id} completed successfully.")
