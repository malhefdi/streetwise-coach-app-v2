# CI/CD Pipeline Setup Guide

## Overview

This guide will help you set up a complete CI/CD pipeline for the Streetwise Coach application using GitHub Actions.

---

## What Gets Automated

### On Every Push
✅ Code quality checks (ESLint, TypeScript, Prettier)
✅ Unit tests with coverage
✅ Build verification
✅ Security scanning
✅ Bundle size analysis

### On Pull Requests
✅ All CI checks
✅ Preview deployment to Vercel
✅ Automatic PR comments with preview URL

### On Main Branch Push
✅ Full CI pipeline
✅ Production deployment to Vercel
✅ Database migrations to Supabase
✅ Smoke tests
✅ Slack notifications

### Weekly Automated Tasks
✅ Dependency updates
✅ Security vulnerability scanning
✅ Automatic PR creation for updates

---

## Prerequisites

Before setting up CI/CD, you need:

1. **GitHub Repository** - Your code in a GitHub repo
2. **Vercel Account** - For hosting (free tier works)
3. **Supabase Project** - Already set up
4. **Slack Workspace** (Optional) - For notifications

---

## Step-by-Step Setup

### 1. Install Testing Dependencies

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

### 2. Configure Jest

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    collectCoverageFrom: [
        'core/**/*.{js,jsx,ts,tsx}',
        'features/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },
};

module.exports = createJestConfig(customJestConfig);
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom';
```

### 3. Add Test Scripts to package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 4. Set Up Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Link Your Project:**
   ```bash
   vercel link
   ```

3. **Get Vercel Tokens:**
   ```bash
   vercel token create
   ```

4. **Get Project IDs:**
   - Go to Vercel dashboard → Settings
   - Copy your **Project ID**
   - Copy your **Organization ID**

### 5. Configure GitHub Secrets

Go to your GitHub repo → Settings → Secrets and Variables → Actions

Add the following secrets:

#### Required Secrets

| Secret Name | Where to Get It | Purpose |
|-------------|-----------------|---------|
| `VERCEL_TOKEN` | Vercel Settings → Tokens | Deploy to Vercel |
| `VERCEL_ORG_ID` | Vercel Project Settings | Identify organization |
| `VERCEL_PROJECT_ID` | Vercel Project Settings | Identify project |
| `SUPABASE_ACCESS_TOKEN` | Supabase Settings → API | Run migrations |
| `SUPABASE_PROJECT_ID` | Supabase Project URL | Identify project |

#### Optional Secrets

| Secret Name | Where to Get It | Purpose |
|-------------|-----------------|---------|
| `SNYK_TOKEN` | https://snyk.io | Security scanning |
| `SLACK_WEBHOOK` | Slack Integrations | Notifications |
| `CODECOV_TOKEN` | https://codecov.io | Coverage reports |

### 6. Enable GitHub Actions

The workflow files are already in `.github/workflows/`. GitHub will automatically detect and run them.

To verify:
1. Go to your repo → Actions tab
2. You should see the workflows listed
3. Push a commit to trigger them

---

## Workflows Explained

### 1. CI Pipeline (`ci.yml`)

**Triggers:** Every push, every PR

**What it does:**
```
1. Code Quality
   ├─ ESLint check
   ├─ TypeScript check
   └─ Prettier check

2. Tests
   ├─ Unit tests
   └─ Coverage report

3. Build
   └─ Next.js build

4. Security
   ├─ npm audit
   └─ Snyk scan

5. Bundle Size
   └─ Size analysis
```

**Duration:** ~3-5 minutes

### 2. CD Pipeline (`cd.yml`)

**Triggers:** Push to `main` branch, manual trigger

**What it does:**
```
1. Run full CI
   └─ All checks must pass

2. Deploy to Vercel
   └─ Production deployment

3. Database Migrations
   └─ Run Supabase migrations

4. Smoke Tests
   ├─ Check site is accessible
   └─ Check auth endpoint

5. Notifications
   └─ Send Slack message
```

**Duration:** ~5-8 minutes

### 3. PR Preview (`pr-preview.yml`)

**Triggers:** PR opened/updated

**What it does:**
```
1. Run CI checks
2. Deploy preview to Vercel
3. Comment preview URL on PR
```

**Example PR Comment:**
```
🚀 Preview Deployment

Preview URL: https://streetwise-coach-abc123.vercel.app

✅ CI checks passed
📦 Build successful
🔗 Click the link above to preview your changes
```

### 4. Dependency Updates (`dependency-update.yml`)

**Triggers:** Every Monday at 9 AM, manual trigger

**What it does:**
```
1. Update npm dependencies
2. Run tests with new versions
3. Create PR if updates available
4. Run security audit
5. Create issue if vulnerabilities found
```

---

## Testing the Pipeline

### Test CI Pipeline

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "test: trigger CI pipeline"
git push
```

Go to GitHub → Actions → You should see the CI pipeline running

### Test PR Preview

