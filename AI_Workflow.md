# AI Interaction Protocol
**Project:** Taller_Diagnostico  
**Team:** majoymajo team  
**Duration:** 2 days  
**Last Updated:** 2026-02-05

---

## 1. Methodology

### Agile-DevOps Hybrid Approach
For this 2-day intensive app development project, we combine lightweight Agile practices with DevOps principles:

#### **Agile Adaptation (Scrum-inspired)**
Given our 2-day constraint, we adapt Scrum to micro-sprints:

- **Sprint Duration:** 1 day per sprint (2 total sprints)
- **Daily Standup:** 2-hour daily meeting (detailed structure in Section 4)
- **Sprint Planning:** 30 minutes at project start and Day 2 beginning
- **Sprint Review/Retro:** 20 minutes at end of each day

**Day 1 Sprint Goals:**
- Project setup and architecture
- Core functionality development
- Basic UI/UX implementation

**Day 2 Sprint Goals:**
- Feature completion
- Testing and bug fixes
- Deployment and documentation

#### **DevOps Principles**
- **Continuous Integration:** Commit code frequently, trigger automated checks
- **Continuous Deployment:** Deploy to staging/production environments rapidly
- **Infrastructure as Code:** Version control all configurations
- **Automated Testing:** Integrate tests in CI/CD pipeline
- **Monitoring:** Track app performance and errors from day one

#### **AI Integration**
- Use AI assistants (GitHub Copilot, ChatGPT, etc.) as team members
- Apply prompt engineering best practices
- Validate all AI-generated outputs
- Document AI interactions for team learning

---

## 2. Key Interactions

### Types of AI Interactions

#### **A. Code Generation**
**When to use:** Creating new functions, classes, components, or files from scratch

**Example prompts:**
```
"In our [framework] app, create a user authentication component that handles login, 
signup, and password reset. Use [state management library] for state and include 
form validation."
```

**Best practices:**
- Specify the tech stack explicitly
- Mention styling frameworks or design patterns
- Include error handling requirements
- Request comments/documentation in code

---

#### **B. Code Explanation**
**When to use:** Understanding unfamiliar code, onboarding to new sections, or reviewing complex logic

**Example prompts:**
```
"Explain this function step by step, including what each parameter does and 
what the return value represents."
```

**Best practices:**
- Ask for explanations at different levels (high-level overview vs. line-by-line)
- Request analogies for complex concepts
- Ask about potential edge cases

---

#### **C. Debugging**
**When to use:** Encountering errors, unexpected behavior, or failing tests

**Example prompts:**
```
"This test is failing with error: [full error message]. Here's the test code: [code]
and here's the function being tested: [code]. What's causing the failure?"
```

**Best practices:**
- Include full error messages and stack traces
- Provide relevant code context (not just the error line)
- Mention what you've already tried
- Ask for explanation of the root cause, not just a fix

---

#### **D. Code Improvement**
**When to use:** Enhancing code quality, performance, readability, or maintainability

**Example prompts:**
```
"Review this code for potential improvements in terms of:
- Performance optimization
- Code readability
- Error handling
- Security vulnerabilities
- Best practices for [language/framework]

[paste code here]"
```

**Best practices:**
- Specify what aspects to focus on (performance, security, readability)
- Ask for explanations of suggested changes
- Request alternative approaches
- Verify improvements don't introduce new issues

---

#### **E. Documentation**
**When to use:** Writing README files, API documentation, code comments, or user guides

**Example prompts:**
```
"Generate comprehensive documentation for this API endpoint including:
- Endpoint URL and HTTP method
- Request parameters and body structure
- Response format and status codes
- Example requests and responses
- Error handling

[paste code here]"
```

**Best practices:**
- Specify the target audience (developers vs. end users)
- Request examples and use cases
- Ask for both inline comments and external documentation
- Include installation and setup instructions

---

#### **F. Testing**
**When to use:** Creating unit tests, integration tests, or end-to-end tests

**Example prompts:**
```
"Generate comprehensive unit tests for this [class/function] covering:
- Happy path scenarios
- Edge cases
- Error conditions
- Boundary values

Use [testing framework]. Aim for >80% code coverage.

[paste code here]"
```

**Best practices:**
- Specify testing framework and assertion library
- Request specific test scenarios
- Ask for both positive and negative test cases
- Include setup and teardown logic

---

### Interaction Guidelines

✅ **DO:**
- Provide full context (project, file, tech stack)
- Be specific about requirements and constraints
- Ask for explanations of AI reasoning
- Request multiple approaches when appropriate
- Validate and test all AI outputs
- Iterate and refine based on results

