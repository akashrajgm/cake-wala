import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.future import select
from app.config import settings
from app.database import Base, async_session_maker
from app.models import Product

# Core product seed list containing 12 premium bakery SKUs
SEEDED_PRODUCTS = [
    # Category: Cakes
    {
        "name": "Belgian Chocolate Truffle Cake",
        "description": "500g of luxurious moist chocolate sponge layered with decadent dark chocolate ganache and premium Belgian chocolate curls. Perfect for dessert lovers.",
        "price": 649.00,
        "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
        "category": "Cakes",
        "is_available": True
    },
    {
        "name": "Royal Red Velvet Cake",
        "description": "500g of velvety, vibrant red cocoa sponge layered with rich, tangy premium vanilla cream cheese frosting. Elegant and visually stunning.",
        "price": 699.00,
        "image_url": "https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=600&auto=format&fit=crop&q=80",
        "category": "Cakes",
        "is_available": True
    },
    {
        "name": "Zesty Lemon Blueberry Cake",
        "description": "500g of bright, tangy lemon cake folded with fresh mountain blueberries, layered with house-made lemon curd and frosted with vanilla bean buttercream.",
        "price": 749.00,
        "image_url": "https://images.unsplash.com/photo-1535141192574-5d4897c13636?w=600&auto=format&fit=crop&q=80",
        "category": "Cakes",
        "is_available": True
    },
    {
        "name": "Caramel Butterscotch Crunch",
        "description": "500g of premium brown sugar sponge with rich, buttery caramel layers, topped with hand-crafted English butterscotch crunch and roasted almond pralines.",
        "price": 599.00,
        "image_url": "https://images.unsplash.com/photo-1588195538326-c5b1e9f8011b?w=600&auto=format&fit=crop&q=80",
        "category": "Cakes",
        "is_available": True
    },
    # Category: Pastries
    {
        "name": "Premium Almond Croissant",
        "description": "Flaky, multi-layered golden butter croissant filled with a sweet, velvety frangipane (almond paste) and generously topped with toasted sliced almonds.",
        "price": 189.00,
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
        "category": "Pastries",
        "is_available": True
    },
    {
        "name": "Pistachio Rose Cruffin",
        "description": "A delightful hybrid of a croissant and muffin, filled to the brim with rich, creamy Persian pistachio and organic rosewater custard, dusted with powdered sugar.",
        "price": 220.00,
        "image_url": "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=600&auto=format&fit=crop&q=80",
        "category": "Pastries",
        "is_available": True
    },
    {
        "name": "Authentic Tiramisu Cup",
        "description": "Espresso-soaked Italian ladyfinger biscuits layered with a luxurious, silky mascarpone cheese sabayon mousse, finished with a heavy dusting of dark cocoa.",
        "price": 249.00,
        "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
        "category": "Pastries",
        "is_available": True
    },
    {
        "name": "Dark Chocolate Raspberry Cupcake",
        "description": "Fluffy, deep dark chocolate cupcake stuffed with a tart wild raspberry coulis center, finished with a rich chocolate fudge icing and fresh raspberry garnish.",
        "price": 120.00,
        "image_url": "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=600&auto=format&fit=crop&q=80",
        "category": "Pastries",
        "is_available": True
    },
    # Category: Breads
    {
        "name": "Rustic Country Sourdough",
        "description": "A classic 36-hour slow-fermented, naturally leavened sourdough bread. Boasts a thick, caramelized blistered crust and a soft, tangy, open-crumb interior.",
        "price": 260.00,
        "image_url": "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&auto=format&fit=crop&q=80",
        "category": "Breads",
        "is_available": True
    },
    {
        "name": "Mediterranean Rosemary Focaccia",
        "description": "Premium extra virgin olive oil-drenched flatbread baked to golden perfection with sea salt flakes, fresh organic rosemary needles, and rich Kalamata olives.",
        "price": 190.00,
        "image_url": "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600&auto=format&fit=crop&q=80",
        "category": "Breads",
        "is_available": True
    },
    # Category: Cookies
    {
        "name": "Sea Salt Chocolate Chip Cookie",
        "description": "A giant, thick, chewy cookie baked with premium Callebaut dark chocolate chunks, finished with a sprinkle of delicate flaky Maldon sea salt.",
        "price": 99.00,
        "image_url": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80",
        "category": "Cookies",
        "is_available": True
    },
    {
        "name": "Signature French Macarons (Box of 6)",
        "description": "An assortment of 6 elegant, delicate French macaron shells filled with gourmet fillings: Salted Caramel, Espresso Ganache, Rose, Pistachio, Lavender Honey, and Raspberry.",
        "price": 399.00,
        "image_url": "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=600&auto=format&fit=crop&q=80",
        "category": "Cookies",
        "is_available": True
    }
]

async def seed_db():
    print(f"Connecting to database: {settings.DATABASE_URL.split('@')[-1]}")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    # Create tables
    print("Initializing schemas and creating tables if they do not exist...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed products
    print("Seeding premium bakery catalog...")
    async with async_session_maker() as session:
        # Check if products already exist
        result = await session.execute(select(Product))
        existing_products = result.scalars().all()
        
        if len(existing_products) > 0:
            print(f"Found {len(existing_products)} existing products. Deleting all to refresh seed...")
            for p in existing_products:
                await session.delete(p)
            await session.commit()
            print("Database catalog cleared.")
            
        # Add products
        for prod_data in SEEDED_PRODUCTS:
            new_prod = Product(**prod_data)
            session.add(new_prod)
            print(f" -> Added product: {new_prod.name} | Category: {new_prod.category}")
            
        await session.commit()
        print("\nSuccessfully seeded 12 premium bakery products into PostgreSQL!")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_db())
