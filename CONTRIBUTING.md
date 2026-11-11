# Contributing to Room AI Interior Design

Thank you for your interest in contributing! This guide will help you set up your development environment and understand our contribution workflow.

## 🛠️ Puter Worker Setup

This project relies on a Puter Worker to handle server-side logic (KV storage and file hosting). To set up your own for development:

1.  Log in to [Puter.com](https://puter.com).
2.  Open the **App Dashboard**.
3.  Create a new **Worker**.
4.  Copy the code from `lib/puter.worker.js` in this repository into your Puter Worker.
5.  Save and Deploy the worker.
6.  Copy the **Worker URL** and paste it into your `.env` file as `VITE_PUTER_WORKER_URL`.

## 🔄 Contribution Workflow

We follow a standard Fork-and-Pull request workflow.

### 1. Fork & Clone

Fork the repository on GitHub and clone your fork locally:

```bash
git clone https://github.com/lwshakib/room-ai-interior-design.git
cd room-ai-interior-design
```

### 2. Create a Branch

Always create a descriptive branch for your changes:

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/issue-description
```

### 3. Make Changes & Commit

Follow a clean commit history. If you are making changes across multiple files, try to commit them individually with descriptive messages:

```bash
git add path/to/file.tsx
git commit -m "feat: implement new sidebar layout"
```

### 4. Push to Your Fork

```bash
git push origin feat/your-feature-name
```

### 5. Submit a Pull Request

Go to the original repository on GitHub and you should see a prompt to open a Pull Request from your new branch. Provide a clear description of your changes and why they are needed.

## 📝 Commit Convention

We recommend using conventional commits:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation updates
- `style:` for formatting/styling changes
- `chore:` for maintenance tasks

## 🚀 Advanced Git Workflow (Chained Commits)

For rapid development, you can chain your git commands:

```powershell
git add file1.tsx; git commit -m "feat: first change"; git add file2.css; git commit -m "style: second change"; git push
```

> [!TIP]
> We recommend using `pnpm` for managing dependencies and running scripts.

---

Happy coding! 🚀
