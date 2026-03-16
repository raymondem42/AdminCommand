// src/app/api/actions/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Client } from '@microsoft/microsoft-graph-client';

function getClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

function getToken(session: any): string | null {
  return session?.accessToken ?? null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const token = getToken(session);
  const tokenStr = token;

  if (!tokenStr) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id: actionId } = await params;
  const body = await req.json();
  const client = getClient(tokenStr);
  

  // ... rest unchanged
  try {
    switch (actionId) {

      // ─── LICENSE ─────────────────────────────────────────────────────────

      case 'remove-licenses-disabled': {
        // Get all disabled users with licenses
        const res = await client
          .api('/users')
          .select('id,displayName,userPrincipalName,accountEnabled,assignedLicenses')
          .filter('accountEnabled eq false')
          .get();

        const disabledWithLicenses = (res.value ?? []).filter(
          (u: any) => u.assignedLicenses?.length > 0
        );

        if (disabledWithLicenses.length === 0) {
          return NextResponse.json({
            success: true,
            summary: 'No disabled users with licenses found.',
            details: [],
          });
        }

        const results = [];
        for (const user of disabledWithLicenses) {
          const skuIds = user.assignedLicenses.map((l: any) => l.skuId);
          await client.api(`/users/${user.id}/assignLicense`).post({
            addLicenses: [],
            removeLicenses: skuIds,
          });
          results.push({
            user: user.displayName,
            upn: user.userPrincipalName,
            licensesRemoved: skuIds.length,
          });
        }

        return NextResponse.json({
          success: true,
          summary: `Removed licenses from ${results.length} disabled user${results.length !== 1 ? 's' : ''}.`,
          details: results,
        });
      }

      case 'find-unused-licenses': {
        const res = await client
          .api('/subscribedSkus')
          .select('skuPartNumber,skuId,consumedUnits,prepaidUnits')
          .get();

        const unused = (res.value ?? [])
          .filter((sku: any) => sku.prepaidUnits?.enabled > sku.consumedUnits)
          .map((sku: any) => ({
            name: sku.skuPartNumber,
            purchased: sku.prepaidUnits?.enabled,
            assigned: sku.consumedUnits,
            unused: sku.prepaidUnits?.enabled - sku.consumedUnits,
          }));

        return NextResponse.json({
          success: true,
          summary: unused.length > 0
            ? `Found ${unused.length} license SKU${unused.length !== 1 ? 's' : ''} with unused seats.`
            : 'All purchased licenses are fully assigned.',
          details: unused,
        });
      }

      case 'remove-shared-mailbox-licenses': {
        // Get all shared mailboxes via Graph
        const res = await client
          .api('/users')
          .select('id,displayName,userPrincipalName,assignedLicenses,userType')
          .filter("userType eq 'Member'")
          .get();

        // Shared mailboxes show up as users with no sign-in allowed
        // We identify them by checking mailbox settings — best signal is
        // looking for accounts where displayName or UPN contains "shared"
        // OR where the account has licenses but accountEnabled is false
        // For now we check for blocked sign-in + licenses (proxy for shared)
        const allUsers = await client
          .api('/users')
          .select('id,displayName,userPrincipalName,assignedLicenses,accountEnabled,mail')
          .get();

        const sharedWithLicenses = (allUsers.value ?? []).filter(
          (u: any) =>
            u.accountEnabled === false &&
            u.assignedLicenses?.length > 0 &&
            u.mail
        );

        if (sharedWithLicenses.length === 0) {
          return NextResponse.json({
            success: true,
            summary: 'No shared mailboxes with unnecessary licenses found.',
            details: [],
          });
        }

        const results = [];
        for (const user of sharedWithLicenses) {
          const skuIds = user.assignedLicenses.map((l: any) => l.skuId);
          await client.api(`/users/${user.id}/assignLicense`).post({
            addLicenses: [],
            removeLicenses: skuIds,
          });
          results.push({
            mailbox: user.displayName,
            upn: user.userPrincipalName,
            licensesRemoved: skuIds.length,
          });
        }

        return NextResponse.json({
          success: true,
          summary: `Removed licenses from ${results.length} shared mailbox${results.length !== 1 ? 'es' : ''}.`,
          details: results,
        });
      }

      case 'find-overprovisioned': {
        const usersRes = await client
          .api('/users')
          .select('id,displayName,userPrincipalName,assignedLicenses,signInActivity')
          .get();

        const skusRes = await client
          .api('/subscribedSkus')
          .select('skuId,skuPartNumber')
          .get();

        const skuMap: Record<string, string> = {};
        for (const sku of skusRes.value ?? []) {
          skuMap[sku.skuId] = sku.skuPartNumber;
        }

        const expensiveSkus = ['ENTERPRISEPREMIUM', 'SPE_E5', 'ENTERPRISEPACK', 'SPE_E3'];

        const overprovisioned = (usersRes.value ?? [])
          .filter((u: any) =>
            u.assignedLicenses?.some((l: any) =>
              expensiveSkus.some(e => (skuMap[l.skuId] ?? '').includes(e))
            )
          )
          .map((u: any) => ({
            user: u.displayName,
            upn: u.userPrincipalName,
            licenses: u.assignedLicenses.map((l: any) => skuMap[l.skuId] ?? l.skuId),
            lastSignIn: u.signInActivity?.lastSignInDateTime ?? 'Unknown',
          }));

        return NextResponse.json({
          success: true,
          summary: `Found ${overprovisioned.length} user${overprovisioned.length !== 1 ? 's' : ''} on premium licenses who may be overprovisioned.`,
          details: overprovisioned,
        });
      }

      // ─── USER LIFECYCLE ───────────────────────────────────────────────────

      case 'disable-inactive-users': {
        const days = parseInt(body.days ?? '90', 10);
        const removeLicenses = body.removeLicenses === 'Yes — save money';
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const res = await client
          .api('/users')
          .select('id,displayName,userPrincipalName,accountEnabled,assignedLicenses,signInActivity')
          .filter('accountEnabled eq true')
          .get();

        const inactive = (res.value ?? []).filter((u: any) => {
          const lastSignIn = u.signInActivity?.lastSignInDateTime;
          if (!lastSignIn) return true; // never signed in
          return new Date(lastSignIn) < cutoff;
        });

        if (inactive.length === 0) {
          return NextResponse.json({
            success: true,
            summary: `No users inactive for ${days}+ days found.`,
            details: [],
          });
        }

        const results = [];
        for (const user of inactive) {
          await client.api(`/users/${user.id}`).patch({
            accountEnabled: false,
          });

          let licensesRemoved = 0;
          if (removeLicenses && user.assignedLicenses?.length > 0) {
            const skuIds = user.assignedLicenses.map((l: any) => l.skuId);
            await client.api(`/users/${user.id}/assignLicense`).post({
              addLicenses: [],
              removeLicenses: skuIds,
            });
            licensesRemoved = skuIds.length;
          }

          results.push({
            user: user.displayName,
            upn: user.userPrincipalName,
            lastSignIn: user.signInActivity?.lastSignInDateTime ?? 'Never',
            licensesRemoved,
          });
        }

        return NextResponse.json({
          success: true,
          summary: `Disabled ${results.length} inactive user${results.length !== 1 ? 's' : ''}${removeLicenses ? ' and removed their licenses' : ''}.`,
          details: results,
        });
      }

      case 'force-password-reset': {
        const scope = body.scope ?? 'Select users manually';
        let users: any[] = [];

        if (scope === 'All users') {
          const res = await client
            .api('/users')
            .select('id,displayName,userPrincipalName,accountEnabled')
            .filter('accountEnabled eq true')
            .get();
          users = res.value ?? [];
        } else if (scope === 'All admins') {
          const res = await client
            .api('/directoryRoles')
            .get();
          const adminRoles = res.value ?? [];
          const memberSets = await Promise.all(
            adminRoles.map((role: any) =>
              client.api(`/directoryRoles/${role.id}/members`)
                .select('id,displayName,userPrincipalName')
                .get()
                .then((r: any) => r.value ?? [])
                .catch(() => [])
            )
          );
          const seen = new Set();
          for (const members of memberSets) {
            for (const m of members) {
              if (!seen.has(m.id)) {
                seen.add(m.id);
                users.push(m);
              }
            }
          }
        }

        if (users.length === 0) {
          return NextResponse.json({
            success: true,
            summary: 'No users matched the selected scope.',
            details: [],
          });
        }

        const results = [];
        for (const user of users) {
          await client.api(`/users/${user.id}`).patch({
            passwordProfile: {
              forceChangePasswordNextSignIn: true,
            },
          });
          results.push({ user: user.displayName, upn: user.userPrincipalName });
        }

        return NextResponse.json({
          success: true,
          summary: `Forced password reset for ${results.length} user${results.length !== 1 ? 's' : ''}.`,
          details: results,
        });
      }

      case 'force-signout': {
        const userId = body.user;
        if (!userId) {
          return NextResponse.json({ error: 'No user specified.' }, { status: 400 });
        }

        const user = await client
          .api(`/users/${userId}`)
          .select('displayName,userPrincipalName')
          .get();

        await client.api(`/users/${userId}/revokeSignInSessions`).post({});

        return NextResponse.json({
          success: true,
          summary: `Signed out ${user.displayName} from all sessions. Token revocation may take a few minutes to propagate.`,
          details: [{ user: user.displayName, upn: user.userPrincipalName }],
        });
      }

      case 'offboard-employee': {
        const userId = body.user;
        if (!userId) {
          return NextResponse.json({ error: 'No user specified.' }, { status: 400 });
        }

        const user = await client
          .api(`/users/${userId}`)
          .select('id,displayName,userPrincipalName,assignedLicenses')
          .get();

        const steps = [];

        // 1. Disable account
        await client.api(`/users/${userId}`).patch({ accountEnabled: false });
        steps.push('✓ Account disabled');

        // 2. Revoke all sessions
        await client.api(`/users/${userId}/revokeSignInSessions`).post({});
        steps.push('✓ All active sessions revoked');

        // 3. Remove licenses
        if (user.assignedLicenses?.length > 0) {
          const skuIds = user.assignedLicenses.map((l: any) => l.skuId);
          await client.api(`/users/${userId}/assignLicense`).post({
            addLicenses: [],
            removeLicenses: skuIds,
          });
          steps.push(`✓ ${skuIds.length} license${skuIds.length !== 1 ? 's' : ''} removed`);
        }

        // 4. Remove from all groups
        const memberOf = await client
          .api(`/users/${userId}/memberOf`)
          .select('id,displayName')
          .get();

        const groups = (memberOf.value ?? []).filter((g: any) => g['@odata.type'] === '#microsoft.graph.group');
        for (const group of groups) {
          await client
            .api(`/groups/${group.id}/members/${userId}/$ref`)
            .delete()
            .catch(() => {}); // skip if dynamic group
        }
        if (groups.length > 0) {
          steps.push(`✓ Removed from ${groups.length} group${groups.length !== 1 ? 's' : ''}`);
        }

        // 5. Remove admin roles
        const dirRoles = await client
          .api(`/users/${userId}/memberOf/microsoft.graph.directoryRole`)
          .get()
          .catch(() => ({ value: [] }));

        for (const role of dirRoles.value ?? []) {
          await client
            .api(`/directoryRoles/${role.id}/members/${userId}/$ref`)
            .delete()
            .catch(() => {});
        }
        if ((dirRoles.value ?? []).length > 0) {
          steps.push(`✓ Removed from ${dirRoles.value.length} admin role${dirRoles.value.length !== 1 ? 's' : ''}`);
        }

        // 6. Mailbox — requires Exchange, link out
        const exchangeUrl = `https://admin.exchange.microsoft.com/#/mailboxes`;
        steps.push(`⚠ Mailbox conversion/forwarding requires Exchange Admin Center`);

        return NextResponse.json({
          success: true,
          summary: `${user.displayName} has been offboarded. ${steps.filter(s => s.startsWith('✓')).length} steps completed automatically.`,
          details: steps,
          exchangeUrl,
          exchangeNote: body.convertMailbox === 'Yes'
            ? `To convert the mailbox to shared and set up forwarding, go to the Exchange Admin Center → Recipients → Mailboxes → find ${user.displayName}.`
            : null,
        });
      }

      case 'onboard-user': {
        const { name, email, license } = body;
        if (!name || !email) {
          return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
        }

        const [displayName, ...rest] = name.trim().split(' ');
        const surname = rest.join(' ') || '';

        // Create user
        const newUser = await client.api('/users').post({
          displayName: name,
          givenName: displayName,
          surname,
          userPrincipalName: email,
          mailNickname: email.split('@')[0],
          accountEnabled: true,
          passwordProfile: {
            forceChangePasswordNextSignIn: true,
            password: `Temp-${Math.random().toString(36).slice(2, 10)}!`,
          },
        });

        const steps = [`✓ Account created for ${name}`];

        // Assign license if selected
        if (license && license !== 'No license yet') {
          const skusRes = await client
            .api('/subscribedSkus')
            .select('skuId,skuPartNumber,consumedUnits,prepaidUnits')
            .get();

          const skuMap: Record<string, string> = {
            'Microsoft 365 Business Basic': 'O365_BUSINESS_ESSENTIALS',
            'Microsoft 365 Business Standard': 'O365_BUSINESS_PREMIUM',
            'Microsoft 365 Business Premium': 'SPB',
            'Microsoft 365 E3': 'SPE_E3',
            'Microsoft 365 E5': 'SPE_E5',
          };

          const targetSku = skusRes.value?.find((s: any) =>
            s.skuPartNumber === skuMap[license] &&
            s.prepaidUnits?.enabled > s.consumedUnits
          );

          if (targetSku) {
            await client.api(`/users/${newUser.id}/assignLicense`).post({
              addLicenses: [{ skuId: targetSku.skuId }],
              removeLicenses: [],
            });
            steps.push(`✓ ${license} license assigned`);
          } else {
            steps.push(`⚠ No available ${license} seats found — license not assigned`);
          }
        }

        return NextResponse.json({
          success: true,
          summary: `${name} has been onboarded successfully.`,
          details: steps,
        });
      }

      // ─── SECURITY ─────────────────────────────────────────────────────────

      case 'find-no-mfa': {
        const usersRes = await client
          .api('/users')
          .select('id,displayName,userPrincipalName,accountEnabled')
          .filter('accountEnabled eq true')
          .get();

        const authMethodChecks = await Promise.all(
          (usersRes.value ?? []).map(async (u: any) => {
            const methods = await client
              .api(`/users/${u.id}/authentication/methods`)
              .get()
              .catch(() => ({ value: [] }));

            const hasMfa = (methods.value ?? []).some((m: any) =>
              m['@odata.type'] !== '#microsoft.graph.passwordAuthenticationMethod'
            );

            return hasMfa ? null : { user: u.displayName, upn: u.userPrincipalName };
          })
        );

        const noMfa = authMethodChecks.filter(Boolean);

        return NextResponse.json({
          success: true,
          summary: noMfa.length > 0
            ? `${noMfa.length} active user${noMfa.length !== 1 ? 's' : ''} have no MFA method registered.`
            : 'All active users have MFA registered.',
          details: noMfa,
        });
      }

      case 'reset-mfa-user': {
        const userId = body.user;
        if (!userId) {
          return NextResponse.json({ error: 'No user specified.' }, { status: 400 });
        }

        const user = await client
          .api(`/users/${userId}`)
          .select('displayName,userPrincipalName')
          .get();

        const methods = await client
          .api(`/users/${userId}/authentication/methods`)
          .get();

        const toDelete = (methods.value ?? []).filter(
          (m: any) => m['@odata.type'] !== '#microsoft.graph.passwordAuthenticationMethod'
        );

        for (const method of toDelete) {
          const typeSegment = method['@odata.type']
            .replace('#microsoft.graph.', '')
            .replace('AuthenticationMethod', 'AuthenticationMethods');

          await client
            .api(`/users/${userId}/authentication/${typeSegment}/${method.id}`)
            .delete()
            .catch(() => {});
        }

        return NextResponse.json({
          success: true,
          summary: `MFA reset for ${user.displayName}. They will need to re-enroll on next sign-in.`,
          details: [{ user: user.displayName, upn: user.userPrincipalName, methodsCleared: toDelete.length }],
        });
      }

      case 'revoke-sessions': {
        const userId = body.user;
        if (!userId) {
          return NextResponse.json({ error: 'No user specified.' }, { status: 400 });
        }

        const user = await client
          .api(`/users/${userId}`)
          .select('displayName,userPrincipalName')
          .get();

        await client.api(`/users/${userId}/revokeSignInSessions`).post({});

        return NextResponse.json({
          success: true,
          summary: `All sessions revoked for ${user.displayName}. May take a few minutes to fully propagate.`,
          details: [{ user: user.displayName, upn: user.userPrincipalName }],
        });
      }

      case 'remove-admin-roles': {
        const userId = body.user;
        if (!userId) {
          return NextResponse.json({ error: 'No user specified.' }, { status: 400 });
        }

        const user = await client
          .api(`/users/${userId}`)
          .select('displayName,userPrincipalName')
          .get();

        const roles = await client
          .api(`/users/${userId}/memberOf/microsoft.graph.directoryRole`)
          .get()
          .catch(() => ({ value: [] }));

        if ((roles.value ?? []).length === 0) {
          return NextResponse.json({
            success: true,
            summary: `${user.displayName} has no admin roles assigned.`,
            details: [],
          });
        }

        const removed = [];
        for (const role of roles.value) {
          await client
            .api(`/directoryRoles/${role.id}/members/${userId}/$ref`)
            .delete()
            .catch(() => {});
          removed.push(role.displayName);
        }

        return NextResponse.json({
          success: true,
          summary: `Removed ${removed.length} admin role${removed.length !== 1 ? 's' : ''} from ${user.displayName}.`,
          details: removed.map(r => ({ role: r })),
        });
      }

case 'enforce-mfa-admins': {
        const selectedUpns: string[] = body.selectedUpns ? JSON.parse(body.selectedUpns) : [];
        const preloaded = body.preloadedUsers ? JSON.parse(body.preloadedUsers) : [];

        let usersToTarget: any[] = [];

        if (preloaded.length > 0 && selectedUpns.length > 0) {
          usersToTarget = preloaded.filter((u: any) => selectedUpns.includes(u.upn));
        } else {
          const rolesRes = await client.api('/directoryRoles').get();
          const seen = new Set();
          for (const role of rolesRes.value ?? []) {
            const members = await client
              .api(`/directoryRoles/${role.id}/members`)
              .select('id,displayName,userPrincipalName')
              .get()
              .catch(() => ({ value: [] }));
            for (const m of members.value ?? []) {
              if (!seen.has(m.id)) {
                seen.add(m.id);
                const methods = await client
                  .api(`/users/${m.id}/authentication/methods`)
                  .get()
                  .catch(() => ({ value: [] }));
                const hasMfa = (methods.value ?? []).some(
                  (x: any) => x['@odata.type'] !== '#microsoft.graph.passwordAuthenticationMethod'
                );
                if (!hasMfa) usersToTarget.push({ user: m.displayName, upn: m.userPrincipalName });
              }
            }
          }
        }

        if (usersToTarget.length === 0) {
          return NextResponse.json({
            success: true,
            summary: 'All targeted users already have MFA registered.',
            details: [],
          });
        }

        // Get user IDs
        const userIds: string[] = [];
        const userDetails: any[] = [];

        for (const u of usersToTarget) {
          try {
            const userObj = await client
              .api(`/users/${u.upn}`)
              .select('id,displayName,userPrincipalName')
              .get();
            userIds.push(userObj.id);
            userDetails.push({ user: u.user, upn: u.upn, id: userObj.id });
          } catch {}
        }

        if (userIds.length === 0) {
          return NextResponse.json({ error: 'Could not resolve any user IDs.' }, { status: 400 });
        }

        const policyName = `AdminCommand — Require MFA (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;

        const fallbackDetails = userDetails.map(u => ({
          type: 'fallback',
          user: u.user,
          upn: u.upn,
          entraUrl: `https://entra.microsoft.com/#view/Microsoft_AAD_UsersAndTenants/UserProfileMenuBlade/~/UserAuthMethods/userId/${u.id}`,
        }));

        try {
          const policy = await client.api('/identity/conditionalAccess/policies').post({
            displayName: policyName,
            state: 'enabled',
            conditions: {
              users: {
                includeUsers: userIds,
              },
              applications: {
                includeApplications: ['All'],
              },
              clientAppTypes: ['all'],
            },
            grantControls: {
              operator: 'OR',
              builtInControls: ['mfa'],
            },
          });

          return NextResponse.json({
            success: true,
            summary: `MFA policy created for ${userDetails.length} user${userDetails.length !== 1 ? 's' : ''}. They will be required to register MFA on next sign-in.`,
            details: userDetails.map(u => ({ ...u, type: 'success' })),
            policyName,
            policyId: policy.id,
            entraUrl: `https://entra.microsoft.com/#view/Microsoft_AAD_ConditionalAccess/PolicyBlade/policyId/${policy.id}`,
          });

        } catch (policyErr: any) {
          const isLicenseError =
            policyErr?.statusCode === 403 ||
            policyErr?.message?.includes('not licensed') ||
            policyErr?.message?.includes('AccessDenied');

          if (isLicenseError) {
            return NextResponse.json({
              success: true,
              summary: `Conditional Access requires Entra ID P1 — your tenant isn't licensed for it. Use the links below to enable MFA per user directly.`,
              details: fallbackDetails,
              licenseNote: true,
            });
          }

          console.error('Policy creation failed:', policyErr?.message, policyErr?.statusCode);
          return NextResponse.json({
            success: true,
            summary: `Couldn't create policy automatically — use the links below to enable MFA for each user.`,
            details: fallbackDetails,
          });
        }
      }


      // ─── MAILBOX ──────────────────────────────────────────────────────────

      case 'convert-shared-mailbox': {
        const userId = body.user;
        if (!userId) {
          return NextResponse.json({ error: 'No mailbox specified.' }, { status: 400 });
        }

        const user = await client
          .api(`/users/${userId}`)
          .select('displayName,userPrincipalName')
          .get();

        // Graph cannot convert mailbox type — link to EAC
        return NextResponse.json({
          success: true,
          summary: `Ready to convert ${user.displayName}'s mailbox to shared.`,
          details: [
            '⚠ Mailbox conversion requires the Exchange Admin Center — Microsoft Graph does not support this operation directly.',
            `Go to Exchange Admin Center → Recipients → Mailboxes → find ${user.displayName} → Convert to Shared Mailbox.`,
            'Important: The user must have a license assigned before conversion. You can remove it after converting.',
          ],
          exchangeUrl: 'https://admin.exchange.microsoft.com/#/mailboxes',
        });
      }

      case 'add-mailbox-delegate': {
        const mailboxId = body.mailbox;
        const delegateId = body.delegate;
        const permission = body.permission ?? 'Read and send';

        if (!mailboxId || !delegateId) {
          return NextResponse.json({ error: 'Mailbox and delegate are required.' }, { status: 400 });
        }

        const [mailbox, delegate] = await Promise.all([
          client.api(`/users/${mailboxId}`).select('displayName,userPrincipalName').get(),
          client.api(`/users/${delegateId}`).select('displayName,userPrincipalName').get(),
        ]);

        return NextResponse.json({
          success: true,
          summary: `To give ${delegate.displayName} access to ${mailbox.displayName}'s mailbox.`,
          details: [
            '⚠ Mailbox delegation requires the Exchange Admin Center.',
            `Go to Exchange Admin Center → Recipients → Mailboxes → select ${mailbox.displayName} → Delegation tab → add ${delegate.displayName} under "${permission === 'Read only' ? 'Read and manage' : 'Send as'}" permissions.`,
          ],
          exchangeUrl: 'https://admin.exchange.microsoft.com/#/mailboxes',
        });
      }

      // ─── TEAMS / GUESTS ───────────────────────────────────────────────────

