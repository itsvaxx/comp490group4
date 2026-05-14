```markdown

\# Branching \& Versioning Strategy



\## Branch Structure



| Branch | Purpose | Protection Rules |

|--------|---------|------------------|

| `main` | Production-ready code | Require PR, require reviews |

| `develop` | Integration branch | Require PR |

| `feature/\*` | New features | Branch from `develop` |

| `hotfix/\*` | Emergency fixes | Branch from `main` |

| `release/\*` | Release preparation | Branch from `develop` |



\## Branch Naming Conventions



| Branch Type | Format | Example |

|-------------|--------|---------|

| Feature | `feature/feature-name` | `feature/team-comparison` |

| Bugfix | `bugfix/issue-description` | `bugfix/games-back-calculation` |

| Hotfix | `hotfix/version-description` | `hotfix/v1.0.1-api-error` |

| Release | `release/version-number` | `release/v1.0.0` |



\## Workflow Diagram



```

&#x20;                   ┌─────────────────────────────────────┐

&#x20;                   │              MAIN                    │

&#x20;                   │      (Production - Tagged)           │

&#x20;                   └─────────────────┬───────────────────┘

&#x20;                                     ▲

&#x20;                                     │ merge

&#x20;                   ┌─────────────────┴───────────────────┐

&#x20;                   │             RELEASE/X.X.X            │

&#x20;                   │      (Release Preparation)          │

&#x20;                   └─────────────────┬───────────────────┘

&#x20;                                     ▲

&#x20;                                     │ merge

&#x20;                   ┌─────────────────┴───────────────────┐

&#x20;                   │              DEVELOP                 │

&#x20;                   │        (Integration Branch)         │

&#x20;                   └─────────────────┬───────────────────┘

&#x20;                                     ▲

&#x20;                                     │ merge

&#x20;                   ┌─────────────────┴───────────────────┐

&#x20;                   │         FEATURE/FEATURE-NAME         │

&#x20;                   │         (Feature Development)        │

&#x20;                   └─────────────────────────────────────┘

```



\## Workflow Steps



\### 1. Feature Development



```bash

\# Create feature branch from develop

git checkout develop

git pull origin develop

git checkout -b feature/team-comparison



\# Work on your feature

git add .

git commit -m "feat(comparison): add team comparison tool"



\# Push feature branch

git push origin feature/team-comparison



\# Create Pull Request to develop on GitHub

```



\### 2. Pull Request Requirements



Before merging any PR to `develop`:

\- \[ ] At least one reviewer approval

\- \[ ] All automated tests pass

\- \[ ] No merge conflicts

\- \[ ] Branch is up to date with `develop`



\### 3. Release Process



```bash

\# Create release branch from develop

git checkout develop

git pull origin develop

git checkout -b release/v1.0.0



\# Final testing and bug fixes

git add .

git commit -m "fix: resolve release blocking issues"



\# Merge to main

git checkout main

git merge release/v1.0.0



\# Tag the release

git tag -a v1.0.0 -m "Release version 1.0.0"

git push origin main --tags



\# Merge back to develop

git checkout develop

git merge release/v1.0.0

git push origin develop



\# Delete release branch

git branch -d release/v1.0.0

```



\### 4. Hotfix Process (Emergency Fixes)



```bash

\# Create hotfix branch from main

git checkout main

git pull origin main

git checkout -b hotfix/critical-bug-fix



\# Fix the issue

git add .

git commit -m "hotfix: resolve critical production bug"



\# Merge directly to main

git checkout main

git merge hotfix/critical-bug-fix



\# Tag the hotfix

git tag -a v1.0.1 -m "Hotfix release - critical bug fix"

git push origin main --tags



\# Merge back to develop

git checkout develop

git merge hotfix/critical-bug-fix

git push origin develop



\# Delete hotfix branch

git branch -d hotfix/critical-bug-fix

