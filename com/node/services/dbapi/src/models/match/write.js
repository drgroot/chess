import Match from './schema';

const find = (id) => Match.findById(id);

export const del = (id) => Match.deleteOne({ _id: id });

export const add = (input) => {
  const match = new Match(input);
  return match.save();
};

// methods to add/delete metadata
export const addMetadata = (matchid, metadata) => find(matchid)
  .then((match) => {
    match.metadata.push(metadata);
    return match.save();
  });
export const delMetadata = (matchid, metadataid) => find(matchid)
  .then((match) => {
    match.metadata.id(metadataid).remove();
    return match.save();
  });

// methods to add/delete moves
export const addMove = (matchid, move) => find(matchid)
  .then((match) => {
    match.moves.push(move);
    return match.save();
  });
export const delMove = (matchid, moveid) => find(matchid)
  .then((match) => {
    match.moves.id(moveid).remove();
    return match.save();
  });

// methods to add/delete annotation
export const addAnnotation = (matchid, moveid, annotation) => find(matchid)
  .then((match) => {
    match.moves.id(moveid).annotations.push(annotation);
    return match.save();
  });
export const delAnnotation = (matchid, moveid, annotationid) => find(matchid)
  .then((match) => {
    match.moves.id(moveid).annotations.id(annotationid).remove();
    return match.save();
  });
