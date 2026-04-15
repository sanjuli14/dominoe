#!/bin/bash

# 🎮 SCRIPT DE CONFIGURACIÓN SUPABASE - LA ESQUINA DOMINÓ

echo "================================================"
echo "⚡ CONFIGURACIÓN RÁPIDA DE SUPABASE"
echo "================================================"
echo ""
echo "1️⃣  Ve a https://app.supabase.com"
echo "2️⃣  Crea un proyecto o inicia sesión"
echo "3️⃣  En Settings → API, copia:"
echo ""
echo "   PROJECT URL:"
echo "   https://abc123xyz456.supabase.co"
echo ""
echo "   ANON PUBLIC KEY:"
echo "   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""
echo "================================================"
echo ""
echo "Ahora edita este archivo:"
echo ""
echo "📁 src/app/config/supabase.config.ts"
echo ""
echo "Y cambia estas líneas:"
echo ""
echo "  this.url = 'https://YOUR-SUPABASE-URL.supabase.co';"
echo "  this.key = 'YOUR-ANON-KEY-HERE';"
echo ""
echo "================================================"
echo ""
read -p "¿Presiona ENTER una vez que hayas configurado las credenciales..."
echo ""

# Compilar
echo "Compilando proyecto..."
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ PROYECTO COMPILADO EXITOSAMENTE"
  echo ""
  echo "Ahora ejecuta:"
  echo "  npm run start"
  echo ""
  echo "Y abre http://localhost:4200"
else
  echo "❌ Error en compilación. Revisa los errores arriba."
fi
