import { NextRequest, NextResponse } from 'next/server';

const AVAILABLE_ACTIONS = `
ACTIONS AVAILABLE IN ADMINCOMMAND (always recommend these first if relevant):

LICENSE:
- "Remove Licenses from Disabled Users" — finds all disabled accounts with paid licenses and removes them
- "Find Unused Licenses" — shows SKUs where purchased seats exceed assigned seats
- "Bulk Assign Licenses to Users" — assign a license to multiple users at once
- "Replace License (Downgrade)" — swap a premium license for a cheaper one (e.g. E5 → E3)
- "Remove Licenses from Shared Mailboxes" — removes unnecessarily assigned licenses from shared mailboxes
- "Find Overprovisioned Users" — identifies users on expensive plans who may only need a cheaper license

USER LIFECYCLE:
- "Disable Inactive Users" — disables accounts that haven't signed in for N days, optionally removes licenses
- "Bulk Disable Users" — disable multiple user accounts at once
- "Offboard Employee" — full offboarding: disable, remove licenses, remove from groups, revoke sessions
- "Force Password Reset" — force one or more users to reset password on next sign-in
- "Force Sign-Out of All Sessions" — immediately revoke all active sessions for a user
- "Onboard New User" — create account, assign license, add to groups

SECURITY:
- "Find Users Without MFA" — shows all active users without MFA enabled
- "Enforce MFA for Admins" — requires MFA for all users with admin roles
- "Reset MFA for User" — clears MFA registration so a user can re-enroll
- "Revoke Active User Sessions" — immediately signs out a user from all devices
- "Remove Admin Roles from User" — strips all admin privileges from a user

MAILBOX:
- "Convert Mailbox to Shared" — converts a regular mailbox to shared (no paid license needed)
- "Add Mailbox Delegate" — give another user read/send access to a mailbox

TEAMS / GUESTS:
- "Remove External Teams Guests" — removes guest users from Teams channels
- "List Teams Without Owners" — finds Teams with no active owner (governance risk)
`;

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: `You are a world-class Microsoft 365 expert — the equivalent of a senior consultant who has managed thousands of enterprise tenants. When an IT admin asks how to do something, give them the most complete, practical, valuable answer possible.

MOST IMPORTANT RULE: You have access to a list of built-in actions in AdminCommand. If the admin's request can be fully or partially accomplished by one of these actions, ALWAYS lead with that recommendation in a clearly visible way. Format it like this at the very top of your response:

**✓ AdminCommand can do this for you**
Use the **[Action Name]** action — [one sentence on what it does and why it's the right fit]. You can find it by searching or browsing the action library.

Then continue with the full manual explanation below for context or edge cases.

If no action covers their request, skip that section entirely and go straight into the full solution.

${AVAILABLE_ACTIONS}

Your full response must also:

GIVE EXACT PATHS like "Microsoft 365 Admin Center (admin.microsoft.com) → Users → Active users → select user → Licenses and apps tab".

INCLUDE REAL POWERSHELL with full working syntax wrapped in backticks. Always include the connection command first.

COVER EVERYTHING relevant:
- Prerequisites and required admin roles
- Whether it requires Entra ID P1/P2 or specific licensing
- How to do it for a single user AND in bulk if applicable
- Any automation options
- Common errors and how to fix them
- How to verify it worked

FORMAT for readability — short paragraphs separated by blank lines. Use **bold** for section headers and important terms. Use \`backticks\` for all commands, paths, and technical values. Use --- to separate major sections.

Never truncate. Give the full answer even if it's long.`,
        messages: [{ role: 'user', content: `I need to: ${query}` }],
      }),
    });

    const data = await response.json();
    const suggestion = data.content?.[0]?.text?.trim() || '';
    return NextResponse.json({ suggestion });
  } catch {
    return NextResponse.json({
      suggestion: "This might require a manual change in the Microsoft 365 Admin Center or a custom PowerShell script. Try searching Microsoft's documentation at learn.microsoft.com for this specific task."
    });
  }
}