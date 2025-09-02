import { connect, createDataItemSigner } from '@permaweb/aoconnect';
import { BLOG_REGISTRY_PROCESS_ID } from '../config/registry';
import { ACCESS_CONTROL_CONTRACT } from './access-control-contract';
import { LogGroup, LogLevel } from '../types';
import { Logger } from '..';
import { pollForProcessSpawn, retryWithDelay, sleep } from '../utils/utils';
import { BLOG_CONTRACT } from './blog-contract';

export const aosConfig = {
  scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  authority: 'fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY',
  module: 'JArYBF-D8q2OmZ4Mok00sD2Y_6SYEQ7Hjx-6VZ_jl3g',
};

export const defaultServices = {
  gatewayUrl: 'https://arweave.net',
  cuUrl: 'https://cu.ao-testnet.xyz',
  muUrl: 'https://mu.ao-testnet.xyz',
};

// Browser-compatible deployment function
export async function deployBlogInBrowser(options: {
  name?: string;
  wallet?: any;
  aoconnect?: any;
  logLevel?: LogLevel;
  pollForSpawn?: boolean;
  onBoot?: boolean;
}): Promise<{ processId: string; messageId: string }> {
  try {
    const logger = new Logger({ level: options.logLevel || LogLevel.WARN });
    logger.info(
      LogGroup.DEPLOY,
      `Deploying blog process with name: ${options.name || 'unnamed'}`
    );
    // Check if registry is configured
    if (
      !BLOG_REGISTRY_PROCESS_ID ||
      BLOG_REGISTRY_PROCESS_ID.includes('YOUR_REGISTRY_PROCESS_ID')
    ) {
      throw new Error(
        'Registry process ID not configured. Please run the deployment script first: npm run deploy:registry'
      );
    }

    const aoconnect = options.aoconnect || connect({ MODE: 'legacy' });
    logger.debug(LogGroup.DEPLOY, `Using aoconnect: ${aoconnect}`);
    logger.debug(LogGroup.DEPLOY, `Using aoconnect.spawn: ${aoconnect.spawn}`);
    // Get the appropriate signer (similar to blog-sdk.ts getSigner method)
    let signer;
    if (options.wallet) {
      signer = createDataItemSigner(options.wallet);
      logger.debug(LogGroup.DEPLOY, `Using provided wallet for signing`);
    } else {
      // Check for browser wallet
      if (
        typeof globalThis !== 'undefined' &&
        (globalThis as any).arweaveWallet
      ) {
        signer = createDataItemSigner((globalThis as any).arweaveWallet);
        logger.debug(LogGroup.DEPLOY, `Using browser wallet for signing`);
      } else {
        throw new Error(
          'No wallet provided and no browser wallet available. Please provide a wallet or connect a browser wallet.'
        );
      }
    }

    // Replace the registry process ID in the contract
    const contractWithRegistry = BLOG_CONTRACT;
    // const contractWithRegistry = BLOG_CONTRACT.replace(
    //   '${BLOG_REGISTRY_PROCESS_ID}',
    //   BLOG_REGISTRY_PROCESS_ID
    // );
    logger.debug(
      LogGroup.DEPLOY,
      `Using registry process ID: ${BLOG_REGISTRY_PROCESS_ID}`
    );

    // Create the complete contract with both modules
    const completeContract = [ACCESS_CONTROL_CONTRACT, contractWithRegistry]
      .filter(Boolean)
      .join('\n\n')
      .trim();

    logger.debug(
      LogGroup.DEPLOY,
      `Complete contract length: ${completeContract.length}`
    );

    const module = aosConfig.module;
    const scheduler = aosConfig.scheduler;
    let tags = [
      { name: 'App-Name', value: 'Inkwell-Blog' },
      { name: 'App-Version', value: '1.0.0' },
      { name: 'Name', value: options.name || 'Inkwell Blog' },
      { name: 'Author', value: '@7i7o' },
      { name: 'Registry-Process-ID', value: BLOG_REGISTRY_PROCESS_ID },
      { name: 'Authority', value: aosConfig.authority },
    ];

    // Load contract source code when spawning if onBoot is true
    const data = options.onBoot ? completeContract : '1984';
    if (options.onBoot) {
      tags = [...tags, { name: 'On-Boot', value: 'Data' }];
    }

    // Deploy the contract using aoconnect
    const processId = (await retryWithDelay(
      () => aoconnect.spawn({ module, signer, tags, data, scheduler }),
      10,
      3000
    )) as string;

    logger.info(
      LogGroup.DEPLOY,
      `Deployed empty contract with process ID: ${processId}`
    );

    if (options.pollForSpawn) {
      logger.info(LogGroup.DEPLOY, `Polling for process spawn`);
      await pollForProcessSpawn({
        processId,
        gatewayUrl: defaultServices.gatewayUrl,
      });
    } else {
      await sleep(5000);
    }

    let messageId = '';

    // Manually load contract source code to process if onBoot is false
    if (!options.onBoot) {
      try {
        const loadContractResult = await messageProcessAndGetResult({
          processId,
          signer,
          tags: [{ name: 'Action', value: 'Eval' }],
          data: completeContract,
          aoconnect,
        });
        messageId = loadContractResult.messageId;
      } catch (error) {
        logger.error(
          LogGroup.DEPLOY,
          `Failed to load contract to process`,
          error
        );
        throw new Error(
          `Failed to load contract to process: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Sync initial permissions with registry
    try {
      const syncResult = await messageProcessAndGetResult({
        processId,
        signer,
        tags: [{ name: 'Action', value: 'Sync-With-Registry' }],
        data: '',
        aoconnect,
      });

      logger.info(LogGroup.DEPLOY, `Initial permissions synced with registry`);
    } catch (syncError) {
      logger.warn(
        LogGroup.DEPLOY,
        `⚠️ Failed to sync initial permissions with registry: ${syncError}`
      );
      // Don't fail the deployment if sync fails
    }

    return {
      processId: processId as string,
      messageId,
    };
  } catch (error) {
    throw new Error(
      `Failed to deploy Inkwell Blog process: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function messageProcessAndGetResult(options: {
  processId: string;
  signer: any;
  tags: any;
  data: string;
  aoconnect: any;
}) {
  const {
    aoconnect = options.aoconnect,
    processId = options.processId,
    signer = options.signer,
    tags = options.tags,
    data = options.data,
  } = options;

  const messageId = await retryWithDelay(
    async () =>
      aoconnect.message({
        process: processId!,
        tags,
        data,
        signer,
      }),
    10,
    3000
  );

  const results = await retryWithDelay(
    async () =>
      aoconnect.result({
        process: processId!,
        message: messageId,
      }),
    10,
    3000
  );

  const { Output, Error: error } = results;

  let errorMessage = null;

  if (Output?.data?.output) {
    errorMessage = Output.data.output;
  } else if (error) {
    if (typeof error === 'object' && Object.keys(error).length > 0) {
      errorMessage = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }
  }

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  return {
    messageId: messageId as string,
    results,
  };
}
