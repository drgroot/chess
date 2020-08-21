import { rejectFun } from '../match';
import User from './schema';

const promise = (fun) => new Promise((resolve) => fun((e, u) => resolve(u)));

const reject = (method, args, msg) => rejectFun(method, args, msg, 'userAuth');

const findByToken = (name, token) => promise((cb) => User.findOne({
  authentication: { $elemMatch: { name, token } },
}, cb));

export const findByUsername = (username) => promise((cb) => User.findOne({ username }, cb));

export const findOrCreate = (name, token, username) => findByToken(name, token)
  .then((user) => {
    if (user) {
      const auth = user.authentication
        .find((a) => a.name === name && a.token === token);
      if (auth && auth.active === false) {
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

      if (tokenUser) {
        // error, another user is using this token
        if (tokenUser.username !== currentUser.username) {
          return reject('addAuth', { name, token, username }, 'token already used');
        }

        // in this event, check to make sure authentication is active. if it is active, activate it.
        const auth = tokenUser.authentication
          .find((a) => a.name === name && a.token === token);
        if (auth && !auth.active) {
          auth.active = true;
          return tokenUser.save();
        }
      }

      // make sure currentUser does not have this source already
      const source = currentUser.authentication.find((a) => a.name === name);
      if (source) {
        return reject('addAuth', { name, username }, 'user is already has this source!');
      }

      // add, since no user has this token
      currentUser.authentication.push({ name, token, active: true });
      return currentUser.save();
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

      const auth = currentUser.authentication
        .find((a) => a.name === name && a.token === token);
      if (auth && auth.active) {
        auth.active = false;
        return currentUser.save();
      }

      return currentUser;
    }));
