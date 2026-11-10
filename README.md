# Landradar

Crie um app React + TypeScript + Tailwind + Shadcn UI + Lucide chamado "US Land OTC Hunter", usando o Supabase integrado deste projeto.

TEMA (dark "trading terminal", dark mode sempre ativo, sem alternancia claro/escuro):
- Adicione a classe "dark" no elemento html e use as cores dark como unico tema.
- background #0B1118, cards/superficies #111A24, bordas #1E2A38
- cor primaria/acao #00D285 (hover um tom mais escuro), texto principal branco, texto secundario #8FA3B8
- NAO usar nenhum tom laranja ou amarelado em lugar nenhum. Para alertas e rejeitado use vermelho #FF4D5E.
- Fontes: Inter para texto geral e JetBrains Mono para numeros e Parcel IDs (Google Fonts).
- Visual denso e compacto, estilo terminal financeiro. Sem gradientes chamativos.
- Configure essas cores como tokens nas CSS variables do shadcn (background, foreground, card, border, primary, muted, muted-foreground, destructive) e no tailwind.config.

AUTH (Supabase Auth, email e senha):
- Tela /login com duas abas: "Entrar" e "Criar conta" (a criar conta e temporaria, vou remover depois).
- Rota "/" protegida: sem sessao redireciona para /login. Com sessao, /login redireciona para "/".
- Botao "Sair" no canto superior direito.
- Mensagens de erro claras.

LAYOUT BASE:
- Navbar fixa no topo com o texto "US LAND OTC HUNTER" e um ponto verde #00D285 pulsando ao lado.
- Area de conteudo abaixo com a mensagem temporaria "Dashboard em construcao".
- Ainda nao implemente tabela, filtros ou metricas.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://landradar.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/998cb29a-5c36-4831-9497-4fa14209e9df).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
