#!/bin/sh
set -e

# Create secrets directory
mkdir -p /secrets/config

# Generate the config.yaml dynamically
cat <<EOF > /secrets/config/config.yaml
# This is a template yaml for the aptos-indexer-processor.
health_check_port: 8788
server_config:
  processor_config:
    type: "contract_processor"
  transaction_stream_config:
    indexer_grpc_data_service_address: "https://grpc.testnet.aptoslabs.com:443"
    # At which tx version to start indexing
    starting_version: ${STARTING_VERSION:-6851197314}
    # Go to https://developers.aptoslabs.com/ to create a project and get an API token
    auth_token: "aptoslabs_UuvvQQjBfQJ_F8pNuQ4zfLADqnAhwj8dTV8JQs99xgjJY"
    request_name_header: ""
  db_config:
    # Do not include ?sslmode=require
    postgres_connection_string: "${DATABASE_URL:-postgresql://username:password@neon_host/db_name}"
    db_pool_size: 25
  contract_config:
    contract_address: "${CONTRACT_ADDRESS:-0x83a96247ab57ca2b4cac6934ec351e0a44b62dfe9220d4eec5a122715aeeb02f}"
EOF

# Run the Rust binary
exec ./indexer -c /secrets/config/config.yaml
