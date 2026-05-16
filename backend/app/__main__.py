from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def main():
    app = FastAPI(title="My API", version="1.0.0")

    # CORS Configuration - Allow React dev server to call API
    origins = [
        "http://localhost:3000",      # Create React App default
        "http://localhost:5173",      # Vite default
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,         # Frontend origins that can call this API
        # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
        allow_methods=["*"],
        allow_headers=["*"],           # Allow all headers
        allow_credentials=True,        # Allow cookies/auth headers if needed
    )

    # Health check endpoint
    @app.get("/health")
    def health_check():
        return {"status": "ok", "message": "Backend is running!"}

    # Example API endpoint
    @app.get("/api/data")
    def get_data():
        return {"data": ["item1", "item2", "item3"]}

    @app.post("/api/data")
    def create_data(item: dict):
        return {"message": "Item created", "item": item}
