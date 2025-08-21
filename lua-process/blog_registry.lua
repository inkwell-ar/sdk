-- Blog Registry for tracking wallet permissions across blogs
-- Maintains a mapping between wallets and their blog permissions

Name = Name or "Inkwell Blog Registry"
Author = "@7i7o"

local json = require('json')

-- Registry storage
local wallet_blogs = {} -- wallet_address -> { blog_id -> { roles = {...}, last_updated = timestamp } }
local blog_wallets = {} -- blog_id -> { wallet_address -> { roles = {...}, last_updated = timestamp } }

-- Constants
local REGISTRY_VERSION = "1.0.0"
local VALID_ROLES = {
    "DEFAULT_ADMIN_ROLE",
    "EDITOR_ROLE"
}

-- Helper function to validate wallet address
local function validate_wallet(wallet)
    if not wallet or type(wallet) ~= "string" or wallet == "" then
        return false, "Invalid wallet address"
    end
    return true, nil
end

-- Helper function to validate blog ID
local function validate_blog_id(blog_id)
    if not blog_id or type(blog_id) ~= "string" or blog_id == "" then
        return false, "Invalid blog ID"
    end
    return true, nil
end

-- Helper function to validate role
local function validate_role(role)
    for _, valid_role in ipairs(VALID_ROLES) do
        if role == valid_role then
            return true, nil
        end
    end
    return false, "Invalid role: " .. role
end

-- Helper function to validate roles array
local function validate_roles(roles)
    if not roles or type(roles) ~= "table" then
        return false, "Roles must be a table"
    end

    for _, role in ipairs(roles) do
        local is_valid, error = validate_role(role)
        if not is_valid then
            return false, error
        end
    end

    return true, nil
end

-- Helper function to safely parse JSON
local function safe_json_decode(data)
    if not data or type(data) ~= "string" then
        return nil, "Invalid JSON data"
    end

    local success, result = pcall(json.decode, data)
    if not success then
        return nil, "Invalid JSON format: " .. result
    end

    return result, nil
end

-- Helper function to reply with JSON
local function reply_msg(msg, success, data_or_error)
    msg.reply({
        Data = json.encode({
            success = success,
            data = data_or_error
        })
    })
end

-- Helper function to handle errors in handlers
local function safe_handler(handler_func)
    return function(msg)
        local success, result = pcall(handler_func, msg)
        if not success then
            reply_msg(msg, false, "Internal server error: " .. result)
        end
    end
end

-- Register a wallet's permissions for a specific blog
local function register_wallet_permissions(wallet, blog_id, roles)
    local success, error = validate_wallet(wallet)
    if not success then return false, error end

    success, error = validate_blog_id(blog_id)
    if not success then return false, error end

    success, error = validate_roles(roles)
    if not success then return false, error end

    local timestamp = os.time()

    -- Initialize wallet entry if it doesn't exist
    if not wallet_blogs[wallet] then
        wallet_blogs[wallet] = {}
    end

    -- Initialize blog entry if it doesn't exist
    if not blog_wallets[blog_id] then
        blog_wallets[blog_id] = {}
    end

    -- Update wallet -> blog mapping
    wallet_blogs[wallet][blog_id] = {
        roles = roles,
        last_updated = timestamp
    }

    -- Update blog -> wallet mapping
    blog_wallets[blog_id][wallet] = {
        roles = roles,
        last_updated = timestamp
    }

    return true, nil
end

-- Remove a wallet's permissions for a specific blog
local function remove_wallet_permissions(wallet, blog_id)
    local success, error = validate_wallet(wallet)
    if not success then return false, error end

    success, error = validate_blog_id(blog_id)
    if not success then return false, error end

    -- Remove from wallet -> blog mapping
    if wallet_blogs[wallet] then
        wallet_blogs[wallet][blog_id] = nil
        -- Clean up empty wallet entry
        if next(wallet_blogs[wallet]) == nil then
            wallet_blogs[wallet] = nil
        end
    end

    -- Remove from blog -> wallet mapping
    if blog_wallets[blog_id] then
        blog_wallets[blog_id][wallet] = nil
        -- Clean up empty blog entry
        if next(blog_wallets[blog_id]) == nil then
            blog_wallets[blog_id] = nil
        end
    end

    return true, nil
end

-- Update a wallet's roles for a specific blog
local function update_wallet_roles(wallet, blog_id, roles)
    local success, error = validate_roles(roles)
    if not success then return false, error end

    -- If roles is empty, remove the wallet entirely
    if #roles == 0 then
        return remove_wallet_permissions(wallet, blog_id)
    end

    return register_wallet_permissions(wallet, blog_id, roles)
end

-- Get all blogs a wallet has permissions for
local function get_wallet_blogs(wallet)
    local success, error = validate_wallet(wallet)
    if not success then return nil, error end

    local blogs = {}
    if wallet_blogs[wallet] then
        for blog_id, data in pairs(wallet_blogs[wallet]) do
            table.insert(blogs, {
                blog_id = blog_id,
                roles = data.roles,
                last_updated = data.last_updated
            })
        end
    end

    return blogs, nil
end

-- Get all wallets with permissions for a specific blog
local function get_blog_wallets(blog_id)
    local success, error = validate_blog_id(blog_id)
    if not success then return nil, error end

    local wallets = {}
    if blog_wallets[blog_id] then
        for wallet, data in pairs(blog_wallets[blog_id]) do
            table.insert(wallets, {
                wallet = wallet,
                roles = data.roles,
                last_updated = data.last_updated
            })
        end
    end

    return wallets, nil
end

