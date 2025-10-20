# Sistema de Hotspot Unifi Avançado

Sistema completo para gerenciamento de hotspots Unifi com recursos avançados de autenticação e personalização.

## Recursos Principais

- 🎨 Design personalizável do portal cativo
- 🔒 Múltiplos métodos de autenticação:
  - AD/LDAP
  - Vouchers
  - Autenticação por email
  - Redes sociais (em breve)
- 📊 Painel administrativo
- 📈 Sistema de campanhas publicitárias
- 📱 Design responsivo

## Requisitos

- Docker e Docker Compose
- Controladora Unifi
- Acesso root/sudo no servidor

## Instalação

1. Clone o repositório
2. Configure as variáveis de ambiente no arquivo `.env`
3. Execute `docker-compose up -d`

## Estrutura do Projeto

- `docker/` - Arquivos de configuração do Docker
- `web/` - Aplicação web do portal cativo
- `api/` - API de gerenciamento
- `nginx/` - Configurações do servidor web
- `db/` - Scripts de banco de dados
