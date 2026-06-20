export interface SampleSlackMessage {
  title: string;
  sender: string;
  text: string;
}

export const SAMPLE_SLACK_MESSAGES: SampleSlackMessage[] = [
  {
    title: "Engineering (Siddharth)",
    sender: "Siddharth (Lead Dev)",
    text: `siddharth 10:15 AM
Hey team, here is my status update for today:
- Spent the morning debugging the oauth token expiration issues in the login flow. Fixed the silent token refresh method! Very happy to get this solved.
- Completed the visual draft of the dashboard charts. Aligning with Design on the color tokens.
- Blocked: Waiting on DevOps to grant access to the staging DB bucket credentials so I can test real-time synchronization.
- Plan for tomorrow: Write test scripts for the oauth token edge cases, finalize DB connection, and join the sprint planning.`
  },
  {
    title: "Marketing Engine (Jessica)",
    sender: "Jessica (Marketing PM)",
    text: `jessica_pm 9:30 AM
Hi @here, quick progress update from me on the marketing engine launch:
* Completed SEO audit and added structured metadata headers to all public assets for better indexing.
* Styled the promotional newsletters in SendGrid and verified they look great on mobile clients.
* Blockers: Stripe webhook signatures are failing on the development endpoint. Waiting for the payment team to clarify key rotation keys.
* For tomorrow, I'll organize the content calendar and schedule initial beta invites!`
  },
  {
    title: "DevOps & SRE (Alex)",
    sender: "Alex (Infrastructure)",
    text: `alex_sre 11:02 AM
Status report Friday June 19:
- Migrated 3 outdated Docker configurations to our new Alpine-based images, successfully reducing image footprint by 40%.
- Established Redis cache optimization on our feed loader. Response time dropped to 52ms!
- Blockers: None today! Everything is running super smooth.
- Plans: Monitor memory consumption weekend benchmarks, complete multi-region fallback tests on Monday morning.`
  }
];