```



\## Versioning Strategy (Semantic Versioning)



\*\*Format:\*\* `MAJOR.MINOR.PATCH`



| Version Component | Increment When | Example |

|-------------------|----------------|---------|

| \*\*MAJOR\*\* | Breaking changes, incompatible API changes | v1.0.0 → v2.0.0 |

| \*\*MINOR\*\* | New features, backward compatible | v1.0.0 → v1.1.0 |

| \*\*PATCH\*\* | Bug fixes, performance improvements | v1.0.0 → v1.0.1 |



\### Version Examples for GameLens



| Version | Changes |

|---------|---------|

| v1.0.0 | Initial release - dashboard, game details, standings |

| v1.1.0 | Add team comparison tool |

| v1.1.1 | Fix games-back calculation bug |

| v1.2.0 | Add user authentication |

| v2.0.0 | Migrate to live WebSocket data (breaking change) |



\## Current Version



\*\*v1.0.0\*\* - Initial release



\## Commit Message Convention



\*\*Format:\*\*

```

type(scope): short description



\[optional body explaining WHY]



\[optional footer]

```



\### Commit Types



| Type | Description | Example |

|------|-------------|---------|

| `feat` | New feature | `feat(comparison): add statistical arrows` |

| `fix` | Bug fix | `fix(standings): correct games-back calculation` |

| `docs` | Documentation | `docs(api): update team comparison endpoint` |

| `style` | Code formatting | `style(css): format team comparison card` |

| `refactor` | Code restructuring | `refactor(api): optimize fetch calls` |

| `test` | Adding tests | `test(comparison): add unit tests` |

| `chore` | Maintenance | `chore(deps): update express to 4.18.2` |



\### Commit Examples



```bash

\# Good commits

git commit -m "feat(comparison): add team comparison tool"

git commit -m "fix(standings): correct games-back calculation for tied teams"

git commit -m "docs(readme): add deployment instructions"



\# Multi-line commit

git commit -m "fix(api): resolve rate limiting error



The API was hitting rate limits during high traffic.

Added exponential backoff retry logic.



Closes #42"

```



\## Tagging Releases



```bash

\# Create annotated tag

git tag -a v1.0.0 -m "Release version 1.0.0"



\# Push tags to remote

git push origin --tags



\# List all tags

git tag -l



\# Delete a tag (if needed)

git tag -d v1.0.0

git push origin --delete v1.0.0

```



\## Protecting Branches (GitHub Settings)



\### Recommended Branch Protection Rules for `main`:



1\. \*\*Require pull request reviews\*\* - At least 1 reviewer

2\. \*\*Dismiss stale reviews\*\* - When new commits pushed

3\. \*\*Require status checks\*\* - All tests must pass

4\. \*\*Require branches to be up to date\*\* - Before merging

5\. \*\*Include administrators\*\* - Rules apply to everyone



\### Recommended Branch Protection Rules for `develop`:



1\. \*\*Require pull request reviews\*\* - Optional but recommended

2\. \*\*Require status checks\*\* - Basic validation

3\. \*\*Require branches to be up to date\*\*



\## Release Checklist



Before creating a release:



\- \[ ] All features for the release are complete

\- \[ ] All tests are passing

\- \[ ] Documentation is updated (README, DEPLOY, API docs)

\- \[ ] No critical bugs remain

\- \[ ] Performance is acceptable

\- \[ ] Security vulnerabilities addressed

\- \[ ] CHANGELOG.md is updated (if using)



\## Sample CHANGELOG.md



```markdown

\# Changelog



\## \[1.0.0] - 2024-05-14



\### Added

\- Initial dashboard with game listings

\- Game detail view with team statistics

\- Player performance section

\- Conference standings display

\- Team comparison tool

\- API documentation



\### Fixed

\- Empty game click-through issue

\- Games-back calculation for tied teams



\### Known Issues

\- Live game detection may have false positives

\- Mobile responsiveness needs improvement

```



\## Git Aliases (Optional but Helpful)



Add to `.gitconfig`:

```bash

\# Create aliases for common commands

git config --global alias.co checkout

git config --global alias.br branch

git config --global alias.ci commit

git config --global alias.st status

git config --global alias.unstage 'reset HEAD --'

git config --global alias.last 'log -1 HEAD'

```



\## Quick Reference Commands



| Action | Command |

|--------|---------|

| Create feature branch | `git checkout -b feature/name develop` |

| Switch to develop | `git checkout develop` |

| Update develop | `git pull origin develop` |

| Merge develop into feature | `git merge develop` |

| Push branch | `git push origin feature/name` |

| Create release tag | `git tag -a v1.0.0 -m "message"` |

| Delete local branch | `git branch -d branch-name` |

| Delete remote branch | `git push origin --delete branch-name` |

```