❌ **DON'T:**
- Use vague prompts like "make it better" or "fix this"
- Copy-paste without understanding
- Share sensitive data (API keys, passwords, personal info)
- Blindly trust AI outputs without validation
- Skip testing AI-generated code
- Use AI to bypass learning fundamentals

---

## 3. Key Documents and Context

### A. Project Context Documents

Maintain these key documents in the repository:

```
📁 majoymajo/Taller_Diagnostico
├── 📄 README.md                    → Project overview, setup, installation
├── 📄 AI_INTERACTION_PROTOCOL.md   → This document
├── 📄 ARCHITECTURE.md              → System design, tech stack, structure
├── 📄 API_DOCUMENTATION.md         → API endpoints (if applicable)
├── 📄 DEPLOYMENT.md                → Deployment process and environments
├── 📄 TESTING_GUIDE.md             → Testing strategy and commands
├── 📄 PROMPT_LIBRARY.md            → Successful prompts and patterns
└── 📁 docs/
    ├── DAILY_MEETING_NOTES.md      → Meeting summaries and decisions
    └── LESSONS_LEARNED.md          → Insights and retrospective notes
```

---

### B. Context Template for AI Interactions

Before requesting AI assistance, gather this information:

```markdown
## Context for AI Interaction

**Project**: Taller_Diagnostico
**Repository**: majoymajo/Taller_Diagnostico
**Task**: [What you're trying to achieve]
**Current file**: [Full file path]
**Related files**: [Other relevant files]
**Tech Stack**: 
  - Language: [e.g., JavaScript, Python]
  - Framework: [e.g., React, Django]
  - Database: [e.g., PostgreSQL, MongoDB]
  - Other libraries: [List key dependencies]
**Constraints**: [Limitations, requirements, deadlines]
**Previous attempts**: [What you've already tried]
**Error message** (if applicable): [Full error with stack trace]
```

---

### C. Example of Good Contextualization

**Example 1: Code Generation**
> "In our React Native app (majoymajo/Taller_Diagnostico), I'm building a product catalog screen. We use React Navigation v6, Redux Toolkit for state, and Styled Components for styling. I need a FlatList component that displays products from the Redux store, includes pull-to-refresh, and handles loading/error states. Each product card should show image, name, price, and rating. Follow our existing component structure in `src/components/`."

**Example 2: Debugging**
> "In our Node.js Express API, the POST /api/users endpoint in `src/routes/userRoutes.js` returns a 500 error when creating users. Error: 'Cannot read property 'hash' of undefined' in `src/controllers/userController.js:23`. We use bcrypt for password hashing and Sequelize ORM with PostgreSQL. Here's the controller code: [code]. Database connection is working for GET requests."

---

### D. Required Context Checklist

Before asking AI, ensure you have:

- [ ] **Project name and repository**: majoymajo/Taller_Diagnostico
- [ ] **Current file path**: Full path from project root
- [ ] **Task description**: Clear, specific objective
- [ ] **Tech stack**: Languages, frameworks, libraries
- [ ] **Constraints**: Time limits, requirements, dependencies
- [ ] **Related code**: Connected files or functions
- [ ] **Error messages**: Full text if debugging
- [ ] **Expected outcome**: What success looks like

---

## 4. Interaction Dynamics

### A. Project Phases Structure

Our 2-day project follows these phases:

#### **Phase 1: Beginning - Project Setup (Day 1, Morning)**
**Duration:** 2-3 hours  
**Activities:**
- Environment setup
- Repository initialization
- Architecture design
- Tech stack configuration
- Initial AI prompts for boilerplate

**AI Interaction Focus:**
- Project structure generation
- Configuration file creation
- Boilerplate code
- Setup documentation

**Example Prompts:**
```
"Create a [framework] project structure for a [app type] app with the following features:
[list features]. Include folder structure, configuration files, and a README with setup 
instructions."
```

---

#### **Phase 2: Code and Develop (Day 1 Afternoon - Day 2 Morning)**
**Duration:** 8-10 hours  
**Activities:**
- Feature implementation
- Component/module development
- API integration
- UI/UX implementation
- Continuous integration

**AI Interaction Focus:**
- Code generation
- Problem-solving
- Code improvement
- Documentation

**Prompt Engineering Strategy** (based on best practices):

1. **Context-First Prompting**
   ```
   "In the context of [project], working on [feature], using [tech stack],
   I need to [specific task] while considering [constraints]."
   ```

2. **Chain-of-Thought Prompting**
   ```
   "Let's solve this step by step:
   1. First, [step 1]
   2. Then, [step 2]
   3. Finally, [step 3]
   
   Show your reasoning for each step."
   ```

