import { withFilter } from 'graphql-subscriptions';
import { BUS_TOPICS } from '../config/conf';
import {
  addStixCyberObservable,
  findAll,
  findById,
  indicators,
  stixCyberObservableAddRelation,
  stixCyberObservableAddRelations,
  stixCyberObservableAskEnrichment,
  stixCyberObservableCleanContext,
  stixCyberObservableDelete,
  stixCyberObservableDeleteRelation,
  stixCyberObservableEditContext,
  stixCyberObservableEditField,
  stixCyberObservablesNumber,
  stixCyberObservablesTimeSeries,
  stixCyberObservableExportAsk,
  stixCyberObservableExportPush,
} from '../domain/stixCyberObservable';
import { pubsub } from '../database/redis';
import withCancel from '../graphql/subscriptionWrapper';
import { workForEntity } from '../domain/work';
import { REL_INDEX_PREFIX } from '../database/elasticSearch';
import { connectorsForEnrichment } from '../domain/enrichment';
import { convertDataToStix } from '../database/stix';
import { stixCoreRelationships } from '../domain/stixCoreObject';
import { filesListing } from '../database/minio';
import {
  RELATION_CREATED_BY,
  RELATION_OBJECT,
  RELATION_OBJECT_LABEL,
  RELATION_OBJECT_MARKING,
  RELATION_RELATED_TO,
} from '../utils/idGenerator';

const stixCyberObservableResolvers = {
  Query: {
    stixCyberObservable: (_, { id }) => findById(id),
    stixCyberObservables: (_, args) => findAll(args),
    stixCyberObservablesTimeSeries: (_, args) => stixCyberObservablesTimeSeries(args),
    stixCyberObservablesNumber: (_, args) => stixCyberObservablesNumber(args),
    stixCyberObservablesExportFiles: (_, { first, context }) =>
      filesListing(first, 'export', 'stix-observable', null, context),
  },
  StixCyberObservablesOrdering: {
    objectMarking: `${REL_INDEX_PREFIX}${RELATION_OBJECT_MARKING}.definition`,
    objectLabel: `${REL_INDEX_PREFIX}${RELATION_OBJECT_LABEL}.value`,
  },
  StixCyberObservablesFilter: {
    createdBy: `${REL_INDEX_PREFIX}${RELATION_CREATED_BY}.internal_id`,
    markedBy: `${REL_INDEX_PREFIX}${RELATION_OBJECT_MARKING}.internal_id`,
    labelledBy: `${REL_INDEX_PREFIX}${RELATION_OBJECT_LABEL}.internal_id`,
    relatedTo: `${REL_INDEX_PREFIX}${RELATION_RELATED_TO}.internal_id`,
    objectContained: `${REL_INDEX_PREFIX}${RELATION_OBJECT}.internal_id`,
  },
  StixCyberObservable: {
    indicators: (stixCyberObservable) => indicators(stixCyberObservable.id),
    jobs: (stixCyberObservable, args) => workForEntity(stixCyberObservable.id, args),
    connectors: (stixCyberObservable, { onlyAlive = false }) =>
      connectorsForEnrichment(stixCyberObservable.entity_type, onlyAlive),
    stixCoreRelationships: (rel, args) => stixCoreRelationships(rel.id, args),
    toStix: (stixCyberObservable) =>
      convertDataToStix(stixCyberObservable).then((stixData) => JSON.stringify(stixData)),
  },
  Mutation: {
    stixCyberObservableEdit: (_, { id }, { user }) => ({
      delete: () => stixCyberObservableDelete(user, id),
      fieldPatch: ({ input }) => stixCyberObservableEditField(user, id, input),
      contextPatch: ({ input }) => stixCyberObservableEditContext(user, id, input),
      contextClean: () => stixCyberObservableCleanContext(user, id),
      relationAdd: ({ input }) => stixCyberObservableAddRelation(user, id, input),
      relationsAdd: ({ input }) => stixCyberObservableAddRelations(user, id, input),
      relationDelete: ({ relationId, toId, relationship_type }) =>
        stixCyberObservableDeleteRelation(user, id, relationId, toId, relationship_type),
      askEnrichment: ({ connectorId }) => stixCyberObservableAskEnrichment(id, connectorId),
    }),
    stixCyberObservableAdd: (_, { input }, { user }) => addStixCyberObservable(user, input),
    stixCyberObservablesExportAsk: (_, args) => stixCyberObservableExportAsk(args),
    stixCyberObservablesExportPush: (_, { file, context, listArgs }, { user }) =>
      stixCyberObservableExportPush(user, null, file, context, listArgs),
  },
  Subscription: {
    stixCyberObservable: {
      resolve: /* istanbul ignore next */ (payload) => payload.instance,
      subscribe: /* istanbul ignore next */ (_, { id }, { user }) => {
        stixCyberObservableEditContext(user, id);
        const filtering = withFilter(
          () => pubsub.asyncIterator(BUS_TOPICS.StixCyberObservable.EDIT_TOPIC),
          (payload) => {
            if (!payload) return false; // When disconnect, an empty payload is dispatched.
            return payload.user.id !== user.id && payload.instance.id === id;
          }
        )(_, { id }, { user });
        return withCancel(filtering, () => {
          stixCyberObservableCleanContext(user, id);
        });
      },
    },
  },
};

export default stixCyberObservableResolvers;