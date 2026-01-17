import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { config } from './env';

const blobServiceClient = BlobServiceClient.fromConnectionString(
  config.azure.storageConnectionString
);

export const containerName = config.azure.storageContainer;

export async function getContainerClient() {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  // Don't set public access - use SAS tokens instead
  await containerClient.createIfNotExists();
  return containerClient;
}

/**
 * Generate a SAS token for a blob URL
 * This allows temporary read access without making the blob public
 */
export function generateBlobSASUrl(blobUrl: string, expiresInHours: number = 24 * 7): string {
  try {
    // Parse the blob URL to get container and blob name
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split('/').filter(p => p);
    const containerNameFromUrl = pathParts[0];
    const blobName = pathParts.slice(1).join('/');

    // Get account name and key from connection string
    const connectionString = config.azure.storageConnectionString;
    const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
    const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);

    if (!accountNameMatch || !accountKeyMatch) {
      console.warn('Could not parse storage account credentials for SAS token');
      return blobUrl; // Return original URL if we can't generate SAS
    }

    const accountName = accountNameMatch[1];
    const accountKey = accountKeyMatch[1];

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const containerClient = blobServiceClient.getContainerClient(containerNameFromUrl);
    const blobClient = containerClient.getBlobClient(blobName);

    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + expiresInHours);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: containerNameFromUrl,
        blobName: blobName,
        permissions: BlobSASPermissions.parse('r'), // Read only
        expiresOn: expiresOn,
      },
      sharedKeyCredential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  } catch (error) {
    console.error('Error generating SAS URL:', error);
    return blobUrl; // Return original URL on error
  }
}

export default blobServiceClient;
