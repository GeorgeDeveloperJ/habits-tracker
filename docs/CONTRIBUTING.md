# Contributing to the Proactive Habit Tracker

First off, thank you for considering contributing to this project! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

## 🤝 How Can I Contribute?

### Reporting Bugs
If you find a bug, please create an issue on GitHub. Include:
* A clear and descriptive title.
* The exact steps to reproduce the issue.
* The expected behavior vs. the actual behavior.
* Your operating system and browser (if it's a frontend issue).

### Suggesting Enhancements
Have an idea to make the planning engine better? We'd love to hear it. Open an issue and use the **Feature Request** label. Describe the feature, why you need it, and how it should work.

### Pull Requests (Code Contributions)
1.  **Fork the repository** and create your branch from `main`.
2.  **Branch naming convention:** * `feature/add-new-dashboard`
    * `bugfix/fix-prisma-seed`
    * `docs/update-readme`
3.  If you've added code that should be tested, add tests.
4.  Ensure your code passes the existing linters and TypeScript compiler checks.
5.  Issue that pull request!

## 🛠️ Development Guidelines

### The Monorepo Structure
Please ensure you are working in the correct directory (`/backend` or `/frontend`). Do not add global dependencies to the root folder unless strictly necessary for tooling.

### TypeScript Strict Mode
This project embraces strict typing. 
* Avoid using `any`. Define interfaces or types for your data structures.
* Ensure the Prisma client is properly generated (`npx prisma generate`) before pushing code that modifies the database schema.

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard. This helps us generate clear release notes. 
Examples:
* `feat: add dark mode to the daily log modal`
* `fix: resolve timezone issue in cycle creation`
* `chore: update dependencies`

## 💬 Code of Conduct
By participating in this project, you are expected to uphold a welcoming, inclusive, and respectful environment for everyone. Harassment or abusive behavior will not be tolerated.

Thank you for helping us build a better way to track and plan our daily lives!