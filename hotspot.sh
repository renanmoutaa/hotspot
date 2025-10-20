#!/bin/bash

# Script para gerenciar os serviços do projeto Hotspot Unifi.
# Garante que os comandos sejam executados a partir do diretório do script.

set -e
cd "$(dirname "$0")"

# Função para exibir a ajuda
usage() {
    echo "Uso: $0 {start|stop|logs}"
    echo "  start: Inicia todos os serviços em background."
    echo "  stop:  Para e remove todos os contêineres e redes."
    echo "  logs:  Exibe os logs de todos os serviços."
    exit 1
}

# Verifica o primeiro argumento
case "$1" in
    start)
        echo "🚀 Iniciando todos os serviços do Hotspot..."
        docker-compose up -d
        echo "✅ Serviços iniciados com sucesso! Use './hotspot.sh logs' para ver a saída."
        ;;
    stop)
        echo "🛑 Parando e removendo todos os serviços do Hotspot..."
        docker-compose down
        echo "✅ Serviços parados com sucesso!"
        ;;
    logs)
        echo "📜 Exibindo logs dos serviços... (Pressione Ctrl+C para sair)"
        docker-compose logs -f
        ;;
    *)
        usage
        ;;
esac

exit 0