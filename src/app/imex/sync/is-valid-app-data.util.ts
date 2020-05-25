import {AppDataComplete} from './sync.model';
import {MODEL_VERSION_KEY} from '../../app.constants';
import {isEntityStateConsistent} from '../../util/check-fix-entity-state-consistency';
import {devError} from '../../util/dev-error';

// TODO unit test this
export const isValidAppData = (data: AppDataComplete): boolean => {
  // TODO remove this later on
  const isCapableModelVersion = data.project && data.project[MODEL_VERSION_KEY] && data.project[MODEL_VERSION_KEY] >= 5;

  return (isCapableModelVersion)

    ? (typeof data === 'object')
    && typeof data.note === 'object'
    && typeof data.bookmark === 'object'
    && typeof data.improvement === 'object'
    && typeof data.obstruction === 'object'
    && typeof data.metric === 'object'
    && typeof data.task === 'object'
    && typeof data.tag === 'object'
    && typeof data.globalConfig === 'object'
    && typeof data.taskArchive === 'object'
    && typeof data.project === 'object'
    && Array.isArray(data.reminders)
    && _isEntityStatesConsistent(data)
    && _isTaskIdsConsistent(data)

    : typeof data === 'object'
    ;
};

const _isTaskIdsConsistent = (data: AppDataComplete): boolean => {
  let allIds = [];

  (data.tag.ids as string[])
    .map(id => data.tag.entities[id])
    .forEach(tag => allIds = allIds.concat(tag.taskIds));

  (data.project.ids as string[])
    .map(id => data.project.entities[id])
    .forEach(project => allIds = allIds
      .concat(project.taskIds)
      .concat(project.backlogTaskIds)
    );

  const notFound = allIds.find(id => !(data.task.ids.includes(id)));

  if (notFound) {
    devError('Inconsistent Task State: Missing task id ' + notFound);
  }
  return !notFound;
};

const _isEntityStatesConsistent = (data: AppDataComplete): boolean => {
  const baseStateKeys = [
    'task',
    'taskArchive',
    'tag',
    'project',
  ];
  const projectStateKeys = [
    'note',
    'bookmark',
    'metric',
    'improvement',
    'obstruction',
  ];

  const brokenItem =
    baseStateKeys.find(key => !isEntityStateConsistent(data[key], key))
    ||
    projectStateKeys.find(projectModelKey => {
      const dataForProjects = data[projectModelKey];
      return Object.keys(dataForProjects).find(projectId =>
        // also allow undefined for project models
        (data[projectId] !== undefined)
        &&
        (!isEntityStateConsistent(data[projectId], `${projectModelKey} pId:${projectId}`))
      );
    });

  return !brokenItem;
};
