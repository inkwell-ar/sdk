import Arweave from 'arweave';

/**
 * Initializes a default Arweave instance.
 */
export const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

export async function sleep(delay: number = 3000) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Parses a gateway URL and returns an object containing the host, port, and protocol.
 *
 * @param url - The gateway URL to be parsed.
 * @returns An object with the host, port, and protocol of the URL.
 */
function parseGatewayUrl(url: string): {
  host: string;
  port: number;
  protocol: string;
} {
  const parsedUrl = new URL(url);
  return {
    host: parsedUrl.hostname,
    port: parsedUrl.port ? Number.parseInt(parsedUrl.port, 10) : 443,
    protocol: parsedUrl.protocol.replace(':', ''),
  };
}

/**
 * Initializes an Arweave instance with a custom gateway.
 *
 * @param gateway - The gateway URL to connect to.
 * @returns An Arweave instance configured with the provided gateway.
 */
export function getArweave(gateway?: string) {
  try {
    if (!gateway) return arweave;
    const { host, port, protocol } = parseGatewayUrl(gateway);
    return Arweave.init({ host, port, protocol });
  } catch {
    return arweave;
  }
}

/**
 * Retries a given function up to a maximum number of attempts.
 * @param fn - The asynchronous function to retry, which should return a Promise.
 * @param maxAttempts - The maximum number of attempts to make.
 * @param initialDelay - The delay between attempts in milliseconds.
 * @param getDelay - A function that returns the delay for a given attempt.
 * @return A Promise that resolves with the result of the function or rejects after all attempts fail.
 */
export async function retryWithDelay<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000,
  getDelay: (attempt: number) => number = () => initialDelay
): Promise<T> {
  let attempts = 0;

  const attempt = async (): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      attempts += 1;
      if (attempts < maxAttempts) {
        const currentDelay = getDelay(attempts);
        // console.log(`Attempt ${attempts} failed, retrying...`)
        return new Promise<T>((resolve) =>
          setTimeout(() => resolve(attempt()), currentDelay)
        );
      } else {
        throw error;
      }
    }
  };

  return attempt();
}

interface PollingOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
}

export const TRANSACTION_QUERY = `query ($ids: [ID!]!) {
    transactions(ids: $ids) {
      edges {
        node {
          id
        }
      }
    }
  }`;

export async function pollForProcessSpawn({
  processId,
  gatewayUrl,
  options = {},
}: {
  processId: string;
  gatewayUrl?: string;
  options?: PollingOptions;
}): Promise<void> {
  const {
    maxAttempts = 10,
    initialDelayMs = 3000,
    backoffFactor = 1.5,
  } = options;

  const arweave = getArweave(gatewayUrl);

  const queryTransaction = async () => {
    const response = await arweave.api.post('/graphql', {
      query: TRANSACTION_QUERY,
      variables: { ids: [processId] },
    });

    const transaction = response?.data?.data?.transactions?.edges?.[0]?.node;
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  };

  try {
    await retryWithDelay(
      queryTransaction,
      maxAttempts,
      initialDelayMs,
      (attempt) => initialDelayMs * Math.pow(backoffFactor, attempt - 1)
    );
  } catch {
    throw new Error(
      `Failed to find process ${processId} after ${maxAttempts} attempts. The process may still be spawning.`
    );
  }
}
