'use server';

import { Client } from '@microsoft/microsoft-graph-client';

const initializeGraphClient = (accessToken: string) => {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
};

export async function getUserDetails(accessToken: string) {
  const client = initializeGraphClient(accessToken);
  return await client.api('/me').get();
}

export async function getUsers(accessToken: string) {
  const client = initializeGraphClient(accessToken);
  const users = await client
    .api('/users')
    .select('id,displayName,mail,assignedLicenses,userPrincipalName,accountEnabled,createdDateTime,signInActivity')
    .get();
  return users;
}

export async function getLicenses(accessToken: string) {
  const client = initializeGraphClient(accessToken);
  const licenses = await client
    .api('/subscribedSkus')
    .select('skuPartNumber,consumedUnits,prepaidUnits,skuId')
    .get();
  return licenses;
}

export async function getUsersWithAuthMethods(accessToken: string) {
  const client = initializeGraphClient(accessToken);
  const users = await client
    .api('/users')
    .select('id,displayName,userPrincipalName,accountEnabled,assignedLicenses')
    .filter('accountEnabled eq true')
    .get();
  return users;
}

export async function getAuthMethodsForUser(accessToken: string, userId: string) {
  const client = initializeGraphClient(accessToken);
  try {
    return await client.api(`/users/${userId}/authentication/methods`).get();
  } catch {
    return { value: [] };
  }
}

export async function getDirectoryRoles(accessToken: string) {
  const client = initializeGraphClient(accessToken);
  return await client.api('/directoryRoles').get();
}

export async function getRoleMembers(accessToken: string, roleId: string) {
  const client = initializeGraphClient(accessToken);
  try {
    return await client
      .api(`/directoryRoles/${roleId}/members`)
      .select('id,displayName,userPrincipalName,accountEnabled,assignedLicenses')
      .get();
  } catch {
    return { value: [] };
  }
}

export async function getGuestUsers(accessToken: string) {
  const client = initializeGraphClient(accessToken);
  return await client
    .api('/users')
    .select('id,displayName,userPrincipalName,mail,createdDateTime,signInActivity,accountEnabled')
    .filter("userType eq 'Guest'")
    .get();
}