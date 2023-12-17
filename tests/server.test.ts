import GlobalServer from "../src";

test('Start useless server', async () => {
    const gs = new GlobalServer({port: 3000});
    const status = await gs.run()
    expect(status.running).toBe(true);
    await gs.stop()
});
