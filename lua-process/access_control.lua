-- AccessControl library for AO processes
-- Similar to OpenZeppelin's AccessControl contract

Name = "Access Control"
Author = "@7i7o"

local AccessControl = {}
local is_initialized = false

-- Storage for roles and role members
local roles = {}
local role_members = {}
local role_admins = {}

-- Events (for logging)
local is_log_enabled = true
local events = {}

-- Predefined common roles (similar to OpenZeppelin's common roles)
AccessControl.ROLES = {
    -- DEFAULT_ADMIN_ROLE acts similar to a "root" admin
    DEFAULT_ADMIN = "DEFAULT_ADMIN_ROLE",
    MINTER = "MINTER_ROLE",
    BURNER = "BURNER_ROLE",
    PAUSER = "PAUSER_ROLE",
    MANAGER = "MANAGER_ROLE",
    MODERATOR = "MODERATOR_ROLE",
    UPGRADER = "UPGRADER_ROLE",
    ADMIN = "ADMIN_ROLE",
    EDITOR = "EDITOR_ROLE",
    VIEWER = "VIEWER_ROLE"
}

-- Constants for better maintainability
AccessControl.ERROR_MESSAGES = {
    NOT_INITIALIZED = "AccessControl not initialized",
    INVALID_ACCOUNT = "Invalid account",
    INVALID_ROLE = "Invalid role",
    ROLE_EXISTS = "Role already exists",
    ROLE_NOT_EXISTS = "Role does not exist",
    ACCOUNT_HAS_ROLE = "Account already has role",
    ACCOUNT_NO_ROLE = "Account does not have role",
    MISSING_ROLE = "AccessControl: account %s is missing role %s",
    NOT_ADMIN = "AccessControl: account %s is not admin of role %s",
    CANNOT_REMOVE_LAST_ADMIN = "Cannot remove last DEFAULT_ADMIN"
}

-- Role logger helper
local function log_role_update(caller, message, role, old_admin_role, new_admin_role)
    if is_log_enabled then
        table.insert(events, {
            type = message,
            role = role,
            oldAdminRole = old_admin_role,
            newAdminRole = new_admin_role,
            caller = caller,
            timestamp = os.time()
        })
    end
end

-- Account role logger helper
local function log_role_account(caller, message, role, account)
    if is_log_enabled then
        table.insert(events, {
            type = message,
            role = role,
            account = account,
            caller = caller,
            timestamp = os.time()
        })
    end
end

-- Check if module is initialized
local function check_initialized()
    if not is_initialized then
        return false, AccessControl.ERROR_MESSAGES.NOT_INITIALIZED
    end
    return true, nil
end

-- Check if a role exists
function AccessControl.role_exists(role)
    return roles[role] == true
end

-- Validators
local function validate_account(account)
    if not account or type(account) ~= "string" or account == "" then
        return false, AccessControl.ERROR_MESSAGES.INVALID_ACCOUNT
    end
    return true, nil
end

local function validate_role(role)
    if not role or type(role) ~= "string" or role == "" then
        return false, AccessControl.ERROR_MESSAGES.INVALID_ROLE
    end
    if not AccessControl.role_exists(role) then
        return false, AccessControl.ERROR_MESSAGES.ROLE_NOT_EXISTS
    end
    return true, nil
end

-- Combined validation helper
local function validate_inputs(account, role)
    local success, error = check_initialized()
    if not success then return false, error end

    success, error = validate_account(account)
    if not success then return false, error end

    success, error = validate_role(role)
    if not success then return false, error end

    return true, nil
end

-- Check if an address has a specific role
function AccessControl.has_role(account, role)
    local success, error = validate_inputs(account, role)
    if not success then return false, error end

    return role_members[role] and role_members[role][account] == true, nil
end

-- Get the admin role for a given role
function AccessControl.get_role_admin(role)
    local success, error = check_initialized()
    if not success then return nil, error end

    success, error = validate_role(role)
    if not success then return nil, error end

    return role_admins[role], nil
end

-- Get user roles
function AccessControl.get_user_roles(account)
    local success, error = check_initialized()
    if not success then return nil, error end

    local user_roles = {}
    for _, role in ipairs(roles) do
        if role_members[role][account] then
            table.insert(user_roles, role)
        end
    end

    return user_roles, nil
end

-- Check if caller can administer a role
local function can_administer_role(caller, role)
    local admin_role, err = AccessControl.get_role_admin(role)
    if err then return false, err end

    local has_admin_role, _ = AccessControl.has_role(caller, admin_role)
    local has_default_admin, _ = AccessControl.has_role(caller, AccessControl.ROLES.DEFAULT_ADMIN)

    return has_admin_role or has_default_admin,
        string.format(AccessControl.ERROR_MESSAGES.NOT_ADMIN, caller, role)
end

-- Get all roles
function AccessControl.get_all_roles()
    local success, error = check_initialized()
    if not success then return nil, error end

    local all_roles = {}
    for _, role in ipairs(roles) do
        table.insert(all_roles, role)
    end
    return all_roles, nil
end

-- Get all members of a role
function AccessControl.get_role_members(role)
    local success, error = check_initialized()
    if not success then return nil, error end

    success, error = validate_role(role)
    if not success then return nil, error end

    local members = {}
    for account, is_member in pairs(role_members[role]) do
        if is_member then table.insert(members, account) end
    end

    return members, nil
end

-- Get the number of members in a role
function AccessControl.get_role_member_count(role)
    local success, error = check_initialized()
    if not success then return 0, error end

    success, error = validate_role(role)
    if not success then return 0, error end

    local count = 0
    for _, is_member in pairs(role_members[role]) do
        if is_member then count = count + 1 end
    end

    return count, nil
end

-- Initialize the access control system
function AccessControl.init(caller, owner, is_log_disabled)
    if is_initialized then
        return false, "Already initialized"
    end

    local success, error = validate_account(caller)
    if not success then return false, error end

    success, error = validate_account(owner)
    if not success then return false, error end

    -- Set up the default admin role
    roles[AccessControl.ROLES.DEFAULT_ADMIN] = true
    role_members[AccessControl.ROLES.DEFAULT_ADMIN] = {}
    role_admins[AccessControl.ROLES.DEFAULT_ADMIN] = AccessControl.ROLES.DEFAULT_ADMIN

    -- Grant default admin role to the owner
    role_members[AccessControl.ROLES.DEFAULT_ADMIN][owner] = true

    -- Mark module as initialized
    is_initialized = true

    -- Configure logging
    if is_log_disabled then
        is_log_enabled = false
    end

    log_role_update(caller, "RoleCreated", AccessControl.ROLES.DEFAULT_ADMIN, nil, AccessControl.ROLES.DEFAULT_ADMIN)
    log_role_account(caller, "RoleGranted", AccessControl.ROLES.DEFAULT_ADMIN, owner)

    return true, nil
end

-- Create a new role
function AccessControl.create_role(caller, role, admin_role)
    admin_role = admin_role or AccessControl.ROLES.DEFAULT_ADMIN

    local success, error = validate_inputs(caller, admin_role)
    if not success then return false, error end

    -- Check if role already exists
    if AccessControl.role_exists(role) then
        return false, AccessControl.ERROR_MESSAGES.ROLE_EXISTS
    end

    -- Check if caller has permission (only admins of admin_role can add "children" roles)
    local can_admin, error = can_administer_role(caller, admin_role)
    if not can_admin then return false, error end

    roles[role] = true
    role_members[role] = {}
    role_admins[role] = admin_role

    -- Log event
    log_role_update(caller, "RoleCreated", role, nil, admin_role)

    return true, nil
end

-- Grant a role to an account
function AccessControl.grant_role(caller, role, account)
    local success, error = validate_account(caller)
    if not success then return false, error end

    success, error = validate_inputs(account, role)
    if not success then return false, error end

    local can_admin, admin_err = can_administer_role(caller, role)
    if not can_admin then return false, admin_err end

    local already_has_role, _ = AccessControl.has_role(account, role)
    if already_has_role then
        return false, AccessControl.ERROR_MESSAGES.ACCOUNT_HAS_ROLE
    end

    role_members[role][account] = true

    -- Log event
    log_role_account(caller, "RoleGranted", role, account)

    return true, nil
end

-- Check if removing this role member would leave no admins
local function would_remove_last_admin(role, account)
    if role ~= AccessControl.ROLES.DEFAULT_ADMIN then
        return false
    end

    local count = AccessControl.get_role_member_count(role)

    return count == 1 and role_members[role][account] == true
end

-- Revoke a role from an account
function AccessControl.revoke_role(caller, role, account)
    local success, error = validate_inputs(account, role)
    if not success then return false, error end

    local can_admin, err = can_administer_role(caller, role)
    if not can_admin then return false, err end

    local has_role, _ = AccessControl.has_role(account, role)
    if not has_role then
        return false, AccessControl.ERROR_MESSAGES.ACCOUNT_NO_ROLE
    end

    -- Prevent removing the last DEFAULT_ADMIN
    if would_remove_last_admin(role, account) then
        return false, AccessControl.ERROR_MESSAGES.CANNOT_REMOVE_LAST_ADMIN
    end

    role_members[role][account] = nil

    -- Log event
    log_role_account(caller, "RoleRevoked", role, account)

    return true, nil
end

-- Renounce a role (account renounces their own role)
function AccessControl.renounce_role(caller, role)
    local success, error = validate_inputs(caller, role)
    if not success then return false, error end

    local has_role, _ = AccessControl.has_role(caller, role)
    if not has_role then
        return false, AccessControl.ERROR_MESSAGES.ACCOUNT_NO_ROLE
    end

    -- Prevent renouncing if you're the last DEFAULT_ADMIN
    if would_remove_last_admin(role, caller) then
        return false, AccessControl.ERROR_MESSAGES.CANNOT_REMOVE_LAST_ADMIN
    end

    role_members[role][caller] = nil

    -- Log event
    log_role_account(caller, "RoleRenounced", role, caller)

    return true, nil
end

-- Set a new admin for a role
function AccessControl.set_role_admin(caller, role, admin_role)
    -- can_administer_role already validates caller and role inputs
    local can_admin, err = can_administer_role(caller, role)
    if not can_admin then return false, err end

    local success, error = validate_role(admin_role)
    if not success then return false, "Admin " .. error end

    local old_admin_role = role_admins[role]
    role_admins[role] = admin_role

    -- Log event
    log_role_update(caller, "RoleAdminChanged", role, old_admin_role, admin_role)

    return true, nil
end

-- Modifier function to check if caller has a specific role
function AccessControl.only_role(caller, role)
    local has_role, error = AccessControl.has_role(caller, role)
    if not has_role then
        return false, error or string.format(AccessControl.ERROR_MESSAGES.MISSING_ROLE, caller or "unknown", role)
    end
    return true, nil
end

-- Modifier function to check if caller is admin of a role
function AccessControl.only_role_admin(caller, role)
    -- can_administer_role already validates account and role
    local can_admin, err = can_administer_role(caller, role)
    return can_admin, err
end

-- Get all events (for debugging/logging)
function AccessControl.get_events()
    local success, error = check_initialized()
    if not success then return nil, error end

    return events, nil
end

-- Clear events (optional, for memory management)
function AccessControl.clear_events()
    local success, error = check_initialized()
    if not success then return false, error end

    events = {}
    return true, nil
end

-- Helper function to setup common roles
function AccessControl.setup_common_roles(caller)
    local success, error = AccessControl.only_role(caller, AccessControl.ROLES.DEFAULT_ADMIN)
    if not success then return false, error end

    -- Create common roles with DEFAULT_ADMIN as their admin
    for _, role in pairs(AccessControl.ROLES) do
        if role ~= AccessControl.ROLES.DEFAULT_ADMIN then
            AccessControl.create_role(caller, role, AccessControl.ROLES.DEFAULT_ADMIN)
        end
    end

    return true, nil
end

-- Additional utility functions

-- Check if the system is initialized
function AccessControl.is_initialized()
    return is_initialized
end

-- Get system status
function AccessControl.get_status()
    return {
        initialized = is_initialized,
        logging_enabled = is_log_enabled,
        total_roles = #AccessControl.get_all_roles() or 0,
        total_events = #events
    }
end

-- Bulk operations for efficiency
function AccessControl.bulk_grant_role(caller, role, accounts)
    local success, error = check_initialized()
    if not success then return false, error end

    if not accounts or type(accounts) ~= "table" then
        return false, "Accounts must be a table"
    end

    local results = {}
    for _, account in ipairs(accounts) do
        local result, err = AccessControl.grant_role(caller, role, account)
        table.insert(results, { account = account, success = result, error = err })
    end

    return true, results
end

return AccessControl
