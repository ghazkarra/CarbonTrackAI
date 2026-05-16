from app.models import Base
from app.config import settings
import sys
from pathlib import Path
from logging.config import fileConfig

from sqlalchemy import create_engine, text, pool
from alembic import context

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))


# Alembic Config object
config = context.config

# Setup logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate
target_metadata = Base.metadata


def get_url() -> str:
    """Return database URL, ensuring pymysql driver is specified."""
    url = settings.DATABASE_URL
    # Ensure we're using pymysql driver
    if url.startswith("mysql://"):
        url = url.replace("mysql://", "mysql+pymysql://", 1)
    return url


def run_migrations_offline() -> None:
    """Run migrations in offline mode (no DB connection needed)."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in online mode."""
    connectable = create_engine(
        get_url(),
        poolclass=pool.NullPool,
        connect_args={"charset": "utf8mb4"},
    )

    with connectable.connect() as connection:
        # Fix for MySQL 8.0 bug where information_schema returns
        # lowercase column names, causing KeyError: 'TABLENAME'
        # in SQLAlchemy's FK reflection code.
        connection.execute(text("SET SESSION group_concat_max_len = 1024000"))

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            include_schemas=False,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
