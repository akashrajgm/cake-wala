import os
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

class Settings:
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///cakewala.db"
    )
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretbakerykey12345!")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for testing convenience
    
    # Bakery Details
    BAKERY_NAME: str = "Cake-Wala HQ"
    BAKERY_LAT: float = 12.97189  # Indiranagar, Bangalore
    BAKERY_LNG: float = 77.64115

settings = Settings()
