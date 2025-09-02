import { BLOG_REGISTRY_PROCESS_ID } from "../config/registry";

// Embedded Lua contracts for browser deployment
export const BLOG_CONTRACT = `local json = require('json')
local AccessControl = require('access_control')

Name = "Inkwell Blog"
Author = "@7i7o"
Details = {
    title = "Blog Title",
    description = "Blog Description",
    logo = ""
}

-- Initialize AccessControl
AccessControl.init(Owner, Owner, false)
AccessControl.create_role(Owner, AccessControl.ROLES.EDITOR, AccessControl.ROLES.DEFAULT_ADMIN)
AccessControl.grant_role(Owner, AccessControl.ROLES.EDITOR, Owner)

-- Registry integration
local RegistryProcess = "${BLOG_REGISTRY_PROCESS_ID}"

-- Posts storage
Posts = Posts or {}
Next_id = Next_id or 1

-- Initialize next_id in case posts already exist
local function initialize_next_id()
    local max_id = 0
    for id, _ in pairs(Posts) do
        if type(id) == "number" and id > max_id then
            max_id = id
        end
    end
    Next_id = max_id + 1
end
initialize_next_id()

-- Helper function to validate blog details
local function validate_blog_details(data)
    if not data or type(data) ~= "table" then
        return false, "Data is required and must be a table"
    end

    if data.title and type(data.title) ~= "string" then
        return false, "Field title must be a non-empty string"
    end

    if data.description and type(data.description) ~= "string" then
        return false, "Field description and must be a non-empty string"
    end

    if data.logo and type(data.logo) ~= "string" then
        return false, "Field body must be a string if provided"
    end

    if (not data.title or data.title == "") and (not data.description or data.description == "") and (not data.logo or data.logo == "") then
        return false, "At least one field is required"
    end

    return true, nil
end

-- Helper function to validate posts data
local function validate_post(data)
    if not data or type(data) ~= "table" then
        return false, "Data is required and must be a table"
    end

    if not data.title or type(data.title) ~= "string" or data.title == "" then
        return false, "Field title is required and must be a non-empty string"
    end

    if not data.description or type(data.description) ~= "string" or data.description == "" then
        return false, "Field description is required and must be a non-empty string"
    end

    if data.body and type(data.body) ~= "string" then
        return false, "Field body must be a string if provided"
    end

    if not data.published_at or type(data.published_at) ~= "number" then
        return false, "Field published_at is required and must be a number"
    end

    if not data.last_update or type(data.last_update) ~= "number" then
        return false, "Field last_update is required and must be a number"
    end

    if data.labels then
        if type(data.labels) ~= "table" then
            return false, "Field labels must be a table if provided"
        end
        for _, label in ipairs(data.labels) do
            if not label or type(label) ~= "string" or label == "" then
                return false, "Fields within labels must all be strings if provided"
            end
        end
    end

    if not data.authors or type(data.authors) ~= "table" or #data.authors == 0 then
        return false, "Field authors is required, must be a table and should have at least 1 item"
    else
        for _, author in ipairs(data.authors) do
            if not author or type(author) ~= "string" or author == "" then
                return false, "Fields within authors are required and must all be non-empty strings"
            end
        end
    end

    return true, nil
end

-- Helper function to deep copy an array
local function copy_array(arr)
    if not arr or type(arr) ~= "table" then return {} end
    local result = {}
    for _, item in ipairs(arr) do
        table.insert(result, item)
    end
    return result
end

-- Atomic ID generation
local function get_next_id()
    local id = Next_id
    Next_id = Next_id + 1
    return id
end

-- Create a new post
local function create_post(data)
    local is_valid, error = validate_post(data)
    if not is_valid then
        return nil, error
    end

    local post = {
        title = data.title,
        description = data.description,
        body = data.body,
        published_at = data.published_at,
        last_update = data.last_update,
        labels = copy_array(data.labels),
        authors = copy_array(data.authors)
    }

    post.id = get_next_id()
    Posts[post.id] = post

    return post, nil
end

-- Get all posts
local function get_posts(is_ordered)
    local result = {}
    for id, post in pairs(Posts) do
        table.insert(result, post)
    end

    -- Sort by published_at (newest first)
    if is_ordered then
        table.sort(result, function(a, b)
            return a.published_at > b.published_at
        end)
    end

    return result
end

-- Get post by ID
local function get_post_by_id(id)
    if type(id) ~= "number" then
        return nil, "ID must be a number"
    end

    local post = Posts[id]
    if not post then
        return nil, "Post not found"
    end

    return post, nil
end

-- Update a post
local function update_post(id, data)
    if type(id) ~= "number" then
        return nil, "ID must be a number"
    end

    if not Posts[id] then
        return nil, "Post not found"
    end

    local is_valid, error = validate_post(data)
    if not is_valid then
        return nil, error
    end

    local post = Posts[id]
    post.title = data.title
    post.description = data.description
    post.body = data.body
    post.published_at = data.published_at
    post.last_update = data.last_update
    post.labels = copy_array(data.labels)
    post.authors = copy_array(data.authors)

    return post, nil
end

-- Delete a post
local function delete_post(id)
    if type(id) ~= "number" then
        return nil, "ID must be a number"
    end

    if not Posts[id] then
        return nil, "Post not found"
    end

    local post = Posts[id]
    Posts[id] = nil

    return post, nil
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

----------------------------------
--- Message Helper
local function reply_msg(msg, success, data_or_error)
    msg.reply({
        Data = json.encode({
            success = success,
            data = data_or_error
        })
    })
end

----------------------------------
-- Helper function to handle errors in handlers
local function safe_handler(handler_func)
    return function(msg)
        local success, result = pcall(handler_func, msg)
        if not success then
            reply_msg(msg, false, "Internal server error: " .. result)
        end
    end
end

----------------------------------
-- Registry sync helpers
local function sync_wallet_to_registry(wallet, roles)
    if not RegistryProcess or RegistryProcess == "YOUR_REGISTRY_PROCESS_ID" then
        return true, nil -- Skip if registry not configured
    end
    
    local data = {
        wallet = wallet,
        roles = roles
    }
    
    -- Send message to registry process
    ao.send({
        Target = RegistryProcess,
        Action = "Register-Wallet-Permissions",
        Data = json.encode(data)
    })
    
    return true, nil
end

local function remove_wallet_from_registry(wallet)
    if not RegistryProcess or RegistryProcess == "YOUR_REGISTRY_PROCESS_ID" then
        return true, nil -- Skip if registry not configured
    end
    
    local data = {
        wallet = wallet
    }
    
    -- Send message to registry process
    ao.send({
        Target = RegistryProcess,
        Action = "Remove-Wallet-Permissions",
        Data = json.encode(data)
    })
    
    return true, nil
end

local function get_wallet_roles_for_registry(wallet)
    local roles = {}
    
    -- Check for DEFAULT_ADMIN role
    local is_admin, _ = AccessControl.has_role(wallet, AccessControl.ROLES.DEFAULT_ADMIN)
    if is_admin then
        table.insert(roles, AccessControl.ROLES.DEFAULT_ADMIN)
    end
    
    -- Check for EDITOR role
    local is_editor, _ = AccessControl.has_role(wallet, AccessControl.ROLES.EDITOR)
    if is_editor then
        table.insert(roles, AccessControl.ROLES.EDITOR)
    end
    
    return roles
end

----------------------------------
-- Role Change Helper
local function update_roles(msg, role_action, role)
    local is_admin, err = AccessControl.only_role(msg.From, AccessControl.ROLES.DEFAULT_ADMIN)

    -- Only ADMINs can update roles
    if not is_admin then
        return false, err
    end

    local results = {}
    local global_success = true

    local data, error = safe_json_decode(msg.Data)
    if not data then
        return false, error
    end

    if not data.accounts or type(data.accounts) ~= "table" then
        return false, "Field 'accounts' is required and must be an array"
    end

    if #data.accounts == 0 then
        return false, "Field 'accounts' must contain at least one account"
    end

    for _, account in ipairs(data.accounts) do
        if type(account) ~= "string" or account == "" then
            table.insert(results, { account, false, AccessControl.ERROR_MESSAGES.INVALID_ACCOUNT })
            global_success = false
        else
            local success, err = role_action(msg.From, role, account)
            table.insert(results, { account, success, err })
            global_success = global_success and success
            
            -- Sync with registry after role change
            if success then
                local roles = get_wallet_roles_for_registry(account)
                if #roles > 0 then
                    sync_wallet_to_registry(account, roles)
                else
                    remove_wallet_from_registry(account)
                end
            end
        end
    end

    local success, result = pcall(json.encode, results)
    if not success then
        return false, "JSON encoding results failed: " .. result
    end

    return global_success, result
end

----------------------------------
-- List Role Members
local function get_role_members(msg, role)
    local results, error = AccessControl.get_role_members(role)
    if not results then
        return false, error
    end

    local success, result = pcall(json.encode, results)
    if not success then
        return false, "JSON encoding results failed: " .. result
    end

    return true, result
end

----------------------------------
-- List User Roles
local function get_user_roles(user_address)
    local results, error = AccessControl.get_user_roles(user_address)
    if not results then
        return false, error
    end

    local success, result = pcall(json.encode, results)
    if not success then
        return false, "JSON encoding results failed: " .. result
    end

    return true, result
end

----------------------------------
-- Set Blog Details
local function set_details(data)
    local success, error = validate_blog_details(data)

    if not success then
        return false, error
    end

    local new_details = {
        title = data.title or Details.title,
        description = data.description or Details.description,
        logo = data.logo or Details.logo
    }

    Details = new_details
    return true, new_details
end

----------------------------------
---  Message handlers for AO process

-- Public Handlers
Handlers.add(
    "Info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    safe_handler(function(msg)
        msg.reply({
            Name = Name,
            Author = Author,
            ["Blog-Title"] = Details.title,
            ["Blog-Description"] = Details.description,
            ["Blog-Logo"] = Details.logo,
            Data = json.encode({
                success = true,
                data = Details
            })
        })
    end)
)

Handlers.add(
    "Get-All-Posts",
    Handlers.utils.hasMatchingTag("Action", "Get-All-Posts"),
    safe_handler(function(msg)
        local is_ordered = msg.Tags.Ordered == "true"
        local posts = get_posts(is_ordered)
        reply_msg(msg, true, posts)
    end)
)

Handlers.add(
    "Get-Post",
    Handlers.utils.hasMatchingTag("Action", "Get-Post"),
    safe_handler(function(msg)
        local id = tonumber(msg.Tags.Id)
        local post, error = get_post_by_id(id)
        reply_msg(msg, post ~= nil, post or error)
    end)
)

Handlers.add(
    "Get-User-Roles",
    Handlers.utils.hasMatchingTag("Action", "Get-User-Roles"),
    safe_handler(function(msg)
        local user_address = msg.Tags["User-Address"]
        local success, data_or_error = get_user_roles(user_address)
        reply_msg(msg, success, data_or_error)
    end)
)

-- Editor only handlers
Handlers.add(
    "Create-Post",
    Handlers.utils.hasMatchingTag("Action", "Create-Post"),
    safe_handler(function(msg)
        local is_editor, error = AccessControl.only_role(msg.From, AccessControl.ROLES.EDITOR)
        local post = nil

        -- Only EDITORs can create posts
        if is_editor then
            local data, err = safe_json_decode(msg.Data)
            if not data then
                reply_msg(msg, false, err)
                return
            end
            post, error = create_post(data)
        end

        reply_msg(msg, post ~= nil, post or error)
    end)
)

Handlers.add(
    "Update-Post",
    Handlers.utils.hasMatchingTag("Action", "Update-Post"),
    safe_handler(function(msg)
        local is_editor, error = AccessControl.only_role(msg.From, AccessControl.ROLES.EDITOR)
        local post = nil

        -- Only EDITORs can update posts
        if is_editor then
            local id = tonumber(msg.Tags.Id)
            local data, err = safe_json_decode(msg.Data)
            if not data then
                reply_msg(msg, false, err)
                return
            end
            post, error = update_post(id, data)
        end

        reply_msg(msg, post ~= nil, post or error)
    end)
)

Handlers.add(
    "Delete-Post",
    Handlers.utils.hasMatchingTag("Action", "Delete-Post"),
    safe_handler(function(msg)
        local is_editor, error = AccessControl.only_role(msg.From, AccessControl.ROLES.EDITOR)
        local post = nil

        -- Only EDITORs can delete posts
        if is_editor then
            local id = tonumber(msg.Tags.Id)
            post, error = delete_post(id)
        end

        reply_msg(msg, post ~= nil, post or error)
    end)
)

-- Admin only handlers
Handlers.add(
    "Add-Editors",
    Handlers.utils.hasMatchingTag("Action", "Add-Editors"),
    safe_handler(function(msg)
        local success, result_or_error = update_roles(msg, AccessControl.grant_role, AccessControl.ROLES.EDITOR)
        reply_msg(msg, success, result_or_error)
    end)
)

Handlers.add(
    "Remove-Editors",
    Handlers.utils.hasMatchingTag("Action", "Remove-Editors"),
    safe_handler(function(msg)
        local success, result_or_error = update_roles(msg, AccessControl.revoke_role, AccessControl.ROLES.EDITOR)
        reply_msg(msg, success, result_or_error)
    end)
)

Handlers.add(
    "Add-Admins",
    Handlers.utils.hasMatchingTag("Action", "Add-Admins"),
    safe_handler(function(msg)
        local success, result_or_error = update_roles(msg, AccessControl.grant_role, AccessControl.ROLES.DEFAULT_ADMIN)
        reply_msg(msg, success, result_or_error)
    end)
)

Handlers.add(
    "Remove-Admins",
    Handlers.utils.hasMatchingTag("Action", "Remove-Admins"),
    safe_handler(function(msg)
        local success, result_or_error = update_roles(msg, AccessControl.revoke_role, AccessControl.ROLES.DEFAULT_ADMIN)
        reply_msg(msg, success, result_or_error)
    end)
)

Handlers.add(
    "Get-Editors",
    Handlers.utils.hasMatchingTag("Action", "Get-Editors"),
    safe_handler(function(msg)
        local success, result_or_error = get_role_members(msg, AccessControl.ROLES.EDITOR)
        reply_msg(msg, success, result_or_error)
    end)
)

Handlers.add(
    "Get-Admins",
    Handlers.utils.hasMatchingTag("Action", "Get-Admins"),
    safe_handler(function(msg)
        local success, result_or_error = get_role_members(msg, AccessControl.ROLES.EDITOR)
        reply_msg(msg, success, result_or_error)
    end)
)

Handlers.add(
    "Set-Blog-Details",
    Handlers.utils.hasMatchingTag("Action", "Set-Blog-Details"),
    safe_handler(function(msg)
        local is_admin, error = AccessControl.only_role(msg.From, AccessControl.ROLES.DEFAULT_ADMIN)

        if not is_admin then
            reply_msg(msg, false, error)
            return false, error
        end

        local data, err = safe_json_decode(msg.Data)
        if not data then
            reply_msg(msg, false, err)
            return false, err
        end

        local success, result_or_error = set_details(data)

        reply_msg(msg, success, result_or_error)
    end)
)

Handlers.add(
    "Sync-With-Registry",
    Handlers.utils.hasMatchingTag("Action", "Sync-With-Registry"),
    safe_handler(function(msg)
        local is_admin, error = AccessControl.only_role(msg.From, AccessControl.ROLES.DEFAULT_ADMIN)

        if not is_admin then
            reply_msg(msg, false, error)
            return
        end

        local sync_results = {}
        
        -- Get all roles and sync them
        for _, role in pairs(AccessControl.ROLES) do
            local members, err = AccessControl.get_role_members(role)
            if members then
                for _, wallet in ipairs(members) do
                    local roles = get_wallet_roles_for_registry(wallet)
                    if #roles > 0 then
                        sync_wallet_to_registry(wallet, roles)
                        table.insert(sync_results, {
                            wallet = wallet,
                            roles = roles,
                            synced = true
                        })
                    end
                end
            end
        end

        reply_msg(msg, true, {
            message = "Sync completed",
            synced_wallets = #sync_results,
            results = sync_results
        })
    end)
)`;
