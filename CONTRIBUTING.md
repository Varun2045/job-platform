# Contributing to Job Monitor Platform

We welcome contributions from the community! By participating in this project, you agree to abide by our Code of Conduct.

## Getting Started

1. **Fork the Repository**: Create your own copy of the repository on GitHub.
2. **Clone the Fork**:
   ```bash
   git clone https://github.com/your-username/job-monitor.git
   cd job-monitor
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Create a Branch**: Use a descriptive name for your branch:
   ```bash
   git checkout -b feature/your-awesome-feature
   ```

## Development and Testing

- Write TypeScript code in `src/`.
- Ensure all tests pass sequentially before submitting a pull request:
  ```bash
  npm run build
  npm test -- --runInBand
  ```
- Make sure code passes linting and formatting:
  ```bash
  npm run lint
  npm run format
  ```

## Pull Request Guidelines

- Keep PRs small and focused on a single issue or feature.
- Update documentation in the `docs/` directory or README if you change APIs or configuration variables.
- Write descriptive commit messages.
- Ensure automated CI pipelines pass.
