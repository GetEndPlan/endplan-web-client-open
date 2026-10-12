#!/bin/sh
set -e

# Default values
# SERVER_NAMES can be comma-separated list of domains (e.g., "localhost,app.example.com")
: "${SERVER_NAMES:=localhost}"
: "${SSL_ENABLED:=false}"
: "${CSP_ENABLE_LEGACY_EVAL:=false}"
: "${CSP_ENABLE_CLOUDFLARE_INSIGHTS:=false}"

# Convert comma-separated domains to space-separated for nginx server_name
NGINX_SERVER_NAMES=$(echo "$SERVER_NAMES" | tr ',' ' ')

# Get the first domain as primary (used for certificate CN)
PRIMARY_DOMAIN=$(echo "$SERVER_NAMES" | cut -d',' -f1)

echo "Starting EndPlan Web Client..."
echo "  Server Names: $SERVER_NAMES"
echo "  Primary Domain: $PRIMARY_DOMAIN"
echo "  SSL Enabled: $SSL_ENABLED"

# CSP script-src policy:
# - Default (strict): allows same-origin scripts + WebAssembly compile only.
# - Legacy fallback: additionally allows unsafe-eval for older browser/runtime compatibility.
CSP_SCRIPT_SRC="'self' 'wasm-unsafe-eval'"
if [ "$CSP_ENABLE_LEGACY_EVAL" = "true" ]; then
    CSP_SCRIPT_SRC="'self' 'wasm-unsafe-eval' 'unsafe-eval'"
fi
if [ "$CSP_ENABLE_CLOUDFLARE_INSIGHTS" = "true" ]; then
    CSP_SCRIPT_SRC_EXTRA=" https://static.cloudflareinsights.com"
    CSP_CONNECT_SRC_EXTRA=" https://cloudflareinsights.com https://*.cloudflareinsights.com"
else
    CSP_SCRIPT_SRC_EXTRA=""
    CSP_CONNECT_SRC_EXTRA=""
fi
echo "  CSP Legacy Eval Enabled: $CSP_ENABLE_LEGACY_EVAL"
echo "  CSP Cloudflare Insights Enabled: $CSP_ENABLE_CLOUDFLARE_INSIGHTS"

# Select the appropriate nginx config template
if [ "$SSL_ENABLED" = "true" ]; then
    TEMPLATE_FILE="/etc/nginx/templates/nginx-ssl.conf.template"
    
    # Create SSL directory if it doesn't exist
    mkdir -p /etc/nginx/ssl
    
    # Check if certificates exist, if not generate self-signed
    if [ ! -f /etc/nginx/ssl/cert.pem ] || [ ! -f /etc/nginx/ssl/key.pem ]; then
        echo "SSL certificates not found, generating self-signed certificates..."
        
        # Check if we can write to the ssl directory
        if touch /etc/nginx/ssl/.write-test 2>/dev/null; then
            rm -f /etc/nginx/ssl/.write-test
            
            # Build SAN (Subject Alternative Names) for all domains
            SAN_LIST=""
            for domain in $(echo "$SERVER_NAMES" | tr ',' ' '); do
                if [ -z "$SAN_LIST" ]; then
                    SAN_LIST="DNS:$domain"
                else
                    SAN_LIST="$SAN_LIST,DNS:$domain"
                fi
            done
            # Always add localhost and 127.0.0.1
            SAN_LIST="$SAN_LIST,DNS:localhost,IP:127.0.0.1"
            
            echo "Generating certificate with SANs: $SAN_LIST"
            
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout /etc/nginx/ssl/key.pem \
                -out /etc/nginx/ssl/cert.pem \
                -subj "/CN=$PRIMARY_DOMAIN/O=EndPlan/C=US" \
                -addext "subjectAltName=$SAN_LIST"
            
            echo "Self-signed certificates generated in /etc/nginx/ssl/"
        else
            echo "ERROR: Cannot write to /etc/nginx/ssl/ - check volume mount permissions"
            echo "Either:"
            echo "  1. Remove :ro from the ssl volume mount in docker-compose"
            echo "  2. Or provide cert.pem and key.pem in the ./ssl/ directory"
            exit 1
        fi
    else
        echo "Using provided SSL certificates."
    fi
else
    TEMPLATE_FILE="/etc/nginx/templates/nginx.conf.template"
fi

# Export for envsubst
export SERVER_NAMES="$NGINX_SERVER_NAMES"
export CSP_SCRIPT_SRC
export CSP_SCRIPT_SRC_EXTRA
export CSP_CONNECT_SRC_EXTRA

# Substitute environment variables in the nginx config
echo "Generating nginx configuration from template..."
envsubst '${SERVER_NAMES} ${CSP_SCRIPT_SRC} ${CSP_SCRIPT_SRC_EXTRA} ${CSP_CONNECT_SRC_EXTRA}' < "$TEMPLATE_FILE" > /etc/nginx/conf.d/default.conf

echo "Nginx configuration generated:"
cat /etc/nginx/conf.d/default.conf

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Start nginx
echo "Starting nginx..."
exec nginx -g "daemon off;"
