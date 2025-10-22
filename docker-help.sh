#!/bin/bash

# Script de ajuda para gerenciar o Docker do projeto Sports Betting Control

case "$1" in
  start)
    echo "🚀 Iniciando containers..."
    docker compose up -d
    echo "✅ Containers iniciados!"
    echo "📊 PostgreSQL: localhost:5432"
    echo "🔧 PgAdmin: http://localhost:5050"
    ;;
  stop)
    echo "🛑 Parando containers..."
    docker compose down
    echo "✅ Containers parados!"
    ;;
  restart)
    echo "🔄 Reiniciando containers..."
    docker compose restart
    echo "✅ Containers reiniciados!"
    ;;
  status)
    echo "📊 Status dos containers:"
    docker compose ps
    ;;
  logs)
    echo "📋 Logs do PostgreSQL:"
    docker compose logs -f postgres
    ;;
  clean)
    echo "⚠️  ATENÇÃO: Isso irá remover os containers E os dados!"
    read -p "Tem certeza? (s/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]
    then
      docker compose down -v
      echo "✅ Containers e volumes removidos!"
    else
      echo "❌ Operação cancelada"
    fi
    ;;
  *)
    echo "🎲 Sports Betting Control - Docker Manager"
    echo ""
    echo "Uso: ./docker-help.sh [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start    - Inicia os containers"
    echo "  stop     - Para os containers"
    echo "  restart  - Reinicia os containers"
    echo "  status   - Mostra o status dos containers"
    echo "  logs     - Mostra os logs do PostgreSQL"
    echo "  clean    - Remove containers e volumes (APAGA DADOS!)"
    echo ""
    echo "Exemplos:"
    echo "  ./docker-help.sh start"
    echo "  ./docker-help.sh status"
    echo "  ./docker-help.sh logs"
    ;;
esac

