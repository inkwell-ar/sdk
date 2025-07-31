import { InkwellBlogSDK, ValidationError } from '../index';

// Mock aoconnect for testing
const mockAoconnect = {
  dryRun: jest.fn(),
  message: jest.fn()
};

describe('InkwellBlogSDK', () => {
  let blogSDK: InkwellBlogSDK;

  beforeEach(() => {
    blogSDK = new InkwellBlogSDK({
      processId: 'test-process-id',
      aoconnect: mockAoconnect
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

  describe('Public Methods', () => {
    it('should get all posts', async () => {
      const mockResponse = {
        Messages: [{
          Data: JSON.stringify({
            success: true,
            data: [
              {
                id: 1,
                title: 'Test Post',
                description: 'Test Description',
                published_at: Date.now(),
                last_update: Date.now(),
                authors: ['@test']
              }
            ]
          })
        }]
      };

      mockAoconnect.dryRun.mockResolvedValue(mockResponse);

      const result = await blogSDK.getAllPosts({ ordered: true });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Test Post');
      expect(mockAoconnect.dryRun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Get-All-Posts' },
          { name: 'Ordered', value: 'true' }
        ]
      });
    });

    it('should get a specific post', async () => {
      const mockResponse = {
        Messages: [{
          Data: JSON.stringify({
            success: true,
            data: {
              id: 1,
              title: 'Test Post',
              description: 'Test Description',
              published_at: Date.now(),
              last_update: Date.now(),
              authors: ['@test']
            }
          })
        }]
      };

      mockAoconnect.dryRun.mockResolvedValue(mockResponse);

      const result = await blogSDK.getPost({ id: 1 });

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Test Post');
      expect(mockAoconnect.dryRun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Get-Post' },
          { name: 'Id', value: '1' }
        ]
      });
    });

    it('should get user roles', async () => {
      const mockResponse = {
        Messages: [{
          Data: JSON.stringify({
            success: true,
            data: ['EDITOR_ROLE', 'DEFAULT_ADMIN_ROLE']
          })
        }]
      };

      mockAoconnect.dryRun.mockResolvedValue(mockResponse);

      const result = await blogSDK.getUserRoles();

      expect(result.success).toBe(true);
      expect(result.data).toContain('EDITOR_ROLE');
      expect(result.data).toContain('DEFAULT_ADMIN_ROLE');
    });
  });

  describe('Editor Methods', () => {
    it('should create a post', async () => {
      const mockResponse = {
        Messages: [{
          Data: JSON.stringify({
            success: true,
            data: {
              id: 1,
              title: 'New Post',
              description: 'New Description',
              published_at: Date.now(),
              last_update: Date.now(),
              authors: ['@test']
            }
          })
        }]
      };

      mockAoconnect.message.mockResolvedValue(mockResponse);

      const postData = {
        title: 'New Post',
        description: 'New Description',
        published_at: Date.now(),
        last_update: Date.now(),
        authors: ['@test']
      };

      const result = await blogSDK.createPost({ data: postData });

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('New Post');
      expect(mockAoconnect.message).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Create-Post' }
        ],
        data: JSON.stringify(postData)
      });
    });

    it('should validate post data', async () => {
      const invalidData = {
        title: '', // Invalid: empty title
        description: 'Test',
        published_at: Date.now(),
        last_update: Date.now(),
        authors: [] // Invalid: empty authors
      };

      await expect(blogSDK.createPost({ data: invalidData as any }))
        .resolves.toEqual({
          success: false,
          data: expect.stringContaining('validation')
        });
    });
  });

  describe('Admin Methods', () => {
    it('should add editors', async () => {
      const mockResponse = {
        Messages: [{
          Data: JSON.stringify({
            success: true,
            data: [
              { account: 'editor1', success: true, error: null },
              { account: 'editor2', success: true, error: null }
            ]
          })
        }]
      };

      mockAoconnect.message.mockResolvedValue(mockResponse);

      const result = await blogSDK.addEditors({
        accounts: ['editor1', 'editor2']
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].success).toBe(true);
      expect(mockAoconnect.message).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Add-Editors' }
        ],
        data: JSON.stringify({ accounts: ['editor1', 'editor2'] })
      });
    });

    it('should get editors', async () => {
      const mockResponse = {
        Messages: [{
          Data: JSON.stringify({
            success: true,
            data: ['editor1', 'editor2']
          })
        }]
      };

      mockAoconnect.dryRun.mockResolvedValue(mockResponse);

      const result = await blogSDK.getEditors();

      expect(result.success).toBe(true);
      expect(result.data).toContain('editor1');
      expect(result.data).toContain('editor2');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockAoconnect.dryRun.mockRejectedValue(new Error('Network error'));

      const result = await blogSDK.getAllPosts();

      expect(result.success).toBe(false);
      expect(result.data).toBe('Network error');
    });

    it('should handle invalid response format', async () => {
      mockAoconnect.dryRun.mockResolvedValue({});

      const result = await blogSDK.getAllPosts();

      expect(result.success).toBe(false);
      expect(result.data).toBe('Invalid response format from process');
    });

    it('should handle JSON parsing errors', async () => {
      mockAoconnect.dryRun.mockResolvedValue({
        Messages: [{
          Data: 'invalid json'
        }]
      });

      const result = await blogSDK.getAllPosts();

      expect(result.success).toBe(false);
      expect(result.data).toContain('Failed to parse response');
    });
  });
}); 