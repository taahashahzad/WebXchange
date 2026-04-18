// Dashboard mock data
export const dashboardStats = {
  credits: 2340,
  visits7d: 8940,
  ctr: '3.4%',
  avgDuration: '41s',
};

export const userWebsites = [
  { id: 1, url: 'https://example.com', status: 'Active', dailyCap: 500, geo: 'Global' },
  { id: 2, url: 'https://store.example', status: 'Paused', dailyCap: 200, geo: 'US, PK' },
];

export const trafficTrend = [
  { day: 'Mon', visits: 1120 },
  { day: 'Tue', visits: 1340 },
  { day: 'Wed', visits: 980 },
  { day: 'Thu', visits: 1600 },
  { day: 'Fri', visits: 1420 },
  { day: 'Sat', visits: 1750 },
  { day: 'Sun', visits: 730 },
];

// Leaderboard mock data
export const leaderboardData = [
  { rank: 1, user: '@alpha-site', visits: 3580, credits: 2400 },
  { rank: 2, user: '@boostify',   visits: 3442, credits: 2200 },
  { rank: 3, user: '@pak-web',    visits: 3201, credits: 2100 },
  { rank: 4, user: '@growthhub', visits: 2980, credits: 1900 },
  { rank: 5, user: '@marketmax', visits: 2770, credits: 1700 },
  { rank: 6, user: '@techlaunch', visits: 2460, credits: 1500 },
  { rank: 7, user: '@webpilot',  visits: 2210, credits: 1350 },
];

// Surf queue mock data
export const surfQueue = [
  { id: 1, url: 'https://site.example/landing', credits: 8 },
  { id: 2, url: 'https://coolblog.io/home', credits: 10 },
  { id: 3, url: 'https://startup.app', credits: 7 },
  { id: 4, url: 'https://portfoliox.dev', credits: 9 },
];

// Pricing plans
export const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    features: ['100 visits / day', 'Basic Analytics', '1 Website Slot'],
    cta: 'Continue Free',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/mo',
    features: ['5,000 visits / day', 'Advanced Analytics', '5 Website Slots', 'Priority Support'],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Unlimited visits', 'Dedicated Manager', 'API Access', 'Custom Targeting'],
    cta: 'Contact Sales',
    popular: false,
  },
];

// Testimonials
export const testimonials = [
  { name: 'Sarah K.', text: 'Doubled my visits in a week. Clean UI and real results.' },
  { name: 'Imran A.', text: 'Geo targeting actually works. Love the analytics.' },
  { name: 'Lee W.',   text: 'Perfect for launches. Credits system is fair.' },
];
