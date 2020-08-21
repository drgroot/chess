import {
  add,
  del,
  addMetadata,
  delMetadata,
  addAnnotation,
  delAnnotation,
  addMove,
  delMove,
} from './write';
import {
  find,
  findPosition,
  getRepertoire,
  noAnnotations,
} from './find';

export const rejectFun = (method, arg, msg, model = 'match') => Promise.reject(new Error(`[${model}]invalid argument for ${method}, ${arg}. ${msg}`));
const reject = rejectFun;

const handle = (input) => {
  const {
    method,
    methodData,
  } = input;

  let op;
  switch (method) {
    case 'metadata':
      if (methodData.operation === 'add') {
        op = addMetadata(methodData.matchid, methodData.metadata);
      } else if (methodData.operation === 'delete') {
        op = delMetadata(methodData.matchid, methodData.metadataid);
      }
      break;
    case 'move':
      if (methodData.operation === 'add') {
        op = addMove(methodData.matchid, methodData.move);
      } else if (methodData.operation === 'delete') {
        op = delMove(methodData.matchid, methodData.moveid);
      }
      break;
    case 'annotation':
      if (methodData.operation === 'add') {
        op = addAnnotation(methodData.matchid, methodData.moveid, methodData.annotation);
      } else if (methodData.operation === 'delete') {
        op = delAnnotation(methodData.matchid, methodData.moveid, methodData.annotationid);
      }
      break;
    case 'add':
      if (typeof methodData !== 'object') {
        return reject(method, methodData, 'should be object');
      }

      op = add(methodData);
      break;
    case 'delete':
      if (typeof methodData !== 'string') {
        return reject(method, methodData, 'pass matchid to delete a match');
      }
      op = del(methodData);
      break;
    case 'find':
      if (methodData.constructor === Array) {
        if (methodData.length > 3 || methodData.length === 0) {
          return reject(method, methodData, `invalid number of arguments passed in array ${methodData.length}. supports maximum 2.`);
        }

        for (const item of methodData) {
          if (typeof item !== 'object') {
            return reject(method, item, 'data passed is not an object');
          }
        }
      } else if (typeof methodData !== 'object') {
        return reject(method, methodData, 'data passed is not an object');
      }

      op = find(methodData);
      break;
    case 'findPosition':
      if (typeof methodData === 'string') {
        op = findPosition(methodData);
      } else if (typeof methodData.position === 'string') {
        const { position, ...constraints } = methodData;
        op = findPosition(position, constraints);
      } else {
        return reject(method, methodData, 'requires a position in the form of a string');
      }
      break;
    case 'getRepertoire':
      if (typeof methodData.color !== 'string' || (!['white', 'black'].includes(methodData.color))) {
        return reject(method, methodData.color, 'colors should be white or black');
      }

      if (typeof methodData.user !== 'string') {
        return reject(method, methodData.user, 'user should be a string');
      }

      op = getRepertoire(methodData.user, methodData.color);
      break;
    case 'noAnnotations':
      op = noAnnotations(methodData.version, methodData.annotator);
      break;
    default:
      return Promise.reject(new Error(`[match]invalid method, ${method}`));
  }

  return op;
};

export default handle;
