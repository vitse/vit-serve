import GlobalServer from "../src";
import {SqliteConnectionOptions} from "typeorm/driver/sqlite/SqliteConnectionOptions";

test('Start server With datasource feature', async () => {
    const config = {
        port: 3003,
        datasource: <SqliteConnectionOptions>{
            type: "sqlite",
            database: process.cwd() + '/tests/sandbox/test.sqlite',
            entities: [process.cwd() + '/tests/set/entity/*.ts'],
            logging: false,
            synchronize: true
        }
    }
    const gs = new GlobalServer(config);
    const status = await gs.run()
    expect(status.running).toBe(true);
    expect(gs.getDefaultDatasource()).not.toBeNull()


    await gs.stop()
});