3. **Few-Shot Prompting**
   ```
   "Here's an example of our code style:
   [example 1]
   
   Now create a similar [component/function] for [new feature]."
   ```

4. **Role-Based Prompting**
   ```
   "Act as a senior [framework] developer. Review this code and suggest improvements
   following industry best practices and [framework] conventions."
   ```

5. **Constraint-Driven Prompting**
   ```
   "Create [feature] with these strict requirements:
   - Must use [specific library]
   - Must handle [edge cases]
   - Must be compatible with [environment]
   - Must follow [pattern/standard]"
   ```

**Development Workflow:**
```
1. 🎯 Define feature/task clearly
2. 📋 Break down into sub-tasks
3. 🔍 Search existing code for patterns
4. 💬 Craft detailed AI prompt with context
5. 🧪 Test AI response in isolation
6. 🔄 Iterate and refine if needed
7. ✅ Validate and integrate
8. 📝 Document and commit
9. 🚀 Push and trigger CI/CD
```

---

#### **Phase 3: Test and Validate (Day 2, Afternoon)**
**Duration:** 3-4 hours  
**Activities:**
- Unit testing
- Integration testing
- Bug fixing
- Performance optimization
- Security review

**AI Interaction Focus:**
- Test generation
- Debugging
- Code improvement
- Security analysis

**Example Prompts:**
```
"Generate comprehensive test suite for [component/module] including:
- Unit tests for all functions
- Integration tests for API calls
- Edge cases and error scenarios
- Mock data and fixtures

Use [testing framework] and aim for 80%+ coverage."
```

**Testing Checklist:**
- [ ] All functions have unit tests
- [ ] API endpoints tested
- [ ] Error handling verified
- [ ] Edge cases covered
- [ ] Performance acceptable
- [ ] Security vulnerabilities checked
- [ ] Cross-browser/platform tested (if applicable)

---

#### **Phase 4: Conclusion and Deployment (Day 2, End)**
**Duration:** 1-2 hours  
**Activities:**
- Final bug fixes
- Documentation completion
- Deployment to production
- Project retrospective
- Lessons learned documentation

**AI Interaction Focus:**
- Documentation finalization
- Deployment scripts
- Troubleshooting

**Deliverables:**
- [ ] Working application (deployed)
- [ ] Complete documentation
- [ ] Test coverage report
- [ ] Lessons learned document
- [ ] Prompt library with successful patterns

---

### B. Daily Meeting Structure

**Duration:** 2 hours daily  
**Timing:** Start of each day (Day 1 and Day 2)

#### **Meeting Agenda:**

**1. Standup (15 minutes)**
Each team member shares:
- What I completed yesterday / plan to complete today
- What I'm working on next
- Blockers or challenges
- AI interactions that helped/didn't help

**2. Knowledge Sharing - Prompt Engineering (45 minutes)**
- **Review successful prompts** from previous work session
- **Analyze ineffective prompts** and discuss improvements
- **Live demonstration** of advanced prompt techniques
- **Practice session**: Team members craft prompts together
- **Update PROMPT_LIBRARY.md** with new patterns

**Format:**
```markdown
### Successful Prompt Pattern

**Context:** [When to use this]
**Prompt Template:**
```
[Actual prompt with placeholders]
```
**Result:** [What it achieved]
**Tips:** [Key factors for success]
```

**3. Sprint Planning / Review (30 minutes)**
- **Day 1:** Plan Day 1 tasks, assign responsibilities
- **Day 2:** Review Day 1 completion, plan Day 2 tasks

**4. Technical Discussion (20 minutes)**
- Architecture decisions
- Tech stack challenges
- Code improvement opportunities
- AI-assisted solutions

**5. Action Items & Commitments (10 minutes)**
- Assign tasks
- Set deadlines
- Identify dependencies
- Schedule check-ins

---

### C. Collaboration Dynamics

#### **Pair Programming with AI**
- **Navigator:** Writes prompts, guides AI interaction
- **Driver:** Reviews code, validates responses, integrates code
- **Switch roles** every 30-45 minutes
- **Document learnings** in shared notes

#### **Code Improvement with AI**
```
1. Developer completes feature
2. Create Pull Request
3. Run AI code improvement: "Review this PR for improvements in [aspects]"
4. Address AI suggestions
5. Human team review
6. Merge after 2 approvals (as per branch protection rules)
```

#### **Knowledge Sharing**
- **Daily 2-hour meetings** with structured prompt engineering focus
- **Real-time documentation** of effective prompts in PROMPT_LIBRARY.md
- **Shared learning log** in DAILY_MEETING_NOTES.md
- **End-of-project retrospective** capturing lessons learned

