# Calculadora PREVENT - TribeMD

Calculadora oficial das equações PREVENT do American Heart Association para predição de risco cardiovascular. Este projeto é construído com [Vite](https://vite.dev), React + TypeScript e configurado com TailwindCSS v4 e ShadCN UI.

## Começando

Primeiro, execute o servidor de desenvolvimento:

```bash
bun dev
```

Abra [http://localhost:5173](http://localhost:5173) no seu navegador para ver o resultado.

Você pode começar a editar a página modificando `src/App.tsx`. A página atualiza automaticamente conforme você edita o arquivo.

## Sobre a Calculadora PREVENT

A Calculadora PREVENT implementa as equações oficiais do American Heart Association para predição de risco cardiovascular, incluindo:

- **Risco CVD Total**: Doença cardiovascular total em 10 e 30 anos
- **Risco ASCVD**: Doença cardiovascular aterosclerótica em 10 e 30 anos  
- **Risco de Insuficiência Cardíaca**: Predição em 10 e 30 anos
- **Dois Modelos**: Modelo base e modelo completo com biomarcadores adicionais

### Recursos Principais

- Interface responsiva e acessível
- Validação de dados em tempo real
- Visualizações interativas dos resultados
- Exportação de relatórios em PDF
- Conformidade com diretrizes AHA/SBC

## Project Configuration

### Package Management

This project uses [Bun](https://bun.sh/) as the package manager:

- Install dependencies: `bun add <package-name>`
- Run scripts: `bun <script-name>`
- Manage dev dependencies: `bun add -d <package-name>`

### Theme Customization

The project uses Tailwind CSS V4 with a theme defined in:

- `src/index.css` - For CSS variables including colors in OKLCH format and custom theming
- Tailwind V4 uses the new `@theme` directive for configuration

### ShadCN UI Components

This project uses [ShadCN UI](https://ui.shadcn.com) for styled components. The components are incorporated directly into the codebase (not as dependencies), making them fully customizable. All components have been installed:

- accordion
- alert-dialog
- alert
- aspect-ratio
- avatar
- badge
- breadcrumb
- button
- calendar
- card
- carousel
- chart
- checkbox
- collapsible
- command
- context-menu
- dialog
- drawer
- dropdown-menu
- form
- hover-card
- input-otp
- input
- label
- menubar
- navigation-menu
- pagination
- popover
- progress
- radio-group
- scroll-area
- select
- separator
- sheet
- skeleton
- slider
- sonner
- switch
- table
- tabs
- textarea
- toast
- toggle-group
- toggle

### Icon Library

[Lucide React](https://lucide.dev/) is the preferred icon library for this project, as specified in components.json. Always use Lucide icons to maintain consistency:

```tsx
import { ArrowRight } from "lucide-react";

// Use in components
<Button>
  <span>Click me</span>
  <ArrowRight />
</Button>;
```

### Font Configuration

This project uses Google Fonts with:

- Inter (sans-serif)
- Playfair Display (serif)

The font is imported via Google Fonts CDN in `src/index.css` and configured in the Tailwind theme:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap");

@theme inline {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Playfair Display", ui-serif, Georgia, serif;
}
```

To change or update fonts:

1. Update the Google Fonts import in `src/index.css`
2. Modify the `--font-sans` variable in the `@theme` directive

## Build and Deploy

Build the project:

```bash
bun run build
```

Preview the production build:

```bash
bun run preview
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.
