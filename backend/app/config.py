from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "Karnaugh Map Solver API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

settings = Settings()
