#!/bin/bash

# Script de test du Super Admin
# Usage: bash backend/scripts/test-super-admin.sh

API_URL="http://localhost:5000/api"
ADMIN_USERNAME="${SUPER_ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${SUPER_ADMIN_PASSWORD:-MySecureAdminPassword123!}"

echo "🔐 Test du Super Admin"
echo "===================="
echo ""
echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Username: $ADMIN_USERNAME"
echo ""

# Test de connexion
echo "🔑 Tentative de connexion..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$ADMIN_USERNAME\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

echo ""
echo "📝 Réponse du serveur:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# Vérifier le succès
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✅ Connexion réussie!"
  echo ""
  echo "📊 Informations utilisateur:"
  echo "$RESPONSE" | jq '.user'
else
  echo ""
  echo "❌ Échec de connexion"
  echo ""
  echo "💡 Assurez-vous que:"
  echo "  1. Le serveur est en cours d'exécution (npm run dev)"
  echo "  2. SUPER_ADMIN_USERNAME et SUPER_ADMIN_PASSWORD_HASH sont configurés dans .env"
  echo "  3. Les identifiants sont corrects"
fi
