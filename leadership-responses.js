#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

const leadershipSeedPath = path.resolve(__dirname, process.env.LEADERSHIP_USERS_JSON || 'leadership-users.seed.json');
if (!fs.existsSync(leadershipSeedPath)) {
	console.error(`Missing leadership user seed file: ${leadershipSeedPath}`);
	console.error('Copy leadership-users.seed.json.example to leadership-users.seed.json and set passwords.');
	process.exit(1);
}
const LEADERSHIP_USERS = JSON.parse(fs.readFileSync(leadershipSeedPath, 'utf8'));
const placeholder = 'LOCAL_PASSWORD_PLACEHOLDER';
for (const u of LEADERSHIP_USERS) {
	if (!u.password || u.password === placeholder) {
		console.error(`Invalid password for ${u.email}: set real passwords in ${leadershipSeedPath}`);
		process.exit(1);
	}
}

// Latest leadership discussion seed (override with LEADERSHIP_SEED_MESSAGE in .env)
const leadershipMessage =
	process.env.LEADERSHIP_SEED_MESSAGE ||
	'Lets try to add a network component to this product so we can continue to make this product open source';

const channelId = requireEnv('LEADERSHIP_CHANNEL_ID');

// Generate response based on role and prompt
function generateGoalsResponse(user, prompt, leadershipMessage) {
  const role = user.role;
  
  if (role === 'COO') {
    return `📋 **COO Goals & Action Plan**

Based on the network component and revenue model strategy, here are my operational goals:

**Q1 Goals:**
1. **Network Infrastructure Setup**
   - Design scalable network architecture for multi-tenant deployment
   - Establish operational processes for network component integration
   - Create monitoring and maintenance protocols

2. **Revenue Operations**
   - Build operational framework for 1% token fee collection
   - Design cloud hosting infrastructure for Fractal Talk
   - Establish customer onboarding and support processes

3. **Open Source Governance**
   - Maintain open source compliance while adding network features
   - Create contribution guidelines for network components
   - Establish community management processes

**Success Metrics:**
- Network uptime: 99.9%
- Token fee collection efficiency: 95%+
- Cloud hosting capacity: 1000+ concurrent users
- Open source contribution rate: 20+ PRs/month

**Next Steps:**
- Coordinate with CTO on technical architecture
- Work with CFO on revenue operations setup
- Partner with CPO on user experience for network features`;
  }
  
  if (role === 'CTO') {
    return `🔧 **CTO Goals & Technical Roadmap**

Based on the network component and cloud hosting requirements:

**Q1 Technical Goals:**
1. **Network Architecture**
   - Design decentralized network protocol for Fractal Chat
   - Implement token-based authentication and ownership tracking
   - Build API for 1% fee collection mechanism

2. **Cloud Infrastructure**
   - Design scalable cloud hosting architecture
   - Implement multi-tenant SaaS deployment
   - Build auto-scaling and load balancing

3. **Open Source Strategy**
   - Modularize network components for optional deployment
   - Maintain core open source while adding premium network features
   - Create clear separation between OSS and network layers

**Technical Milestones:**
- Network protocol v1.0: Q1
- Cloud hosting MVP: Q1
- Token integration: Q2
- Production-ready network: Q2

**Resource Requirements:**
- 2 backend engineers (network protocol)
- 1 DevOps engineer (cloud infrastructure)
- 1 blockchain engineer (token integration)`;
  }
  
  if (role === 'CPO') {
    return `📊 **CPO Goals & Product Strategy**

Product goals aligned with network component and revenue model:

**Q1 Product Goals:**
1. **Network Feature Development**
   - Define network component UX/UI requirements
   - Design token ownership and fee collection user flows
   - Create cloud hosting product tiers and pricing

2. **Market Positioning**
   - Position as "Open Source + Network" hybrid model
   - Define value proposition for token-based revenue
   - Create go-to-market strategy for cloud offering

3. **User Research & Validation**
   - Validate network component demand
   - Test token fee model acceptance
   - Research cloud hosting pricing sensitivity

**Product Roadmap:**
- Network component MVP: Q1
- Token integration: Q2
- Cloud hosting beta: Q2
- Full network launch: Q3

**Success Metrics:**
- Network adoption: 50+ projects in Q1
- Token fee revenue: $10K+ in Q1
- Cloud hosting signups: 100+ in Q1`;
  }
  
  if (role === 'CMO') {
    return `📢 **CMO Goals & Marketing Strategy**

Marketing goals for network component and revenue model:

**Q1 Marketing Goals:**
1. **Brand Positioning**
   - Position as "Open Source + Network" innovation
   - Create messaging around token-based revenue model
   - Build thought leadership in decentralized collaboration

2. **Go-to-Market**
   - Launch campaign for network component
   - Create content around token ownership benefits
   - Promote cloud hosting as enterprise solution

3. **Community Building**
   - Grow open source community
   - Build network of token-holding projects
   - Create ambassador program

**Marketing Channels:**
- Developer communities (GitHub, Reddit, Discord)
- Blockchain/crypto communities
- Enterprise SaaS platforms
- Tech conferences and events

**Success Metrics:**
- Community growth: 500+ members
- Network projects: 50+ in Q1
- Cloud hosting leads: 200+ in Q1
- Brand awareness: 20% increase`;
  }
  
  if (role === 'CFO') {
    return `💰 **CFO Goals & Financial Strategy**

Financial goals for network revenue model:

**Q1 Financial Goals:**
1. **Revenue Model Implementation**
   - Design 1% token fee collection system
   - Establish cloud hosting pricing tiers
   - Create financial tracking and reporting

2. **Financial Projections**
   - Model network revenue (1% token fees)
   - Project cloud hosting revenue
   - Forecast growth scenarios

3. **Compliance & Operations**
   - Ensure token fee compliance (legal/tax)
   - Set up payment processing for cloud hosting
   - Create financial reporting dashboards

**Revenue Targets:**
- Token fees: $10K+ in Q1
- Cloud hosting: $25K+ ARR by Q2
- Total revenue: $50K+ by Q3

**Financial Metrics:**
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Revenue per network project
- Cloud hosting MRR growth`;
  }
  
  return `Goals for ${role} role`;
}

async function loginAndPost(user) {
  try {
    console.log(`\n📝 Processing ${user.role} (${user.email})...`);
    
    // Login
    const loginRes = await fetch(BASE_API_URL + '/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        user: user.email,
        password: user.password
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.data) {
      console.error(`  ❌ Login failed for ${user.role}`);
      return;
    }
    
    const {authToken, userId} = loginData.data;
    
    // Generate response
    const response = generateGoalsResponse(user, '', leadershipMessage);
    
    // Post message
    const postRes = await fetch(BASE_API_URL + '/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': authToken,
        'X-User-Id': userId
      },
      body: JSON.stringify({
        roomId: channelId,
        text: response
      })
    });
    
    const postData = await postRes.json();
    if (postData.success) {
      console.log(`  ✅ Posted goals from ${user.role}`);
      console.log(`  Message ID: ${postData.message._id}`);
    } else {
      console.error(`  ❌ Failed to post: ${postData.error}`);
    }
    
    // Small delay between posts
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error(`  ❌ Error for ${user.role}: ${error.message}`);
  }
}

(async () => {
  console.log('🚀 Posting leadership goals responses...\n');
  console.log(`Latest leadership seed message: "${leadershipMessage}"\n`);
  
  for (const user of LEADERSHIP_USERS) {
    await loginAndPost(user);
  }
  
  console.log('\n✅ All leadership responses posted!');
})();


