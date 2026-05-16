from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.routes import test
# Create app instance globally (not inside a function)
app = FastAPI(title="My API", version="1.0.0")

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Health check endpoint


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running!"}


app.include_router(test.router)


@app.get("/api/data")
def get_data():
    return {"data": ["item1", "item2", "item3"]}


@app.post("/api/data")
def create_data(item: dict):
    return {"message": "Item created", "item": item}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
