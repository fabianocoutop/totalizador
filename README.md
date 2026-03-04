# Ticket Metrics ⏱️

**Ticket Metrics** é uma aplicação multiplataforma (Web e Android) desenvolvida para gerenciar, planejar e contabilizar o tempo dedicado a projetos e tickets de suporte/desenvolvimento. Com uma interface moderna, o sistema oferece desde uma agenda interativa com recursos de *Drag & Drop* até a geração de relatórios gráficos de produtividade.

---

## 🔗 Acesso e Testes Live

Experimente a aplicação agora mesmo através da Web ou baixe o APK para o seu Android:
- 🌐 **Web App (Rodando no GitHub Pages):** [Acessar Ticket Metrics Online](https://fabianocoutop.github.io/totalizador/)
- 📱 **Aplicativo Android (.APK):** [Baixar do Google Drive](https://drive.google.com/file/d/1ZoJI_CvYHKPyiE1UoBqTfAC7VJXGVu9Y/view?usp=sharing)

---

## 🚀 Funcionalidades Principais

### 📅 Planejamento Diário (Agenda)
A tela inicial da aplicação funciona como uma agenda interativa estilo Google Calendar.
- **Drag & Drop:** Mova os blocos de eventos verticalmente para reagendar horários instantaneamente (escala magnética de 15 minutos).
- **Cores Customizadas:** Destaque visualmente as suas tarefas com etiquetas de cores.
- **Integração Google Calendar:** Exporte o evento planejado diretamente para o seu Google Calendar com um clique.
- **Conversão Inteligente:** Transforme um planejamento concluído em um registro oficial de horas trabalhadas de forma automática.

### ⏱️ Apontamento de Horas
Registre exatamente quanto tempo você gastou em cada demanda.
- **Múltiplos Intervalos:** Trabalhou de manhã, pausou e voltou à tarde no mesmo ticket? Adicione múltiplos fragmentos de horário no mesmo registro e deixe o sistema calcular o total.
- **Vínculos:** Vincule os apontamentos a **Empresas**, **Projetos** específicos e ao código do **Ticket**.

### 🗂️ Histórico e Filtros
Consulte todo o seu passado laborativo de maneira organizada e rápida.
- **Paginação e Performance:** O histórico é carregado em blocos para não travar o dispositivo, independentemente de quantos mil registros existam.
- **Filtros Avançados:** Filtre por períodos de data, projeto, número do ticket ou status de apontamento (já faturado/cobrado ou não).
- **Exportação JSON:** Exporte a sua lista de horas filtrada para backup ou integrações externas.

### 📊 Relatórios e Gráficos (Dashboard)
Acompanhamento visual da sua produtividade.
- **Métricas Rápidas:** Total de horas do dia de hoje, da semana e do mês ativo.
- **Gráficos em Barra:** Visão das horas trabalhadas nos últimos 7 dias.
- **Top Tickets:** Gráfico listando os 5 tickets que mais consumiram horas no seu período.

### 🗃️ Cadastros Básicos
Gerencie o seu ecossistema de clientes estruturando as **Empresas** e criando **Projetos** atrelados a elas.

---

## 🛠️ Tecnologias Utilizadas

A aplicação foi construída visando máxima portabilidade, rodando puramente no cliente e empacotada para dispositivos móveis:
- **Frontend Core:** HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Estilização & Ícones:** [Bootstrap 5](https://getbootstrap.com/) (Grid/Tipografia) e [Bootstrap Icons](https://icons.getbootstrap.com/).
- **Gráficos:** [Chart.js](https://www.chartjs.org/)
- **Backend as a Service (BaaS):** [Supabase](https://supabase.com/) (PostgreSQL + Autenticação nativa).
- **Mobile (Android/iOS):** [Capacitor JS](https://capacitorjs.com/) responsável por envelopar a experiência web em um `.APK` nativo de altíssima performance.

---

## 📱 Disponibilidade

Desenvolvido para ser Híbrido:
- **Web App / PWA:** Pode ser acessado de qualquer navegador desktop ou mobile.
- **Nativo (Android):** Aplicativo instalável que se beneficia de integrações nativas, sem as barras do navegador, oferecendo uma imersão completa na gestão do tempo.

---

## ⚙️ Notas Técnicas e Compilação Mobile (Desenvolvedores)

Devido ao tráfego do projeto ocorrer em ambientes com sincronização em nuvem (ex: Google Drive), scripts específicos na arquitetura do Capacitor foram configurados no `build.gradle` para erradicar conflitos com arquivos escondidos (`desktop.ini`) gerados pelo Windows que crachavam o compilador `AAPT2` do Android.

### Compilando Modificações
1. Faça sua alteração no ambiente Web (`app.js`, `style.css`, etc).
2. Execute o isolamento do diretório: `npm run build`
3. Sincronize com o diretório nativo: `npx cap sync`
4. Commit/Push para atualizações Web, ou faça o Build do APK no Android Studio para mobile.
