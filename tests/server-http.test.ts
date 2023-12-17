import GlobalServer from "../src";

test('Start server with http feature', async () => {
    const gs = new GlobalServer({
        port: 3002,
        webConfig: {
            pathActionGlob:  process.cwd() + '/tests/set/*.action.ts',
        }
    });
    await gs.run()

    const response = await fetch('http://localhost:3002/hello')
    const body = await response.text()
    await gs.stop()
    expect(body).toBe('Hello World!')
});
