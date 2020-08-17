import { rejectFun } from '../match';
import User from './schema';

const reject = (method, args, msg) => rejectFun(method, args, msg, 'userAuth');

const findByToken = (name, token) => User.findOne({
  authentication: { $elemMatch: { name, token } },
}).lean().exec();

const findByUsername = (username) => User.findOne({ username }).lean().exec();

export const findOrCreate = (name, token, username) => findByToken(name, token)
  .then((user) => {
    if (user) {
      const [auth] = user.authentication
        .filter((a) => a.name === name && a.token === token);
      if (!auth.active) {
        return reject('login', { name, token, username }, 'account decativated');
      }

      return user;
    }

    const newUser = new User({ username, authentication: { name, token } });
    return newUser.save();
  });

export const addAuthentication = (name, token, username) => findByUsername(username)
  .then((currentUser) => findByToken(name, token)
    .then((tokenUser) => {
      if (!currentUser) {
        return reject('addAuth', { name, token, username }, 'user does not exist');
      }

      // add, no user has this token
      if (!tokenUser) {
        currentUser.authentication.push({ name, token, active: true });
        return User.findOneAndUpdate({ username }, { authentication: currentUser.authentication })
          .then(() => currentUser);
      }

      // error, another user is using this token
      if (tokenUser.username !== currentUser.username) {
        return reject('addAuth', { name, token, username }, 'token already used');
      }

      // in this event, check to make sure authentication is active. if it is active, activate it.
      const [auth] = tokenUser.authentication
        .filter((a) => a.name === name && a.token === token);
      if (!auth.active) {
        auth.active = true;
        return User.findOneAndUpdate({ username }, { authentication: tokenUser.authentication })
          .then(() => tokenUser);
      }

      return currentUser;
    }));

export const removeAuthentication = (name, token, username) => findByUsername(username)
  .then((currentUser) => findByToken(name, token)
    .then((tokenUser) => {
      if (!currentUser || !tokenUser) {
        // reject user does not exist
        return reject('removeAuth', { name, token, username }, 'user or token does not exist');
      }

      if (currentUser.username !== tokenUser.username) {
        // token used by another user
        return reject('removeAuth', { name, token, username }, 'token does not belong to user');
      }

      const [auth] = currentUser.authentication
        .filter((a) => a.name === name && a.token === token);
      if (auth.active) {
        auth.active = false;
        return User.findOneAndUpdate({ username }, { authentication: currentUser.authentication })
          .then(() => currentUser);
      }

      return currentUser;
    }));
