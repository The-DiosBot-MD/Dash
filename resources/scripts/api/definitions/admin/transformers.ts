/* eslint-disable camelcase */
import { Allocation, Node } from '@/api/admin/node';
import { Server, ServerVariable } from '@/api/admin/server';
import { FractalResponseData, FractalResponseList } from '@/api/http';
import * as Models from '@definitions/admin/models';
import { Egg, EggVariable } from '@/api/admin/egg';
import { Nest } from '@/api/admin/nest';
import { Category } from '@/api/admin/billing/categories';
import { Ticket, TicketMessage } from '@/api/admin/tickets/getTickets';
import { Product } from '@/api/admin/billing/products';
import { type Database } from '@definitions/server';
const isList = (data: FractalResponseList | FractalResponseData): data is FractalResponseList => data.object === 'list';

function transform<T, M = undefined>(
    data: undefined,
    transformer: (callback: FractalResponseData) => T,
    missing?: M,
): undefined;
function transform<T, M>(
    data: FractalResponseData | undefined,
    transformer: (callback: FractalResponseData) => T,
    missing?: M,
): T | M | undefined;
function transform<T, M>(
    data: FractalResponseList | undefined,
    transformer: (callback: FractalResponseData) => T,
    missing?: M,
): T[] | undefined;
function transform<T>(
    data: FractalResponseData | FractalResponseList | undefined,
    transformer: (callback: FractalResponseData) => T,
    missing = undefined,
) {
    if (data === undefined) return undefined;

    if (isList(data)) {
        return data.data.map(transformer);
    }

    return !data ? missing : transformer(data);
}

export default class Transformers {
    static toServer = ({ attributes }: FractalResponseData): Server => {
        const { oom_killer, ...limits } = attributes.limits;
        const { allocations, egg, nest, node, user, variables, databases } = attributes.relationships || {};

        return {
            id: attributes.id,
            uuid: attributes.uuid,
            externalId: attributes.external_id,
            identifier: attributes.identifier,
            name: attributes.name,
            description: attributes.description,
            status: attributes.status,
            ownerId: attributes.owner_id,
            nodeId: attributes.node_id,
            allocationId: attributes.allocation_id,
            eggId: attributes.egg_id,
            nestId: attributes.nest_id,
            limits: { ...limits, oomKiller: oom_killer },
            featureLimits: attributes.feature_limits,
            container: attributes.container,
            createdAt: new Date(attributes.created_at),
            updatedAt: new Date(attributes.updated_at),
            relationships: {
                allocations: transform(allocations as FractalResponseList | undefined, this.toAllocation),
                nest: transform(nest as FractalResponseData | undefined, this.toNest),
                egg: transform(egg as FractalResponseData | undefined, this.toEgg),
                node: transform(node as FractalResponseData | undefined, this.toNode),
                user: transform(user as FractalResponseData | undefined, this.toUser),
                variables: transform(variables as FractalResponseList | undefined, this.toServerEggVariable),
                databases: transform(databases as FractalResponseList | undefined, this.toServerDatabase),
            },
        };
    };

    static toNode = ({ attributes }: FractalResponseData): Node => {
        return {
            id: attributes.id,
            uuid: attributes.uuid,
            isPublic: attributes.public,
            databaseHostId: attributes.database_host_id,
            name: attributes.name,
            description: attributes.description,
            fqdn: attributes.fqdn,
            ports: {
                http: {
                    public: attributes.publicPortHttp,
                    listen: attributes.listenPortHttp,
                },
                sftp: {
                    public: attributes.publicPortSftp,
                    listen: attributes.listenPortSftp,
                },
            },
            scheme: attributes.scheme,
            isBehindProxy: attributes.behindProxy,
            isMaintenanceMode: attributes.maintenance_mode,
            memory: attributes.memory,
            memoryOverallocate: attributes.memory_overallocate,
            disk: attributes.disk,
            diskOverallocate: attributes.disk_overallocate,
            uploadSize: attributes.upload_size,
            daemonBase: attributes.daemonBase,
            createdAt: new Date(attributes.created_at),
            updatedAt: new Date(attributes.updated_at),
            relationships: {},
        };
    };

    static toUserRole = ({ attributes }: FractalResponseData): Models.UserRole => ({
        id: attributes.id,
        name: attributes.name,
        description: attributes.description,
        relationships: {},
    });

    static toApiKey = ({ attributes }: FractalResponseData): Models.ApiKey => ({
        id: attributes.id,
        identifier: attributes.identifier,
        description: attributes.description,
        allowedIps: attributes.allowed_ips,
        createdAt: new Date(attributes.created_at),
        lastUsedAt: new Date(attributes.last_used_at),
    });

    static toTicket = ({ attributes }: FractalResponseData): Ticket => ({
        id: attributes.id,
        title: attributes.title,
        status: attributes.status,
        user: attributes.user,
        assignedTo: attributes.assigned_to,
        createdAt: new Date(attributes.created_at),
        updatedAt: attributes.updated_at ? new Date(attributes.updated_at) : null,
        relationships: {
            messages: transform(attributes.relationships?.messages as FractalResponseList, this.toTicketMessage),
        },
    });

    static toTicketMessage = ({ attributes }: FractalResponseData): TicketMessage => ({
        id: attributes.id,
        message: attributes.message,
        author: attributes.author,
        createdAt: new Date(attributes.created_at),
        updatedAt: attributes.updated_at ? new Date(attributes.updated_at) : null,
    });

