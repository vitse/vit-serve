# Vit-serve

Vit-serve is global server to run with node. It's build with Express, Appolo Server and TypeOrm.

Install it
Define where to find your :
 * *.action.ts files (to serve misc. content)
 * *.graphql + *.resolver.ts (to activate and provide GraphQL api)
 * single datasource config based on TypeOrm

 ````
 const gs = new GlobalServer(
    {
        webConfig: {
            pathActionGlob:  process.cwd() + '/set/*.action.ts',
        },
        graphQlConfig: {
            urlApi: '/api',
            pathGraphqlGlob: process.cwd() + '/set/*.graphql',
            pathResolverGlob: process.cwd() + '/set/*.resolver.ts',
        },
        datasource: {
            type: "sqlite",
            database: process.cwd() + '/db.sqlite',
            entities: [process.cwd() + '/set/entity/*.ts'],
            logging: false,
            synchronize: true
        }
    }
)
gs.run().then((status) => console.log(status))
 ````