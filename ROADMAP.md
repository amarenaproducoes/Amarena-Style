# Roadmap do Projeto - Fase 2: Integração Melhor Envio

Este documento detalha os requisitos técnicos e o plano de implementação para a integração com a plataforma **Melhor Envio** para cálculo automático de frete.

## 📋 Visão Geral
A integração permitirá que o cliente insira seu CEP no carrinho e receba cotações de frete de diversas transportadoras (Correios, Jadlog, etc.) em tempo real.

## 🛠️ Detalhes Técnicos

### 1. Autenticação
- **Protocolo:** OAuth2 ou Bearer Token (dependendo do tipo de app no Melhor Envio).
- **Ambiente:** Sandbox para testes e Produção para uso real.
- **Segurança:** As chaves de API **NÃO** devem ficar no frontend. É necessário configurar um proxy no backend (Node.js/Express) para realizar as chamadas.

### 2. Dados Necessários dos Produtos
Para o cálculo, cada produto precisará de novos campos no cadastro:
- **Peso** (kg)
- **Altura** (cm)
- **Largura** (cm)
- **Comprimento** (cm)

### 3. Endpoints Principais
- **Cotação de Frete:** `POST /api/v2/me/shipment/calculate`
  - Requer: CEP de origem (fixo na loja), CEP de destino (digitado pelo cliente) e lista de produtos com suas dimensões/quantidades.
- **Listagem de Agências (opcional):** Para transportadoras que entregam em pontos de coleta.

### 4. Fluxo de Implementação (Fase 2)
1.  **Backend (Proxy):** Criar rota `/api/frete` que recebe o CEP de destino e retorna as opções de frete formatadas.
2.  **Frontend (Carrinho):** Adicionar campo de CEP via `lucide-react` (ícone de caminhão/localização).
3.  **Cálculo:** Implementar debounce ao digitar o CEP para evitar excesso de requisições.
4.  **Seleção:** Permitir que o cliente escolha a transportadora preferida.
5.  **WhatsApp:** Incluir o valor do frete e a transportadora escolhida na mensagem final enviada ao vendedor.

## 🚀 Próximas Etapas
- Obter Credenciais (Client ID e Client Secret) no portal do desenvolvedor do Melhor Envio.
- Configurar o CEP de origem nas configurações administrativas do site.
