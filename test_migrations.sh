#!/bin/bash

# Test du système de migrations et backup/restore
# Utilisation: bash test_migrations.sh

API_URL="http://localhost:5000/api/database"
BACKUP_NAME=""

echo "🧪 Testing Database Migrations & Backup System"
echo "================================================\n"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4

  echo -e "${YELLOW}Testing: $description${NC}"
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -X GET "$API_URL$endpoint" -H "Content-Type: application/json")
  else
    response=$(curl -s -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -d "$data")
  fi

  success=$(echo $response | grep -c '"success":true')
  
  if [ $success -gt 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}\n"
    echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
    echo ""
  else
    echo -e "${RED}❌ FAIL${NC}\n"
    echo "Response: $response"
    echo ""
  fi
}

# Test 1: Vérifier le statut de la BD
echo -e "\n${YELLOW}=== TEST 1: Database Status ===${NC}"
test_endpoint "GET" "/status" "" "Get database status"

# Test 2: Voir les migrations
echo -e "\n${YELLOW}=== TEST 2: Migrations ===${NC}"
test_endpoint "GET" "/migrations" "" "List migrations"

# Test 3: Créer une sauvegarde
echo -e "\n${YELLOW}=== TEST 3: Create Backup ===${NC}"
test_endpoint "POST" "/backup" "{}" "Create database backup"

# Extraire le nom du backup depuis la réponse
backup_response=$(curl -s -X POST "$API_URL/backup" -H "Content-Type: application/json" -d "{}")
BACKUP_NAME=$(echo $backup_response | jq -r '.data.backupName' 2>/dev/null)

if [ "$BACKUP_NAME" != "null" ] && [ -n "$BACKUP_NAME" ]; then
  echo -e "${GREEN}Backup created: $BACKUP_NAME${NC}\n"
  
  # Test 4: Lister les sauvegardes
  echo -e "\n${YELLOW}=== TEST 4: List Backups ===${NC}"
  test_endpoint "GET" "/backups" "" "List all backups"
  
  # Test 5: Exécuter les migrations en attente
  echo -e "\n${YELLOW}=== TEST 5: Run Pending Migrations ===${NC}"
  test_endpoint "POST" "/migrations/run" "{}" "Run pending migrations"
  
  # Test 6: Voir la nouvelle migration
  echo -e "\n${YELLOW}=== TEST 6: Check Migrations Again ===${NC}"
  test_endpoint "GET" "/migrations" "" "Check migrations after run"
  
  # Test 7: Essayer le rollback
  echo -e "\n${YELLOW}=== TEST 7: Rollback Last Migration ===${NC}"
  test_endpoint "POST" "/migrations/rollback" "{}" "Rollback last migration"
  
  # Test 8: Supprimer le backup
  echo -e "\n${YELLOW}=== TEST 8: Delete Backup ===${NC}"
  test_endpoint "DELETE" "/backups/$BACKUP_NAME" "" "Delete backup"
else
  echo -e "${RED}⚠️  Could not extract backup name, skipping backup tests${NC}\n"
fi

echo -e "\n${GREEN}✨ All tests completed!${NC}"
