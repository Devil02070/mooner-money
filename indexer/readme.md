## Commands

# Generate migration
```sh
diesel migration generate <migration_name> --migration-dir src/db_migrations/migrations 
```
diesel migration generate tasks --migration-dir src/db_migrations/migrations 
# Run migration
```sh
diesel migration run \
  --config-file="src/db_migrations/diesel.toml" \
  --database-url="postgres://postgres:postgres@localhost:7377/meow_fun"
```

# Revert last migration
```sh
diesel migration revert \
  --config-file="src/db_migrations/diesel.toml" \
  --database-url="postgres://postgres:postgres@localhost:7377/meow_fun"
```

# Run with cargo
```sh
cargo run --release -- -c config.yaml
```

# Run with docker
```sh
docker build --platform linux/amd64 -t indexer .
```

```sh
docker run -p 5050:5050 -it indexer
```

```sh
docker build --platform linux/amd64 -f indexer/Dockerfile -t indexer indexer/
```