-- Check if a wallet has a specific role for a blog
local function wallet_has_role(wallet, blog_id, role)
    local success, error = validate_wallet(wallet)
    if not success then return false, error end

    success, error = validate_blog_id(blog_id)
    if not success then return false, error end

    success, error = validate_role(role)
    if not success then return false, error end

    if wallet_blogs[wallet] and wallet_blogs[wallet][blog_id] then
        for _, wallet_role in ipairs(wallet_blogs[wallet][blog_id].roles) do
            if wallet_role == role then
                return true, nil
            end
        end
    end

    return false, nil
end

-- Get registry statistics
local function get_registry_stats()
    local wallet_count = 0
    local blog_count = 0
    local total_permissions = 0

    for _ in pairs(wallet_blogs) do
        wallet_count = wallet_count + 1
    end

    for _ in pairs(blog_wallets) do
        blog_count = blog_count + 1
    end

    for _, wallet_data in pairs(wallet_blogs) do
        for _ in pairs(wallet_data) do
            total_permissions = total_permissions + 1
        end
    end

    return {
        version = REGISTRY_VERSION,
        wallet_count = wallet_count,
        blog_count = blog_count,
        total_permissions = total_permissions
    }
end

-- Message handlers for AO process

-- Public handlers
Handlers.add(
    "Info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    safe_handler(function(msg)
        local stats = get_registry_stats()
        msg.reply({
            Name = Name,
            Author = Author,
            Version = REGISTRY_VERSION,
            Data = json.encode({
                success = true,
                data = stats
            })
        })
    end)
)

Handlers.add(
    "Register-Wallet-Permissions",
    Handlers.utils.hasMatchingTag("Action", "Register-Wallet-Permissions"),
    safe_handler(function(msg)
        local data, error = safe_json_decode(msg.Data)
        if not data then
            reply_msg(msg, false, error)
            return
        end

        if not data.wallet or not data.roles then
            reply_msg(msg, false, "Missing required fields: wallet, roles")
            return
        end

        -- Use msg.From as the blog_id for security
        local blog_id = msg.From

        local success, result_or_error = register_wallet_permissions(
            data.wallet,
            blog_id,
            data.roles
        )
        reply_msg(msg, success, result_or_error)
    end)
)

Handlers.add(
    "Remove-Wallet-Permissions",
    Handlers.utils.hasMatchingTag("Action", "Remove-Wallet-Permissions"),
    safe_handler(function(msg)
        local data, error = safe_json_decode(msg.Data)
        if not data then
            reply_msg(msg, false, error)
            return
        end

        if not data.wallet then
            reply_msg(msg, false, "Missing required fields: wallet")
            return
        end

        -- Use msg.From as the blog_id for security
        local blog_id = msg.From

        local success, result_or_error = remove_wallet_permissions(
            data.wallet,
            blog_id
        )
        reply_msg(msg, success, result_or_error)
    end)
)

Handlers.add(
    "Update-Wallet-Roles",
    Handlers.utils.hasMatchingTag("Action", "Update-Wallet-Roles"),
    safe_handler(function(msg)
        local data, error = safe_json_decode(msg.Data)
        if not data then
            reply_msg(msg, false, error)
            return
        end

        if not data.wallet or not data.roles then
            reply_msg(msg, false, "Missing required fields: wallet, roles")
            return
        end

        -- Use msg.From as the blog_id for security
        local blog_id = msg.From

        local success, result_or_error = update_wallet_roles(
            data.wallet,
            blog_id,
            data.roles
        )
        reply_msg(msg, success, result_or_error)
    end)
)

Handlers.add(
    "Get-Wallet-Blogs",
    Handlers.utils.hasMatchingTag("Action", "Get-Wallet-Blogs"),
    safe_handler(function(msg)
        local wallet = msg.Tags["Wallet-Address"]
        if not wallet then
            reply_msg(msg, false, "Missing Wallet-Address tag")
            return
        end

        local blogs, error = get_wallet_blogs(wallet)
        reply_msg(msg, blogs ~= nil, blogs or error)
    end)
)

Handlers.add(
    "Get-Blog-Wallets",
    Handlers.utils.hasMatchingTag("Action", "Get-Blog-Wallets"),
    safe_handler(function(msg)
        local blog_id = msg.Tags["Blog-ID"]
        if not blog_id then
            reply_msg(msg, false, "Missing Blog-ID tag")
            return
        end

        local wallets, error = get_blog_wallets(blog_id)
        reply_msg(msg, wallets ~= nil, wallets or error)
    end)
)

Handlers.add(
    "Check-Wallet-Role",
    Handlers.utils.hasMatchingTag("Action", "Check-Wallet-Role"),
    safe_handler(function(msg)
        local wallet = msg.Tags["Wallet-Address"]
        local blog_id = msg.Tags["Blog-ID"]
        local role = msg.Tags["Role"]

        if not wallet or not blog_id or not role then
            reply_msg(msg, false, "Missing required tags: Wallet-Address, Blog-ID, Role")
            return
        end

        local has_role, error = wallet_has_role(wallet, blog_id, role)
        reply_msg(msg, true, { has_role = has_role, error = error })
    end)
)

Handlers.add(
    "Get-Registry-Stats",
    Handlers.utils.hasMatchingTag("Action", "Get-Registry-Stats"),
    safe_handler(function(msg)
        local stats = get_registry_stats()
        reply_msg(msg, true, stats)
    end)
)

-- Export functions for direct use if needed
-- return {
--     register_wallet_permissions = register_wallet_permissions,
--     remove_wallet_permissions = remove_wallet_permissions,
--     update_wallet_roles = update_wallet_roles,
--     get_wallet_blogs = get_wallet_blogs,
--     get_blog_wallets = get_blog_wallets,
--     wallet_has_role = wallet_has_role,
--     get_registry_stats = get_registry_stats,
-- }