    static toUser = ({ attributes }: FractalResponseData): Models.User => {
        return {
            id: attributes.id,
            uuid: attributes.uuid,
            externalId: attributes.external_id,
            username: attributes.username,
            email: attributes.email,
            language: attributes.language,
            adminRoleId: attributes.adminRoleId || null,
            roleName: attributes.role_name,
            state: attributes.state || null,
            isRootAdmin: attributes.root_admin,
            isUsingTwoFactor: attributes['2fa'] || false,
            avatarUrl: attributes.avatar_url,
            createdAt: new Date(attributes.created_at),
            updatedAt: new Date(attributes.updated_at),
            relationships: {
                role: transform(attributes.relationships?.role as FractalResponseData, this.toUserRole) || null,
            },
        };
    };

    static toEgg = ({ attributes }: FractalResponseData): Egg => ({
        id: attributes.id,
        uuid: attributes.uuid,
        nestId: attributes.nest_id,
        author: attributes.author,
        name: attributes.name,
        description: attributes.description,
        features: attributes.features,
        dockerImages: attributes.docker_images,
        configFiles: attributes.config?.files,
        configStartup: attributes.config?.startup,
        configStop: attributes.config?.stop,
        configFrom: attributes.config?.extends,
        startup: attributes.startup,
        copyScriptFrom: attributes.copy_script_from,
        scriptContainer: attributes.script?.container,
        scriptEntry: attributes.script?.entry,
        scriptIsPrivileged: attributes.script?.privileged,
        scriptInstall: attributes.script?.install,
        createdAt: new Date(attributes.created_at),
        updatedAt: new Date(attributes.updated_at),
        relationships: {
            nest: transform(attributes.relationships?.nest as FractalResponseData, this.toNest),
            variables: transform(attributes.relationships?.variables as FractalResponseList, this.toEggVariable),
        },
    });

    static toEggVariable = ({ attributes }: FractalResponseData): EggVariable => ({
        id: attributes.id,
        eggId: attributes.egg_id,
        name: attributes.name,
        description: attributes.description,
        environmentVariable: attributes.env_variable,
        defaultValue: attributes.default_value,
        isUserViewable: attributes.user_viewable,
        isUserEditable: attributes.user_editable,
        // isRequired: attributes.required,
        rules: attributes.rules,
        createdAt: new Date(attributes.created_at),
        updatedAt: new Date(attributes.updated_at),
        relationships: {},
    });

    static toServerEggVariable = (data: FractalResponseData): ServerVariable => ({
        ...this.toEggVariable(data),
        serverValue: data.attributes.server_value,
    });

    static toAllocation = ({ attributes }: FractalResponseData): Allocation => ({
        id: attributes.id,
        ip: attributes.ip,
        port: attributes.port,
        alias: attributes.alias || null,
        isAssigned: attributes.assigned,
        relationships: {
            node: transform(attributes.relationships?.node as FractalResponseData, this.toNode),
            server: transform(attributes.relationships?.server as FractalResponseData, this.toServer),
        },
        getDisplayText(): string {
            const raw = `${this.ip}:${this.port}`;

            return !this.alias ? raw : `${this.alias} (${raw})`;
        },
    });

    static toNest = ({ attributes }: FractalResponseData): Nest => ({
        id: attributes.id,
        uuid: attributes.uuid,
        author: attributes.author,
        name: attributes.name,
        description: attributes.description,
        createdAt: new Date(attributes.created_at),
        updatedAt: new Date(attributes.updated_at),
        relationships: {
            eggs: transform(attributes.relationships?.eggs as FractalResponseList, this.toEgg),
        },
    });

    static toServerDatabase = ({ attributes }: FractalResponseData): Database => ({
        id: attributes.id,
        name: attributes.name,
        databaseHostId: attributes.database_host_id,
        username: attributes.username,
        connectionString: attributes.remote,
        allowConnectionsFrom: '',
    });

    static toCategory = ({ attributes }: FractalResponseData): Category => ({
        id: attributes.id,
        uuid: attributes.uuid,
        name: attributes.name,
        icon: attributes.icon,
        description: attributes.description,
        visible: attributes.visible,
        nestId: attributes.nest_id,
        eggId: attributes.egg_id,

        createdAt: new Date(attributes.created_at),
        updatedAt: new Date(attributes.updated_at),

        relationships: {
            products: transform(attributes.relationships?.products as FractalResponseList, this.toProduct),
        },
    });

    static toProduct = ({ attributes }: FractalResponseData): Product => ({
        id: attributes.id,
        uuid: attributes.uuid,
        categoryUuid: attributes.category_uuid,
        name: attributes.name,
        icon: attributes.icon,
        price: attributes.price,
        description: attributes.description,

        limits: {
            cpu: attributes.limits.cpu,
            memory: attributes.limits.memory,
            disk: attributes.limits.disk,
            backup: attributes.limits.backup,
            database: attributes.limits.database,
            allocation: attributes.limits.allocation,
        },

        createdAt: new Date(attributes.created_at),
        updatedAt: new Date(attributes.updated_at),

        relationships: {
            category: transform(attributes.relationships?.category as FractalResponseData, this.toCategory),
        },
    });

    static toBillingException = ({ attributes }: FractalResponseData): Models.BillingException => ({
        id: attributes.id,
        uuid: attributes.uuid,
        description: attributes.description,
        title: attributes.title,
        exception_type: attributes.exception_type,
        created_at: new Date(attributes.created_at),
        updated_at: new Date(attributes.last_used_at),
    });
}
