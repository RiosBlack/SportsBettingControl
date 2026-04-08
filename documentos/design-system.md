# 🎨 Design System - RiosBlack Sports Betting Control

Este documento detalha as fundações visuais, componentes e padrões de interface utilizados no sistema. O objetivo é garantir consistência visual e facilitar a manutenção e evolução da UI.

## 🛠️ Tech Stack de Design
- **Framework**: Tailwind CSS.
- **Componentes**: Shadcn UI (Radix UI).
- **Ícones**: Lucide React.
- **Tipografia**: Geist (Sans & Mono).
- **Animações**: Framer Motion (quando aplicável) e Tailwind Animate.

---

## 🌈 Paleta de Cores

O sistema utiliza uma abordagem de cores baseada em variáveis HSL para facilitar o suporte a temas (Dark/Light).

### 🏷️ Cor de Marca (Primary)
A cor principal do sistema é o **Lime 500**, que transmite energia e foco, comum em plataformas de apostas esportivas de alto desempenho.

- **Primary**: `#84cc16` (Lime 500)
- **Foreground**: `#000000` (Preto puro para contraste total sobre o lime)

### 🌑 Modo Escuro (Default)
O sistema é prioritariamente Dark Mode, utilizando uma paleta de neutros baseada em tons de cinza profundos (Zinc).

| Variável | Valor HSL | Descrição |
| :--- | :--- | :--- |
| `--background` | `0 0% 3.9%` | Fundo principal da aplicação |
| `--foreground` | `0 0% 98%` | Cor de texto principal |
| `--card` | `0 0% 3.9%` | Fundo de cartões e containers |
| `--muted-foreground` | `0 0% 63.9%` | Textos secundários e legendas |
| `--accent` | `0 0% 14.9%` | Destaques sutis em hover |
| `--destructive` | `0 62.8% 30.6%` | Cores de erro e ações destrutivas |
| `--border` | `0 0% 14.9%` | Divisores e bordas de inputs |

### ☀️ Modo Claro
| Variável | Valor HSL | Descrição |
| :--- | :--- | :--- |
| `--background` | `0 0% 100%` | Fundo branco puro |
| `--foreground` | `0 0% 3.9%` | Texto preto profundo |
| `--primary` | `0 0% 9%` | Primário em modo claro (Neutro escuro) |
| `--border` | `0 0% 89.8%` | Bordas sutis |

---

## 📖 Tipografia

Utilizamos a família de fontes **Geist**, desenvolvida pela Vercel, por sua excelente legibilidade em interfaces técnicas.

- **Sans (Interface)**: `GeistSans`. Utilizada em botões, menus, formulários e textos corridos.
- **Mono (Dados)**: `GeistMono`. Utilizada para valores numéricos, odds, códigos e dados em tabelas para garantir alinhamento tabular perfeito.

---

## 📏 Sistema de Espaçamento & Bordas

Baseado na escala padrão do Tailwind (4px increment).

- **Border Radius**:
  - `lg`: `0.5rem` (8px) - Padrão para cards e modais.
  - `md`: `0.4rem` (6px) - Botões e inputs.
  - `sm`: `0.25rem` (4px) - Elementos menores.
- **Container**: Largura máxima centralizada de `1400px` com padding de `2rem`.

---

## 🧩 Componentes (Shadcn UI)

O sistema utiliza uma biblioteca robusta de componentes reutilizáveis:

### Navegação
- **Sidebar**: Navegação lateral retrátil com suporte a collapsible groups.
- **Breadcrumbs**: Localização do usuário no fluxo de gestão.
- **Tabs**: Organização de conteúdos em níveis iguais (ex: Gestão de Bancas).

### Feedback
- **Sonner**: Notificações toast ricas em cores (Success, Error).
- **Skeleton**: Placeholders de carregamento para melhor UX percepção.
- **Alert/Dialog**: Modais de confirmação para ações críticas.

### Formulários
- **Match Combobox**: Seleção avançada de jogos com busca.
- **Date Picker**: Seleção de datas integrada com o calendário.
- **Input OTP**: Verificação de segurança de segundo fator.

---

## ✨ Princípios de UI

1. **Hierarchy**: Uso rigoroso de cores `muted-foreground` para diminuir ruído visual em informações secundárias.
2. **Interactive States**: Todos os elementos clicáveis devem ter estados de `hover` e `active` claramente definidos.
3. **Density**: O layout é projetado para ser denso o suficiente para profissionais (Power Users), mas mantendo o respiro necessário para evitar sobrecarga.
4. **Data First**: Em um sistema de apostas, a precisão e clareza dos dados (odds, stakes, profits) são prioridade sobre adornos visuais.
