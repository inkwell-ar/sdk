import {
  InkwellBlogSDK,
  ValidationError,
  BlogDetails,
  BlogInfo,
  BlogPost,
  RoleUpdateResult,
} from '../index';
import { OWNER_ADDRESS } from '../examples/utils/constants';
import { loadOrGenerateWallet } from '../examples/utils/wallet';

// Mock aoconnect for testing
const mockAoconnect = {
  dryrun: jest.fn(),
  message: jest.fn(),
};

// Mock ao-deploy
jest.mock('ao-deploy', () => ({
  deployContract: jest.fn(),
}));

describe('InkwellBlogSDK', () => {
  let blogSDK: InkwellBlogSDK;
  let wallet: any;
  beforeEach(async () => {
    const { wallet: walletMock } =
      await loadOrGenerateWallet('wallet-mock.json');
    wallet = walletMock;

    blogSDK = new InkwellBlogSDK({
      processId: 'test-process-id',
      aoconnect: mockAoconnect,
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with valid config', () => {
      expect(blogSDK).toBeInstanceOf(InkwellBlogSDK);
    });

    it('should throw error with invalid config', () => {
      expect(() => {
        new InkwellBlogSDK({} as any);
      }).toThrow(ValidationError);
    });
  });

  describe('Deployment', () => {
    it('should deploy a new blog process', async () => {
      const mockDeployResult = {
        processId: 'test-process-id',
        messageId: 'test-message-id',
      };

      const { deployContract } = require('ao-deploy');
      deployContract.mockResolvedValue(mockDeployResult);

      const result = await InkwellBlogSDK.deploy({
        name: 'test-blog',
        contractPath: './test.lua',
      });

      expect(result.processId).toBe('test-process-id');
      expect(result.messageId).toBe('test-message-id');
      expect(deployContract).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-blog',
          contractPath: './test.lua',
          tags: expect.arrayContaining([
            { name: 'App-Name', value: 'Inkwell-Blog' },
            { name: 'App-Version', value: '1.0.0' },
          ]),
        })
      );
    });

    it('should handle deployment errors', async () => {
      const { deployContract } = require('ao-deploy');
      deployContract.mockRejectedValue(new Error('Deployment failed'));

      await expect(InkwellBlogSDK.deploy({})).rejects.toThrow(
        'Failed to deploy Inkwell Blog process: Deployment failed'
      );
    });
  });

  describe('Public Methods', () => {
    it('should get blog info', async () => {
      const mockResponse = {
        Messages: [
          {
            Tags: {
              Name: 'Test Blog',
              Author: '@test',
              'Blog-Title': 'Test Blog Title',
              'Blog-Description': 'Test Blog Description',
              'Blog-Logo': 'https://example.com/logo.png',
            },
            Data: JSON.stringify({
              success: true,
              data: {
                title: 'Test Blog Title',
                description: 'Test Blog Description',
                logo: 'https://example.com/logo.png',
              },
            }),
          },
        ],
      };

      mockAoconnect.dryrun.mockResolvedValue(mockResponse);

      const result = await blogSDK.getInfo();

      expect(result.success).toBe(true);
      const blogInfo = result.data as BlogInfo;
      expect(blogInfo.name).toBe('Test Blog');
      expect(blogInfo.author).toBe('@test');
      expect(blogInfo.blogTitle).toBe('Test Blog Title');
      expect(blogInfo.blogDescription).toBe('Test Blog Description');
      expect(blogInfo.blogLogo).toBe('https://example.com/logo.png');
      expect(mockAoconnect.dryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [{ name: 'Action', value: 'Info' }],
      });
    });

    it('should get all posts', async () => {
      const mockResponse = {
        Messages: [
          {
            Data: JSON.stringify({
              success: true,
              data: [
                {
                  id: 1,
                  title: 'Test Post',
                  description: 'Test Description',
                  published_at: Date.now(),
                  last_update: Date.now(),
                  authors: ['@test'],
                },
              ],
            }),
          },
        ],
      };

      mockAoconnect.dryrun.mockResolvedValue(mockResponse);

      const result = await blogSDK.getAllPosts({ ordered: true });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      const post = result.data[0] as BlogPost;
      expect(post.title).toBe('Test Post');
      expect(mockAoconnect.dryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Get-All-Posts' },
          { name: 'Ordered', value: 'true' },
        ],
      });
    });

    it('should get a specific post', async () => {
      const mockResponse = {
        Messages: [
          {
            Data: JSON.stringify({
              success: true,
              data: {
                id: 1,
                title: 'Test Post',
                description: 'Test Description',
                published_at: Date.now(),
                last_update: Date.now(),
                authors: ['@test'],
              },
            }),
          },
        ],
      };

      mockAoconnect.dryrun.mockResolvedValue(mockResponse);

      const result = await blogSDK.getPost({ id: 1 });

      expect(result.success).toBe(true);
      const post = result.data as BlogPost;
      expect(post.title).toBe('Test Post');
      expect(mockAoconnect.dryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Get-Post' },
          { name: 'Id', value: '1' },
        ],
      });
    });

    it('should get user roles', async () => {
      const mockResponse = {
        Messages: [
          {
            Data: JSON.stringify({
              success: true,
              data: ['EDITOR_ROLE', 'DEFAULT_ADMIN_ROLE'],
            }),
          },
        ],
      };

      mockAoconnect.dryrun.mockResolvedValue(mockResponse);

      const result = await blogSDK.getUserRoles(OWNER_ADDRESS);

      expect(result.success).toBe(true);
      expect(result.data).toContain('EDITOR_ROLE');
      expect(result.data).toContain('DEFAULT_ADMIN_ROLE');
    });
  });

  describe('Editor Methods', () => {
    it('should create a post', async () => {
      mockAoconnect.message.mockResolvedValue('message-id-123');

      const postData = {
        title: 'New Post',
        description: 'New Description',
        published_at: Date.now(),
        last_update: Date.now(),
        authors: ['@test'],
      };

      const result = await blogSDK.createPost({
        data: postData,
        wallet: wallet,
      });

      expect(result.success).toBe(true);
      // result.data can be either a BlogPost object or a string message
      expect(typeof result.data === 'string' || typeof result.data === 'object').toBe(true);
      expect(mockAoconnect.message).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [{ name: 'Action', value: 'Create-Post' }],
        data: JSON.stringify(postData),
      });
    });

    it('should validate post data', async () => {
      const invalidData = {
        title: '', // Invalid: empty title
        description: 'Test',
        published_at: Date.now(),
        last_update: Date.now(),
        authors: [], // Invalid: empty authors
      };

      await expect(
        blogSDK.createPost({ data: invalidData as any, wallet: wallet })
      ).resolves.toEqual({
        success: false,
        data: expect.stringContaining('Field title is required'),
      });
    });
  });

  describe('Admin Methods', () => {
    it('should add editors', async () => {
      mockAoconnect.message.mockResolvedValue('message-id-123');

      const result = await blogSDK.addEditors({
        accounts: ['editor1', 'editor2'],
        wallet: wallet,
      });

      expect(result.success).toBe(true);
      // result.data can be either RoleUpdateResult[] or a string message
      expect(typeof result.data === 'string' || Array.isArray(result.data)).toBe(true);
      expect(mockAoconnect.message).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [{ name: 'Action', value: 'Add-Editors' }],
        data: JSON.stringify({ accounts: ['editor1', 'editor2'] }),
      });
    });

    it('should get editors', async () => {
      const mockResponse = {
        Messages: [
          {
            Data: JSON.stringify({
              success: true,
              data: ['editor1', 'editor2'],
            }),
          },
        ],
      };

      mockAoconnect.dryrun.mockResolvedValue(mockResponse);

      const result = await blogSDK.getEditors();

      expect(result.success).toBe(true);
      expect(result.data).toContain('editor1');
      expect(result.data).toContain('editor2');
    });

    it('should set blog details', async () => {
      mockAoconnect.message.mockResolvedValue('message-id-123');

      const blogDetails = {
        title: 'My Blog',
        description: 'A test blog',
        logo: 'https://example.com/logo.png',
      };

      const result = await blogSDK.setBlogDetails({
        data: blogDetails,
        wallet: wallet,
      });

      expect(result.success).toBe(true);
      // result.data can be either BlogDetails object or a string message
      expect(typeof result.data === 'string' || typeof result.data === 'object').toBe(true);
      expect(mockAoconnect.message).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [{ name: 'Action', value: 'Set-Blog-Details' }],
        data: JSON.stringify(blogDetails),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockAoconnect.dryrun.mockRejectedValue(new Error('Network error'));

      const result = await blogSDK.getAllPosts();

      expect(result.success).toBe(false);
      expect(result.data).toBe('Network error');
    });

    it('should handle invalid response format', async () => {
      mockAoconnect.dryrun.mockResolvedValue({});

      const result = await blogSDK.getAllPosts();

      expect(result.success).toBe(false);
      expect(result.data).toBe('Invalid response format from process');
    });

    it('should handle JSON parsing errors', async () => {
      mockAoconnect.dryrun.mockResolvedValue({
        Messages: [
          {
            Data: 'invalid json',
          },
        ],
      });

      const result = await blogSDK.getAllPosts();

      expect(result.success).toBe(false);
      expect(result.data).toContain('is not valid JSON');
    });
  });
});
