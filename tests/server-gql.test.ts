import GlobalServer from "../src";

test('Start server With graphql feature', async () => {
    const config = {
        port: 3001,
        graphQlConfig: {
            urlApi: '/test-api',
            pathGraphqlGlob: process.cwd() + '/tests/set/*.graphql',
            pathResolverGlob: process.cwd() + '/tests/set/*.resolver.ts',
        }
    }
    const gs = new GlobalServer(config);
    const status = await gs.run()
    expect(status.running).toBe(true);
    expect(status.graphqlUrl).toBe('http://localhost:' + config.port + config.graphQlConfig.urlApi);
    await gs.stop()
});
