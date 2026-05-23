from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    """
    Manages active WebSocket connections grouped by Order ID.
    Enables targeted real-time broadcasting to specific customers.
    """
    def __init__(self):
        # Maps order_id (str) -> list of WebSocket connections watching that order
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, order_id: str, websocket: WebSocket):
        """Accept a connection and register it under the specific Order ID."""
        await websocket.accept()
        if order_id not in self.active_connections:
            self.active_connections[order_id] = []
        self.active_connections[order_id].append(websocket)
        print(f"WebSocket: Client connected to track order {order_id}. Total listeners: {len(self.active_connections[order_id])}")

    def disconnect(self, order_id: str, websocket: WebSocket):
        """Remove a connection from the Order ID list."""
        if order_id in self.active_connections:
            self.active_connections[order_id].remove(websocket)
            if not self.active_connections[order_id]:
                del self.active_connections[order_id]
            print(f"WebSocket: Client disconnected from order {order_id}.")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a direct JSON message to a single connection."""
        await websocket.send_text(json.dumps(message))

    async def broadcast_to_order(self, order_id: str, message: dict):
        """Broadcast a JSON message to all clients listening to a specific Order ID."""
        if order_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[order_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    print(f"WebSocket Error: Failed to send to connection, marking for cleanup. Error: {e}")
                    dead_connections.append(connection)
            
            # Clean up any disconnected sockets that threw exceptions
            for dead in dead_connections:
                self.disconnect(order_id, dead)

# Global connection manager instance
manager = ConnectionManager()
