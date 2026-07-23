#!/usr/bin/env node

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

const CPO_EMAIL = requireEnv('CPO_EMAIL');
const CPO_PASSWORD = requireEnv('CPO_PASSWORD');

const recommendations = `📊 **Product Improvements for Fractal Chat PM System**

As CPO, strategic improvements prioritized by impact:

## 🎯 High-Priority (Q1-Q2)

**1. AI Task Prioritization**
- Analyze dependencies, deadlines, capacity, patterns
- Impact: 30-40% throughput improvement

**2. Predictive Capacity Planning**
- Velocity tracking, bottleneck detection, what-if modeling
- Impact: Better planning, realistic commitments

**3. Intelligent Task Assignment**
- AI recommendations: skill match (from bios), workload, growth
- Impact: Better fit, faster completion

**4. Automated Standup Summaries**
- AI generates from task updates + chat
- Impact: Saves 15-20 min/day

**5. Context-Aware Suggestions**
- Proactive: next tasks, unblocking, quick wins
- Impact: Reduces decision fatigue

## 🚀 Medium-Priority (Q3)

**6. Cross-Channel Dependencies** - Visual graph, AI detects deps
**7. Retrospective Automation** - Data-driven insights
**8. Evidence Validation** - AI checks quality, flags incomplete
**9. Risk Detection** - Monitor age, patterns, velocity
**10. Productivity Insights** - Personal dashboard

## 💡 Innovation (Q4+)

**11. Pair Programming AI** - Optimal pairing suggestions
**12. Auto Documentation** - Generate from evidence
**13. Team Health Monitoring** - Sentiment analysis
**14. Goal Decomposition** - Break goals into tasks
**15. Pattern Recognition** - Learn across projects

## 📈 Metrics
- Completion velocity, time to completion, quality score
- Team satisfaction, predictive accuracy

## 🎯 Roadmap
**Q1**: Prioritization + Capacity
**Q2**: Assignment + Standups
**Q3**: Dependencies + Retros
**Q4**: Advanced AI features

*Validate with user research + A/B testing.*`;

(async () => {
  try {
    console.log(`Logging in as CPO: ${CPO_EMAIL}...`);
    const loginRes = await fetch(BASE_API_URL + '/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        user: CPO_EMAIL,
        password: CPO_PASSWORD
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.data) {
      console.error('Login failed:', loginData);
      process.exit(1);
    }
    
    const {authToken, userId} = loginData.data;
    console.log('✅ CPO login successful!');
    
    const postRes = await fetch(BASE_API_URL + '/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': authToken,
        'X-User-Id': userId
      },
      body: JSON.stringify({
        channel: '#product',
        text: recommendations
      })
    });
    
    const postData = await postRes.json();
    if (postData.success) {
      console.log('✅ Product recommendations posted to #product channel!');
      console.log('Message ID:', postData.message._id);
    } else {
      console.error('Failed to post:', postData);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
