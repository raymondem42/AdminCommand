export type ActionParameter = {
  id: string;
  label: string;
  type: 'select' | 'user-picker' | 'number' | 'text' | 'confirm';
  options?: string[];
  placeholder?: string;
};

export type Action = {
  id: string;
  title: string;
  description: string;
  why: string;  // ← add this
  category: 'license' | 'user' | 'security' | 'mailbox' | 'teams' | 'report';
  keywords: string[];
  parameters: ActionParameter[];
  schedulable: boolean;
  destructive: boolean;
};

export const actions: Action[] = [
  // LICENSE
  {
    id: 'remove-licenses-disabled',
    title: 'Remove Licenses from Disabled Users',
    description: 'Finds all disabled accounts that still have paid licenses assigned and removes them.',
    why: 'Disabled users no longer need access to Microsoft 365, but their licenses keep billing you every month. This action finds every disabled account still holding a paid license and removes them instantly — most tenants recover $50–$200/mo from this single action.',
    category: 'license',
    keywords: ['remove', 'license', 'disabled', 'clean', 'unused', 'waste', 'cost'],
    parameters: [],
    schedulable: true,
    destructive: false,
  },
  {
    id: 'find-unused-licenses',
    title: 'Find Unused Licenses',
    description: 'Shows all license SKUs where purchased seats exceed assigned seats.',
    why: 'Most tenants are paying for more licenses than they have users. This scan compares every SKU you\'ve purchased against what\'s actually assigned and surfaces the gap — giving you a clear picture of what you can cut at renewal.',
    category: 'license',
    keywords: ['find', 'unused', 'license', 'unassigned', 'waste', 'cost', 'savings'],
    parameters: [],
    schedulable: false,
    destructive: false,
  },
  {
    id: 'bulk-assign-licenses',
    title: 'Bulk Assign Licenses to Users',
    description: 'Assign a license to multiple users at once.',
    why: 'Assigning licenses one by one in the admin center is tedious and error-prone. This action lets you assign a license SKU to a group of users in a single operation — saving time and ensuring consistency across your tenant.',
    category: 'license',
    keywords: ['assign', 'license', 'bulk', 'give', 'add license', 'provision'],
    parameters: [
      { id: 'license', label: 'Which license?', type: 'select', options: ['Microsoft 365 Business Basic', 'Microsoft 365 Business Standard', 'Microsoft 365 Business Premium', 'Microsoft 365 E3', 'Microsoft 365 E5'] },
      { id: 'scope', label: 'Which users?', type: 'select', options: ['Select users manually', 'All users in a group', 'All unlicensed users', 'Filter by department'] },
    ],
    schedulable: false,
    destructive: false,
  },
  {
    id: 'replace-license',
    title: 'Replace License (Downgrade)',
    description: 'Swap a premium license for a cheaper one across selected users.',
    why: 'Not every user needs your most expensive license. If you have staff on E5 who only use email and Teams, swapping them to E3 or Business Standard can save $20–$35 per user per month with zero impact on their day-to-day work.',
    category: 'license',
    keywords: ['replace', 'downgrade', 'swap', 'license', 'e5', 'e3', 'cheaper', 'cost'],
    parameters: [
      { id: 'from', label: 'Replace which license?', type: 'select', options: ['Microsoft 365 E5', 'Microsoft 365 E3', 'Microsoft 365 Business Premium'] },
      { id: 'to', label: 'Replace with?', type: 'select', options: ['Microsoft 365 E3', 'Microsoft 365 Business Standard', 'Microsoft 365 Business Basic'] },
      { id: 'scope', label: 'Which users?', type: 'select', options: ['All users with this license', 'Select users manually', 'All users in a group'] },
    ],
    schedulable: false,
    destructive: false,
  },
  {
    id: 'remove-shared-mailbox-licenses',
    title: 'Remove Licenses from Shared Mailboxes',
    description: 'Shared mailboxes do not require paid licenses. This removes unnecessarily assigned licenses.',
    why: 'Shared mailboxes under 50GB work perfectly without a paid license — Microsoft provides them free. If someone assigned a Business or E-plan license to a shared mailbox, you\'re paying for nothing. This finds and removes those licenses immediately.',
    category: 'license',
    keywords: ['shared', 'mailbox', 'license', 'remove', 'unnecessary', 'cost'],
    parameters: [],
    schedulable: true,
    destructive: false,
  },
  {
    id: 'find-overprovisioned',
    title: 'Find Overprovisioned Users',
    description: 'Identifies users on expensive plans who may only need a cheaper license.',
    why: 'Premium licenses like E5 include advanced security and compliance features most users never touch. This scan identifies users on expensive SKUs whose usage patterns suggest a cheaper license would serve them just as well.',
    category: 'license',
    keywords: ['overprovisioned', 'expensive', 'e5', 'downgrade', 'overpaid', 'cost'],
    parameters: [],
    schedulable: false,
    destructive: false,
  },

  // USER LIFECYCLE
  {
    id: 'disable-inactive-users',
    title: 'Disable Inactive Users',
    description: 'Disables accounts that have not signed in for a specified number of days.',
    why: 'Stale accounts are one of the most common attack vectors in Microsoft 365. A dormant account with a weak password that nobody monitors is an open door. This action finds and disables accounts that haven\'t been used, optionally recovering their licenses at the same time.',
    category: 'user',
    keywords: ['disable', 'inactive', 'old', 'dormant', 'unused', 'stale', 'no login'],
    parameters: [
      { id: 'days', label: 'Inactive for how many days?', type: 'number', placeholder: '90' },
      { id: 'removeLicenses', label: 'Also remove their licenses?', type: 'select', options: ['Yes — save money', 'No — just disable account'] },
    ],
    schedulable: true,
    destructive: true,
  },
  {
    id: 'bulk-disable-users',
    title: 'Bulk Disable Users',
    description: 'Disable multiple user accounts at once.',
    why: 'When you need to quickly lock down a group of accounts — end of a contract, department restructure, or security incident — doing it one by one in the admin center takes forever. This action disables multiple accounts in a single operation.',
    category: 'user',
    keywords: ['bulk', 'disable', 'multiple', 'users', 'deactivate'],
    parameters: [
      { id: 'scope', label: 'Which users?', type: 'select', options: ['Select users manually', 'All users in a group', 'Filter by department'] },
    ],
    schedulable: false,
    destructive: true,
  },
  {
    id: 'offboard-employee',
    title: 'Offboard Employee',
    description: 'Full offboarding: disable account, remove licenses, remove from all groups, revoke sessions.',
    why: 'When someone leaves, every minute their account stays active is a security risk. This runs the complete offboarding sequence — killing their sessions, disabling the account, reclaiming licenses, and removing group memberships — in one guided flow instead of hunting across five admin portals.',
    category: 'user',
    keywords: ['offboard', 'terminate', 'fire', 'remove', 'employee', 'leaving', 'left', 'exit'],
    parameters: [
      { id: 'user', label: 'Which user?', type: 'user-picker' },
      { id: 'transferEmail', label: 'Forward their email to?', type: 'text', placeholder: 'manager@company.com (optional)' },
      { id: 'convertMailbox', label: 'Convert mailbox to shared?', type: 'select', options: ['Yes', 'No'] },
    ],
    schedulable: false,
    destructive: true,
  },
  {
    id: 'force-password-reset',
    title: 'Force Password Reset',
    description: 'Force one or more users to reset their password on next sign-in.',
    why: 'After a security incident, suspected phishing, or routine hygiene, forcing a password reset ensures compromised credentials can\'t be reused. Users get prompted immediately on their next sign-in with no admin center hunting required.',
    category: 'user',
    keywords: ['password', 'reset', 'force', 'change', 'expire'],
    parameters: [
      { id: 'scope', label: 'Which users?', type: 'select', options: ['Select users manually', 'All users', 'All users in a group', 'All admins'] },
    ],
    schedulable: false,
    destructive: false,
  },
  {
    id: 'force-signout',
    title: 'Force Sign-Out of All Sessions',
    description: 'Immediately revoke all active sessions for a user.',
    why: 'If an account is compromised, lost, or you just terminated someone, their active sessions stay alive even after a password reset — sometimes for hours. This revokes all tokens immediately, forcing reauthentication on every device and app.',
    category: 'user',
    keywords: ['sign out', 'signout', 'revoke', 'sessions', 'logout', 'kick out', 'tokens'],
    parameters: [
      { id: 'user', label: 'Which user?', type: 'user-picker' },
    ],
    schedulable: false,
    destructive: false,
  },
  {
    id: 'onboard-user',
    title: 'Onboard New User',
    description: 'Create a new user account, assign a license, and add them to groups.',
    why: 'Setting up a new employee in M365 means touching the admin center, then licenses, then groups — at minimum three separate steps across two portals. This creates the account, assigns the right license, and adds them to groups in one guided flow.',
    category: 'user',
    keywords: ['onboard', 'new user', 'create', 'add user', 'hire', 'new employee', 'setup'],
    parameters: [
      { id: 'name', label: 'Full name?', type: 'text', placeholder: 'Jane Smith' },
      { id: 'email', label: 'Email address?', type: 'text', placeholder: 'jane@company.com' },
      { id: 'license', label: 'Assign license?', type: 'select', options: ['Microsoft 365 Business Basic', 'Microsoft 365 Business Standard', 'Microsoft 365 Business Premium', 'Microsoft 365 E3', 'No license yet'] },
      { id: 'groups', label: 'Add to groups?', type: 'text', placeholder: 'e.g. All Staff, Marketing (optional)' },
    ],
    schedulable: false,
    destructive: false,
  },

  // SECURITY
  {
    id: 'find-no-mfa',
    title: 'Find Users Without MFA',
    description: 'Shows all active users who do not have multi-factor authentication enabled.',
    why: 'Accounts without MFA are the single biggest security risk in most Microsoft 365 tenants. Microsoft reports that MFA blocks over 99% of account compromise attacks. This scan gives you a full list of exposed accounts so you can act immediately.',
    category: 'security',
    keywords: ['mfa', 'multi factor', 'no mfa', 'find', 'missing', 'security', 'unprotected'],
    parameters:[
      { id: 'targets', label: 'Which users?', type: 'select', options: ['All admins without MFA', 'Users from previous scan'] }
    ],
    schedulable: false,
    destructive: false,
  },
  {
    id: 'enforce-mfa-admins',
    title: 'Enforce MFA for Admins',
    description: 'Requires MFA for all users with admin roles in your tenant.',
    why: 'Admin accounts without MFA are catastrophic if compromised — an attacker gets full control of your entire tenant. This identifies every admin without MFA registered so you can enforce it before an incident forces you to.',
    category: 'security',
    keywords: ['enforce', 'mfa', 'admins', 'require', 'force', 'security', 'admin roles'],
    parameters: [], // ← empty, no dropdown
    schedulable: false,
    destructive: false,
  },
  {
    id: 'reset-mfa-user',
    title: 'Reset MFA for User',
    description: 'Clears MFA registration for a user so they can re-enroll.',
    why: 'When a user loses their phone, gets a new device, or locks themselves out of their authenticator, they\'re completely stuck until MFA is reset. This clears their registered methods immediately so they can re-enroll on their next sign-in.',
    category: 'security',
    keywords: ['reset', 'mfa', 'user', 'clear', 'lost', 'authenticator', 'phone'],
    parameters: [
      { id: 'user', label: 'Which user?', type: 'user-picker' },
    ],
    schedulable: false,
    destructive: false,
  },
  {
    id: 'revoke-sessions',
    title: 'Revoke Active User Sessions',
    description: 'Immediately signs out a user from all devices and applications.',
    why: 'Active sessions persist even after password changes, sometimes for up to an hour. If you suspect an account is compromised or a device is lost, revoking sessions immediately cuts off all active access across every app and device.',
    category: 'security',
    keywords: ['revoke', 'sessions', 'sign out', 'kick', 'logout', 'tokens', 'access'],
    parameters: [
      { id: 'user', label: 'Which user?', type: 'user-picker' },
    ],
    schedulable: false,
    destructive: false,
  },
  {
    id: 'remove-admin-roles',
    title: 'Remove Admin Roles from User',
    description: 'Strips all admin privileges from a user account.',
    why: 'Admin privileges that outlive their purpose are a serious governance risk. Former project leads, contractors, or employees who changed roles often retain admin access nobody remembers they have. This removes all assigned roles immediately.',
    category: 'security',
    keywords: ['remove', 'admin', 'roles', 'privileges', 'demote', 'strip'],
    parameters: [
      { id: 'user', label: 'Which user?', type: 'user-picker' },
    ],
    schedulable: false,
    destructive: false,
  },

  // MAILBOX
  {
    id: 'convert-shared-mailbox',
    title: 'Convert Mailbox to Shared',
    description: 'Converts a regular mailbox to a shared mailbox.',
    why: 'Shared mailboxes under 50GB don\'t need a paid license — saving you $6–$22/user/month. This is the most common post-offboarding step: instead of deleting the mailbox, convert it so the team can still access it without paying for a full seat.',
    category: 'mailbox',
    keywords: ['convert', 'shared', 'mailbox', 'license', 'save', 'cost'],
    parameters: [
      { id: 'user', label: 'Which mailbox?', type: 'user-picker' },
    ],
    schedulable: false,
    destructive: false,
  },
  {
    id: 'add-mailbox-delegate',
    title: 'Add Mailbox Delegate',
    description: 'Give another user access to read and send from a mailbox.',
    why: 'Delegating mailbox access is one of the most common admin requests — an EA needs access to their exec\'s inbox, a manager needs to send from a team address. This walks you through the exact steps without hunting through Exchange admin center menus.',
    category: 'mailbox',
    keywords: ['delegate', 'mailbox', 'access', 'give', 'share', 'permission'],
    parameters: [
      { id: 'mailbox', label: 'Which mailbox?', type: 'user-picker' },
      { id: 'delegate', label: 'Who should have access?', type: 'user-picker' },
      { id: 'permission', label: 'What level of access?', type: 'select', options: ['Read only', 'Read and send', 'Full access'] },
    ],
    schedulable: false,
    destructive: false,
  },

  // TEAMS / GUESTS
  {
    id: 'remove-teams-guests',
    title: 'Remove External Teams Guests',
    description: 'Removes guest users from Teams channels.',
    why: 'Guest accounts accumulate over time — contractors who finished, partners from old projects, vendors you no longer work with. Every external guest is a potential data exposure risk. This cleans them all out in one pass.',
    category: 'teams',
    keywords: ['guests', 'external', 'teams', 'remove', 'clean', 'access'],
    parameters: [
      { id: 'scope', label: 'Which guests?', type: 'select', options: ['All guests across all teams', 'Guests in a specific team', 'Guests inactive for 90+ days'] },
    ],
    schedulable: true,
    destructive: true,
  },
  {
    id: 'list-teams-no-owners',
    title: 'List Teams Without Owners',
    description: 'Finds Microsoft Teams that have no active owner assigned.',
    why: 'Ownerless Teams are a governance and security risk — nobody is responsible for membership, settings, or sensitive content. This is one of the most common findings in M365 audits and often leads to data exposure nobody planned for.',
    category: 'teams',
    keywords: ['teams', 'owners', 'no owner', 'orphaned', 'unowned', 'governance'],
    parameters: [],
    schedulable: false,
    destructive: false,
  },
];

export function searchActions(query: string): Action[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return actions.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    a.keywords.some(k => k.includes(q) || q.includes(k))
  );
}