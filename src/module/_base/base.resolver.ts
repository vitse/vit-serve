import {IResolvers} from "@graphql-tools/utils";

const slugSeparator = '-';

const resolvers: IResolvers = {
    Query: {
        model: (parent: any, {slug}: any, context) => {
            const a = slug.split(slugSeparator);
            // return context.datasource.manager.findOneByOrFail(User, {id: a[1]});
        },
    },
    Mutation: {
        model: (parent: any, {slug}: any) => {
            const a = slug.split(slugSeparator);
        },
    },
    Slug: {
        __resolveType: (obj: any) => {
            const {name} = (obj as any).constructor;
            return name;
        },
    },
    MutableSlug: {
        __resolveType: (obj: any) => {
            const {name} = (obj as any).constructor;
            return 'Mutable' + name;
        },
    },
};

export default resolvers;
