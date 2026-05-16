# config.py
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_NAME = os.getenv("DATABASE_NAME", "emissions_db")
DATABASE_USER = os.getenv("DATABASE_USER", "root")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD", "")
DATABASE_HOST = os.getenv("DATABASE_HOST", "localhost")
DATABASE_PORT = os.getenv("DATABASE_PORT", "3306")
DATABASE_URL = f"mysql+pymysql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"


class Settings:
    EMISSION_fACTOR = 0.85
    DATABASE_URL = DATABASE_URL
    API_TITLE = "Industrial Emissions API"
    API_VERSION = "1.0.0"


settings = Settings()
