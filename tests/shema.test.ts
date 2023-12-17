import gqlSchemaBuilder from '../src/server/gqlSchemaBuilder';
import {GraphQLSchema} from 'graphql/type';

test('Start schema server', async () => {
    const schemaBuilder = new gqlSchemaBuilder(
        process.cwd() + '/tests/set/test-book.graphql',
        process.cwd() + '/tests/set/test-book.resolver.ts'
    )

    const schema = await schemaBuilder.build();
    expect(schema).toBeInstanceOf(GraphQLSchema)
});
