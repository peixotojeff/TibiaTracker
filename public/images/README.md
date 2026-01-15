# Imagens de Background

Este diretório contém as imagens de background para as páginas do Tibia Tracker.

## Imagens Necessárias

### 1. bg-adventure.png
- **Dimensões recomendadas**: 1920x1080 ou maior
- **Formato**: PNG com suporte a transparência
- **Usado em**: 
  - Página de Login
  - Página de Ajuda
  - Página de Personagens

**Descrição**: Imagem de tema medieval/aventura com castelos

### 2. bg-dungeon.png
- **Dimensões recomendadas**: 1920x1080 ou maior
- **Formato**: PNG com suporte a transparência
- **Usado em**: 
  - Dashboard (Personagens)
  - Página de Estatísticas
  - Página de Detalhes do Personagem

**Descrição**: Imagem de tema de dungeon/monstros

## Como adicionar as imagens

1. Salve ambas as imagens neste diretório (`public/images/`)
2. As imagens serão automaticamente carregadas pelas páginas
3. Certifique-se de usar os nomes exatos:
   - `bg-adventure.png`
   - `bg-dungeon.png`

## Notas Importantes

- As imagens têm um overlay escuro (85-90% de opacidade) para garantir que o texto seja legível
- O `background-attachment: fixed` cria um efeito de parallax
- As imagens são otimizadas para cobrir toda a viewport

## Otimização

Para melhor performance:
- Use imagens comprimidas (máximo 500KB cada)
- Considere usar WebP em vez de PNG para navegadores modernos
- As imagens devem ser responsivas