**Prompt Library Structure:**
```markdown
# Prompt Library

## Code Generation Prompts
### [Prompt Name]
- **Use Case:** [When to use]
- **Template:** [Prompt with variables]
- **Success Rate:** [How often it works]
- **Notes:** [Tips and variations]

## Debugging Prompts
[Same structure]

## Testing Prompts
[Same structure]
```

---

### D. Escalation Protocol

When AI doesn't provide satisfactory results:

```
Attempt 1: Rephrase with more context and specific constraints
           ↓ (if unsuccessful)
Attempt 2: Break down into smaller, atomic questions
           ↓ (if unsuccessful)
Attempt 3: Ask AI to explain reasoning, identify gaps in prompt
           ↓ (if unsuccessful)
Attempt 4: Consult team members in daily meeting
           ↓ (if unsuccessful)
Attempt 5: Research official documentation, Stack Overflow
           ↓ (if unsuccessful)
Attempt 6: Simplify approach or find alternative solution
```

**Time Limit:** Max 30 minutes per AI interaction before escalating

---

### E. Quality Control

#### **Validation Checklist for AI-Generated Code**
Before integrating any AI output:

- [ ] **Functionality:** Code runs without errors
- [ ] **Tests:** All tests pass
- [ ] **Standards:** Follows team coding conventions
- [ ] **Security:** No vulnerabilities introduced
- [ ] **Performance:** Acceptable speed and resource usage
- [ ] **Documentation:** Code is commented and documented
- [ ] **Understanding:** Team member can explain how it works
- [ ] **Integration:** Works with existing codebase
- [ ] **Dependencies:** No unnecessary libraries added

#### **Code Review Process**
1. AI generates code → Local testing
2. Create PR → Automated CI checks
3. AI code improvement → Address suggestions
4. Human review (2 approvals required)
5. Merge → Deploy to staging
6. Final validation → Deploy to production

---

## 5. Quality Standards & Ethics

### A. Code Quality Requirements
- **All AI-generated code must be reviewed** by at least one human
- **All AI-generated code must have tests** with minimum 70% coverage
- **All AI-generated code must be understood** by the team member integrating it
- **Follow project coding standards** and linting rules
- **No hardcoded secrets or sensitive data**

### B. Ethical Guidelines

✅ **Acceptable Use:**
- Using AI to accelerate development
- Learning from AI explanations
- Getting suggestions for improvements
- Generating boilerplate and tests

❌ **Unacceptable Use:**
- Copying AI code without understanding
- Sharing sensitive project data with AI
- Using AI to bypass learning fundamentals
- Claiming AI work as entirely original without disclosure
- Violating licenses or intellectual property

### C. Data Privacy
- **Never share:** API keys, passwords, tokens, personal user data
- **Sanitize inputs:** Remove sensitive info before sharing with AI
- **Review outputs:** Ensure AI doesn't generate inappropriate content

---

## 6. Metrics & Continuous Improvement

### A. Track These Metrics
- ⏱️ Time saved per AI interaction
- 🐛 Bugs introduced by AI-generated code vs. human code
- ✅ Successful vs. unsuccessful AI interactions
- 📈 Most effective prompt patterns
- 🎯 AI accuracy by task type

### B. Daily Improvement
- Review metrics in daily 2-hour meeting
- Update PROMPT_LIBRARY.md with new successful patterns
- Refine prompts based on what worked/didn't work
- Share learnings across team

### C. Post-Project Review
After 2-day project completion:
- Compile comprehensive lessons learned
- Identify most/least effective AI use cases
- Document best prompt patterns
- Calculate overall time saved
- Plan improvements for future projects

---

## 7. Resources & References

### Prompt Engineering Resources
- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [GitHub Copilot Best Practices](https://docs.github.com/en/copilot/using-github-copilot/best-practices-for-using-github-copilot)
- [Anthropic Prompt Library](https://docs.anthropic.com/claude/prompt-library)

### DevOps Tools
- **CI/CD:** GitHub Actions
- **Testing:** [Your testing framework]
- **Deployment:** [Your deployment platform]
- **Monitoring:** [Your monitoring tools]

### Team Communication
- **Daily Meetings:** 2 hours, structured agenda
- **Async Updates:** GitHub Issues, PR comments
- **Documentation:** Maintained in repository

---

## 8. Document Maintenance

**Review Schedule:** After each 2-day project sprint  
**Update Responsibility:** Entire team during retrospective  
**Version Control:** Track changes via Git commits  

**Changelog:**
- 2026-02-05: Initial protocol created for 2-day app development project

---

**Contributors:** majoymajo team  
**Approved by:** [Team lead or all members]  
**Next Review:** End of Day 2 (Project Completion)
