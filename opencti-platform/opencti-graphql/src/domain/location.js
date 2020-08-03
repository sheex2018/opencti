import { pipe, assoc, dissoc, filter } from 'ramda';
import { createEntity, listEntities, loadEntityById } from '../database/grakn';
import { BUS_TOPICS } from '../config/conf';
import { notify } from '../database/redis';
import {
  ABSTRACT_STIX_CORE_OBJECT,
  ABSTRACT_STIX_DOMAIN_OBJECT,
  ENTITY_TYPE_LOCATION,
  isStixDomainObjectLocation,
} from '../utils/idGenerator';

export const findById = async (locationId) => {
  return loadEntityById(locationId, ENTITY_TYPE_LOCATION);
};

export const findAll = async (args) => {
  let types = [];
  if (args.types && args.types.length > 0) {
    types = filter((type) => isStixDomainObjectLocation(type), args.types);
  }
  if (types.length === 0) {
    types.push(ABSTRACT_STIX_CORE_OBJECT);
  }
  return listEntities(types, ['name', 'description', 'aliases'], args);
};

export const addLocation = async (user, location) => {
  const locationToCreate = pipe(assoc('x_opencti_location_type', location.type), dissoc('type'))(location);
  const created = await createEntity(user, locationToCreate, location.type);
  return notify(BUS_TOPICS[ABSTRACT_STIX_DOMAIN_OBJECT].ADDED_TOPIC, created, user);
};