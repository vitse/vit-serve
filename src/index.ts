import express from 'express';
import http from 'http';
import cors from 'cors';

import {WebSocketServer} from 'ws';
import {ApolloServer} from '@apollo/server';
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer';
import gqlSchemaBuilder from "./server/gqlSchemaBuilder";
import {expressMiddleware} from "@apollo/server/express4";
import {glob} from "glob";
import logger from "./server/logger";
import {DataSource, DataSourceOptions} from "typeorm";
import {useServer} from "graphql-ws/lib/use/ws";

interface AppContext {
    token?: string;
}

type ConfigWeb = {
    pathStatic?: string
    pathActionGlob?: string,
}

type ConfigGraphQl = {
    urlApi: string,
    pathGraphqlGlob: string,
    pathResolverGlob: string,
}

type GlobalServerConfig = {
    port?: number
    webConfig?: ConfigWeb
    graphQlConfig?: ConfigGraphQl
    datasource?: DataSourceOptions
}

type GlobalServerStatus = {
    running: boolean
    graphqlUrl: string | null
}


export default class GlobalServer {
    private config: GlobalServerConfig
    private gqlSchemaBuilder: gqlSchemaBuilder | undefined;
    private gqlServer: ApolloServer | undefined
    private httpServer: any
    private wsServer: any
    private readonly app
    private datasources: DataSource[]

    constructor(config: GlobalServerConfig = {}) {
        this.config = config
        this.app = express();
        this.datasources = [];
    }

    getRunningPort() {
        return this.config.port ?? 3000;
    }

    getApiUrl(absolute = false): string {
        let url = '';
        if (absolute) {
            url = 'http://localhost:' + this.getRunningPort();
        }
        url += this.config.graphQlConfig?.urlApi ?? '/api';
        return url;
    }

    getDefaultDatasource() {
        return this.datasources.length > 0 ? this.datasources[0] : null
    }

    async initDataSource() {
        if (this.config.datasource) {
            const entities = this.config.datasource.entities;
            let entitiesPath = '';
            if (Array.isArray(entities)) {
                entitiesPath = entities.join()
            }

            logger.verbose("🗃️ App use datasource :" + this.config.datasource.type + " " + entitiesPath);
            const dataSource = new DataSource(this.config.datasource);
            await dataSource.initialize().then(() => {
                logger.verbose("️️🗃️ Data Source has been initialized!")
                this.datasources.push(dataSource)
            })
                .catch((err) => {
                    logger.error("🗃️ Error during Data Source initialization")
                    console.log(err)
                })
        }
    }

    async initWebServer() {
        this.httpServer = http.createServer(this.app);
        const port = this.getRunningPort()
        await new Promise((resolve, reject) => {
            this.httpServer.listen(port, () => {
                logger.verbose(`🟢 App listening on port ${port}`)
                resolve(true)
            })
        })

        if (this.config.webConfig) {
            if (this.config.webConfig.pathStatic) {
                logger.verbose("🕸️ App use static path :" + this.config.webConfig.pathStatic);
                this.app.use(express.static(this.config.webConfig.pathStatic));
            }
            if (this.config.webConfig.pathActionGlob) {
                const actionFiles = glob.sync(this.config.webConfig.pathActionGlob)
                logger.verbose(actionFiles.length + ' web actions found with ' + this.config.webConfig.pathActionGlob)
                actionFiles.forEach((actionFile) => {
                    import(actionFile).then((action) => {
                        if (action.route && action.default) {
                            const route = action.route
                            // Todo understand this    js as module
                            const req2resAction = action.default.default ?? action.default
                            logger.verbose(`🕸️ Route ${route} added`)
                            this.app.get(action.route, req2resAction)
                        }
                    });
                });
            }
        }
    }

    async initGraphQL() {
        logger.verbose('Init GraphQL');
        if (!this.config.graphQlConfig) {
            logger.verbose('No GraphQL config found... Skip');
            return false;
        }

        logger.verbose('GraphQL config found');
        this.gqlSchemaBuilder = new gqlSchemaBuilder(
            this.config.graphQlConfig.pathGraphqlGlob,
            this.config.graphQlConfig.pathResolverGlob
        );

        const executableSchema = await this.gqlSchemaBuilder.build()

        const plugins = [
            // Proper shutdown for the HTTP server.
            ApolloServerPluginDrainHttpServer({httpServer: this.httpServer}),
        ];

        if (executableSchema.getSubscriptionType()) {
            const ApiUrlSubscriptions = '-subscriptions'
            this.wsServer = new WebSocketServer({
                server: this.httpServer,
                path: this.getApiUrl() + ApiUrlSubscriptions
            })
            const wsServerCleanup = useServer({schema: executableSchema}, this.wsServer);
            plugins.push(// Proper shutdown for the WebSocket server.
                {
                    async serverWillStart() {
                        return {
                            async drainServer() {
                                await wsServerCleanup.dispose();
                            },
                        };
                    },
                }
            )
            logger.verbose(`🚀 GraphQL url ${this.getApiUrl(true) + ApiUrlSubscriptions} (SubscriptionType detected in schema)`)
        }


        this.gqlServer = new ApolloServer<AppContext>({
            schema: executableSchema,
            plugins,
        });

        return true;
    }

    async run() {

        await this.initWebServer()
        await Promise.all([
            this.initDataSource(),
            this.initGraphQL(),
            // this.initSubscription()
        ])

        let status: GlobalServerStatus = {
            running: false,
            graphqlUrl: null
        }

        if (this.gqlServer) {

            await this.gqlServer.start();

            this.app.use(
                this.getApiUrl(),
                cors<cors.CorsRequest>(),
                express.json(),
                expressMiddleware(this.gqlServer, {
                    context: async ({req}) => ({
                        token: req.headers.token,
                        datasource: this.getDefaultDatasource(),
                    }),
                }),
            )

            status.graphqlUrl = this.getApiUrl(true);
            logger.verbose(`🚀 GraphQL url ${status.graphqlUrl}`)
        } else {

        }

        status.running = true;
        return status;
    }

    async stop() {
        this.datasources.forEach((ds) => ds.destroy())
        await this.httpServer.close();
        logger.verbose(`🔴 App closed`)
    }
}