```bash
# Create a new branch
git checkout -b test/pr-preview

# Make a change
echo "console.log('test');" >> app/page.tsx

# Commit and push
git add .
git commit -m "test: PR preview deployment"
git push -u origin test/pr-preview

# Create PR on GitHub
# Check the Actions tab and the PR comments
```

### Test Production Deployment

```bash
# Merge your PR to main
# The CD pipeline will automatically run
```

---

## Monitoring and Maintenance

### View Pipeline Status

**GitHub Actions Badge:**

Add to your README.md:

```markdown
![CI Pipeline](https://github.com/malhefdi/streetwise-coach-app-v2/actions/workflows/ci.yml/badge.svg)
![CD Pipeline](https://github.com/malhefdi/streetwise-coach-app-v2/actions/workflows/cd.yml/badge.svg)
```

### Common Issues and Solutions

#### 1. Build Fails Due to Missing Env Variables

**Error:** `Error: Environment variable NEXT_PUBLIC_SUPABASE_URL is not defined`

**Solution:** Add placeholder values in CI:
```yaml
- name: Create .env.local for build
  run: |
    echo "NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co" >> .env.local
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key" >> .env.local
```

#### 2. Tests Fail on CI but Pass Locally

**Error:** `TypeError: Cannot read property 'foo' of undefined`

**Cause:** Missing mocks or environment differences

**Solution:**
- Check `jest.setup.js` has all necessary mocks
- Ensure Node version matches (use `node-version: '18'` in workflow)

#### 3. Vercel Deployment Fails

**Error:** `Error: Failed to deploy to Vercel`

**Solution:**
1. Verify `VERCEL_TOKEN` is correct
2. Check `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID`
3. Ensure Vercel project is linked correctly

#### 4. Supabase Migration Fails

**Error:** `Error: Migration failed`

**Solution:**
1. Verify `SUPABASE_ACCESS_TOKEN` is valid
2. Check migration file syntax
3. Ensure project ID is correct

---

## Advanced Configuration

### Add Codecov Integration

1. Sign up at https://codecov.io
2. Add your repo
3. Copy the token
4. Add `CODECOV_TOKEN` to GitHub secrets
5. Coverage reports will appear on PRs

### Add Slack Notifications

1. Create a Slack webhook:
   - Go to Slack API → Incoming Webhooks
   - Create webhook for your channel
   - Copy webhook URL

2. Add to GitHub secrets:
   ```
   SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

3. Notifications will be sent on:
   - Deployment success/failure
   - Security vulnerabilities found
   - Dependency updates available

### Add Lighthouse CI

Add to `ci.yml`:

```yaml
lighthouse:
  name: Lighthouse Performance
  runs-on: ubuntu-latest
  needs: build

  steps:
    - uses: actions/checkout@v4
    - uses: treosh/lighthouse-ci-action@v10
      with:
        urls: |
          https://streetwise-coach.vercel.app
          https://streetwise-coach.vercel.app/dashboard
        uploadArtifacts: true
```

---

## Cost Analysis

### GitHub Actions

- **Free tier:** 2,000 minutes/month (public repos unlimited)
- **Typical usage:** ~500 minutes/month
- **Cost:** $0 (within free tier)

### Vercel

- **Free tier:** Unlimited deployments, 100 GB bandwidth
- **Typical usage:** ~10 GB bandwidth/month
- **Cost:** $0 (within free tier)

### Total Monthly Cost: $0

---

## Best Practices

### 1. Branch Protection Rules

Enable on `main` branch:
- ✅ Require PR before merging
- ✅ Require status checks (CI) to pass
- ✅ Require code review approval
- ✅ Require branches to be up to date

### 2. Commit Message Convention

Use conventional commits:
```
feat: add new dashboard widget
fix: resolve authentication bug
docs: update CI/CD setup guide
test: add unit tests for students service
chore: update dependencies
```

### 3. PR Size Guidelines

- Keep PRs under 400 lines of code
- One feature/fix per PR
- Break large features into smaller PRs

### 4. Testing Guidelines

- Aim for 80% code coverage
- Test critical paths first (auth, data persistence)
- Mock external services (Supabase)

---

## Troubleshooting

### Workflow Not Triggering

**Check:**
1. YAML syntax is correct (use YAML validator)
2. Branch name matches trigger condition
3. GitHub Actions is enabled in repo settings

### Deployment Succeeded but Site Not Working

**Check:**
1. Environment variables in Vercel dashboard
2. Supabase connection working
3. Browser console for errors
4. Vercel deployment logs

### Tests Timeout on CI

**Solution:**
```yaml
- name: Run tests
  run: npm test
  timeout-minutes: 10 # Add timeout
```

---

## Next Steps

After CI/CD is set up:

1. ✅ Write unit tests for core services
2. ✅ Add integration tests for API routes
3. ✅ Set up E2E tests with Playwright
4. ✅ Configure monitoring (Sentry, LogRocket)
5. ✅ Set up alerts for failures

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CI/CD Guide](https://vercel.com/docs/concepts/git)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Jest Testing Framework](https://jestjs.io/)

---

**Questions?** Check the [GitHub Actions logs](https://github.com/malhefdi/streetwise-coach-app-v2/actions) for detailed error messages.