case 'remove-teams-guests': {
        const selectedUpns: string[] = body.selectedUpns ? JSON.parse(body.selectedUpns) : [];
        const preloaded = body.preloadedUsers ? JSON.parse(body.preloadedUsers) : [];

        let guestsToRemove: any[] = [];

        if (preloaded.length > 0 && selectedUpns.length > 0) {
          guestsToRemove = preloaded.filter((u: any) => selectedUpns.includes(u.upn));
        } else {
          const res = await client
            .api('/users')
            .select('id,displayName,userPrincipalName,userType')
            .filter("userType eq 'Guest'")
            .get();
          guestsToRemove = res.value ?? [];
        }

        if (guestsToRemove.length === 0) {
          return NextResponse.json({
            success: true,
            summary: 'No guest users found to remove.',
            details: [],
          });
        }

        const results = [];

        for (const guest of guestsToRemove) {
          try {
            // Use preloaded ID directly to avoid EXT UPN lookup issues
            let userId = guest.id;
            if (!userId) {
              try {
                const res = await client
                  .api('/users')
                  .filter(`userPrincipalName eq '${guest.upn}'`)
                  .select('id')
                  .get();
                userId = res.value?.[0]?.id;
              } catch {}
            }

            if (!userId) {
              results.push({
                user: guest.user ?? guest.displayName ?? guest.upn,
                upn: guest.upn ?? guest.userPrincipalName,
                error: 'Could not resolve user ID',
                type: 'error',
              });
              continue;
            }

            // Remove from all groups and teams first
            const memberOf = await client
              .api(`/users/${userId}/memberOf`)
              .select('id,displayName')
              .get()
              .catch(() => ({ value: [] }));

            for (const group of memberOf.value ?? []) {
              await client
                .api(`/groups/${group.id}/members/${userId}/$ref`)
                .delete()
                .catch(() => {});
            }

            // Delete the guest from the tenant entirely
            await client.api(`/users/${userId}`).delete();

            results.push({
              user: guest.user ?? guest.displayName,
              upn: guest.upn ?? guest.userPrincipalName,
              removedFrom: (memberOf.value ?? []).length,
              type: 'success',
            });
          } catch (e: any) {
            results.push({
              user: guest.user ?? guest.displayName ?? guest.upn,
              upn: guest.upn ?? guest.userPrincipalName,
              error: e.message,
              type: 'error',
            });
          }
        }

        const succeeded = results.filter(r => r.type === 'success');
        const failed = results.filter(r => r.type === 'error');

        return NextResponse.json({
          success: true,
          summary: `Removed ${succeeded.length} guest${succeeded.length !== 1 ? 's' : ''} from your tenant.${failed.length > 0 ? ` ${failed.length} failed.` : ''}`,
          details: results,
        });
      }

      case 'list-teams-no-owners': {
        const groupsRes = await client
          .api('/groups')
          .select('id,displayName,groupTypes')
          .filter("groupTypes/any(c:c eq 'Unified')")
          .get();

        const teamsGroups = groupsRes.value ?? [];
        const noOwners = [];

        for (const group of teamsGroups) {
          const owners = await client
            .api(`/groups/${group.id}/owners`)
            .select('id,displayName,accountEnabled')
            .get()
            .catch(() => ({ value: [] }));

          const activeOwners = (owners.value ?? []).filter((o: any) => o.accountEnabled !== false);

          if (activeOwners.length === 0) {
            noOwners.push({ team: group.displayName, id: group.id });
          }
        }

        return NextResponse.json({
          success: true,
          summary: noOwners.length > 0
            ? `Found ${noOwners.length} Team${noOwners.length !== 1 ? 's' : ''} with no active owners.`
            : 'All Teams have at least one active owner.',
          details: noOwners,
        });
      }

      // ─── REPORTS (redirect to report pages) ───────────────────────────────

      case 'bulk-assign-licenses':
      case 'replace-license':
      case 'bulk-disable-users': {
        return NextResponse.json({
          success: false,
          summary: 'This action requires selecting specific users. Please use the guided flow.',
          details: [],
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${actionId}` }, { status: 404 });
    }

  } catch (err: any) {
    console.error(`Action ${actionId} failed:`, err);
    return NextResponse.json({
      error: err?.message ?? 'Action failed',
      code: err?.statusCode ?? 500,
    }, { status: err?.statusCode ?? 500 });
  }
}