import {GraphQLFileLoader} from "@graphql-tools/graphql-file-loader";
import {loadSchema} from "@graphql-tools/load";
import {makeExecutableSchema} from "@graphql-tools/schema";
import {glob} from "glob";
import logger from "./logger";


export default class gqlSchemaBuilder
{
    private readonly pathGraphql:string;
    private readonly pathResolvers:string;
    constructor(pathGraphql:string, pathResolvers:string) {
        this.pathGraphql = pathGraphql;
        this.pathResolvers = pathResolvers;
    }

    public build = async () => {
        logger.verbose('Load GraphQl schema from ' + this.pathGraphql + ' (path.graphql)')
        const typeDefs = await loadSchema(this.pathGraphql, {
            loaders: [new GraphQLFileLoader()]
        })

        logger.verbose('Load Resolvers from ' + this.pathResolvers + ' (path.resolvers)')
        const resolvers = {};
        const resolverFiles = glob.sync(this.pathResolvers)
        logger.verbose(resolverFiles.length + ' resolvers found')
        resolverFiles.forEach((resolverFile) => {
            resolverFile = resolverFile.replace('\.ts', '')
            import(resolverFile).then((resolver) => {
                Object.assign(resolvers, resolver)
                logger.verbose(resolverFile + ' added')
            });
        });

        const executableSchema = makeExecutableSchema({
            typeDefs,
            resolvers,
        });

        return executableSchema
    }
}





